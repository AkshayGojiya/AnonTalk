import { randomUUID } from "node:crypto";
import { Inject, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import {
  ChatClientEvent,
  ChatServerEvent,
  SessionEndReason,
  UserStatus,
  joinQueuePayloadSchema,
  skipPayloadSchema,
  sendMessagePayloadSchema,
  typingPayloadSchema,
} from "@anontalk/shared";
import type { User } from "@prisma/client";
import type { Redis } from "ioredis";
import type { Server } from "socket.io";
import { REDIS_APP_SUB_CLIENT, REDIS_CLIENT } from "../redis/redis.constants";
import { FORCE_LOGOUT_CHANNEL, MATCH_CHANNEL, SESSION_ENDED_CHANNEL } from "../redis/pubsub.constants";
import { RateLimiterService } from "../common/rate-limiter.service";
import { MatchmakingService } from "../matchmaking/matchmaking.service";
import { SessionsService } from "../sessions/sessions.service";
import { UsersService } from "../users/users.service";
import type { AuthenticatedSocket, ForceLogoutMessage, MatchMessage, SessionEndedMessage } from "./types";

const GRACE_SWEEP_INTERVAL_MS = 3_000;
const MAX_MATCH_RETRY_DEPTH = 3;

const JOIN_QUEUE_LIMIT = 8;
const JOIN_QUEUE_WINDOW_SECONDS = 5;
const SEND_MESSAGE_LIMIT = 20;
const SEND_MESSAGE_WINDOW_SECONDS = 10;

// A Redis Set (not a plain counter) so multiple tabs/devices for the same user
// only count once, and a disconnect from one of several sockets doesn't
// decrement the count until the user has truly left.
const ONLINE_USERS_KEY = "online:users";

function room(sessionId: string) {
  return `session:${sessionId}`;
}

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit, OnModuleDestroy {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly userSockets = new Map<string, Set<AuthenticatedSocket>>();
  private sweepInterval?: NodeJS.Timeout;

  constructor(
    private readonly matchmakingService: MatchmakingService,
    private readonly sessionsService: SessionsService,
    private readonly usersService: UsersService,
    private readonly rateLimiter: RateLimiterService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(REDIS_APP_SUB_CLIENT) private readonly appSub: Redis,
  ) {}

  async onModuleInit() {
    await this.appSub.subscribe(MATCH_CHANNEL, SESSION_ENDED_CHANNEL, FORCE_LOGOUT_CHANNEL);
    this.appSub.on("message", (channel: string, message: string) => {
      if (channel === MATCH_CHANNEL) {
        this.onMatchMessage(JSON.parse(message) as MatchMessage).catch((err) =>
          this.logger.error("Failed to handle match message", err),
        );
      } else if (channel === SESSION_ENDED_CHANNEL) {
        this.onSessionEndedMessage(JSON.parse(message) as SessionEndedMessage);
      } else if (channel === FORCE_LOGOUT_CHANNEL) {
        this.onForceLogoutMessage(JSON.parse(message) as ForceLogoutMessage);
      }
    });

    this.sweepInterval = setInterval(() => {
      this.sweepDisconnectedSessions().catch((err) => this.logger.error("Grace sweep failed", err));
    }, GRACE_SWEEP_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.sweepInterval) clearInterval(this.sweepInterval);
  }

  async handleConnection(socket: AuthenticatedSocket) {
    const user = socket.data.user;
    if (!user) {
      socket.disconnect(true);
      return;
    }

    const isFirstSocketForUser = this.registerSocket(user.id, socket);
    if (isFirstSocketForUser) {
      const count = await this.redis.sadd(ONLINE_USERS_KEY, user.id);
      if (count > 0) await this.broadcastOnlineCount();
    }
    socket.emit(ChatServerEvent.ONLINE_COUNT, { count: await this.redis.scard(ONLINE_USERS_KEY) });

    const sessionId = await this.sessionsService.getSessionIdForUser(user.id);
    if (!sessionId) return;

    await this.sessionsService.cancelDisconnectGrace(user.id, sessionId);

    const emitted = await this.emitCurrentSession(user.id, socket, sessionId);
    if (!emitted) return;

    this.server.to(room(sessionId)).emit(ChatServerEvent.PEER_RECONNECTED, { sessionId });
  }

  private async broadcastOnlineCount() {
    const count = await this.redis.scard(ONLINE_USERS_KEY);
    this.server.emit(ChatServerEvent.ONLINE_COUNT, { count });
  }

  /** Looks up `sessionId`'s hash and, if it still exists, joins the socket to its
   * room and re-sends `match_found` -- shared by the connect-time resume path and
   * the on-demand `check_session` handler below. */
  private async emitCurrentSession(userId: string, socket: AuthenticatedSocket, sessionId: string): Promise<boolean> {
    const session = await this.sessionsService.getSession(sessionId);
    if (!session) return false;

    socket.join(room(sessionId));
    const isUserA = session.userA === userId;
    socket.emit(ChatServerEvent.MATCH_FOUND, {
      sessionId,
      peer: isUserA ? session.peerIdentityA : session.peerIdentityB,
      startedAt: session.startedAt,
    });
    return true;
  }

  async handleDisconnect(socket: AuthenticatedSocket) {
    const user = socket.data.user;
    if (!user) return;

    this.unregisterSocket(user.id, socket);
    if (this.userSockets.has(user.id)) return; // user still has other live connections

    await this.redis.srem(ONLINE_USERS_KEY, user.id);
    await this.broadcastOnlineCount();

    const sessionId = await this.sessionsService.getSessionIdForUser(user.id);
    if (sessionId) {
      await this.sessionsService.scheduleDisconnectGrace(user.id, sessionId);
    } else {
      await this.matchmakingService.leaveQueue(user.id);
    }
  }

  @SubscribeMessage(ChatClientEvent.JOIN_QUEUE)
  async handleJoinQueue(@ConnectedSocket() socket: AuthenticatedSocket, @MessageBody() body: unknown) {
    const parsed = joinQueuePayloadSchema.safeParse(body);
    if (!parsed.success) {
      socket.emit(ChatServerEvent.ERROR, { code: "invalid_payload", message: "Invalid join_queue payload" });
      return;
    }

    const allowed = await this.rateLimiter.isAllowed(
      `join_queue:${socket.data.user.id}`,
      JOIN_QUEUE_LIMIT,
      JOIN_QUEUE_WINDOW_SECONDS,
    );
    if (!allowed) {
      socket.emit(ChatServerEvent.ERROR, { code: "rate_limited", message: "Slow down a little" });
      return;
    }

    const user = await this.usersService.updateMode(socket.data.user.id, parsed.data.mode);
    socket.data.user = user;
    await this.attemptMatchOrQueue(user, socket);
  }

  @SubscribeMessage(ChatClientEvent.LEAVE_QUEUE)
  async handleLeaveQueue(@ConnectedSocket() socket: AuthenticatedSocket) {
    await this.matchmakingService.leaveQueue(socket.data.user.id);
  }

  // Lets a freshly-mounted chat page (e.g. a direct/bookmarked URL, or a page
  // reload) confirm the sessionId in its URL is actually this user's live
  // session, rather than trusting the URL param alone -- responds with either
  // match_found for the user's real active session (which may not be the same
  // sessionId the client asked about) or an error if they have none at all.
  @SubscribeMessage(ChatClientEvent.CHECK_SESSION)
  async handleCheckSession(@ConnectedSocket() socket: AuthenticatedSocket) {
    const user = socket.data.user;
    const sessionId = await this.sessionsService.getSessionIdForUser(user.id);
    if (!sessionId) {
      socket.emit(ChatServerEvent.ERROR, { code: "no_active_session", message: "This chat no longer exists" });
      return;
    }

    await this.emitCurrentSession(user.id, socket, sessionId);
  }

  @SubscribeMessage(ChatClientEvent.SKIP)
  async handleSkip(@ConnectedSocket() socket: AuthenticatedSocket, @MessageBody() body: unknown) {
    const parsed = skipPayloadSchema.safeParse(body);
    if (!parsed.success) {
      socket.emit(ChatServerEvent.ERROR, { code: "invalid_payload", message: "Invalid skip payload" });
      return;
    }

    const user = socket.data.user;
    const activeSessionId = await this.sessionsService.getSessionIdForUser(user.id);
    if (activeSessionId !== parsed.data.sessionId) {
      socket.emit(ChatServerEvent.ERROR, { code: "not_in_session", message: "Not part of this session" });
      return;
    }

    socket.leave(room(parsed.data.sessionId));
    await this.sessionsService.endSessionAndNotify(parsed.data.sessionId, SessionEndReason.SKIP);

    await this.attemptMatchOrQueue(user, socket);
  }

  @SubscribeMessage(ChatClientEvent.SEND_MESSAGE)
  async handleSendMessage(@ConnectedSocket() socket: AuthenticatedSocket, @MessageBody() body: unknown) {
    const parsed = sendMessagePayloadSchema.safeParse(body);
    if (!parsed.success) {
      socket.emit(ChatServerEvent.ERROR, { code: "invalid_payload", message: "Invalid send_message payload" });
      return;
    }

    const user = socket.data.user;
    const activeSessionId = await this.sessionsService.getSessionIdForUser(user.id);
    if (activeSessionId !== parsed.data.sessionId) {
      socket.emit(ChatServerEvent.ERROR, { code: "not_in_session", message: "Not part of this session" });
      return;
    }

    const allowed = await this.rateLimiter.isAllowed(
      `send_message:${user.id}`,
      SEND_MESSAGE_LIMIT,
      SEND_MESSAGE_WINDOW_SECONDS,
    );
    if (!allowed) {
      socket.emit(ChatServerEvent.ERROR, { code: "rate_limited", message: "You're sending messages too fast" });
      return;
    }

    // Re-check live status: a mute/ban applied mid-session must take effect on the
    // very next message, not just at the socket's original connection time.
    const freshUser = await this.usersService.findById(user.id);
    if (!freshUser || freshUser.status !== UserStatus.ACTIVE) {
      socket.emit(ChatServerEvent.ERROR, { code: "muted", message: "You can't send messages right now" });
      return;
    }

    const message = {
      messageId: randomUUID(),
      senderId: user.id,
      content: parsed.data.content,
      sentAt: new Date().toISOString(),
    };
    await this.sessionsService.pushMessage(parsed.data.sessionId, message);

    this.server.to(room(parsed.data.sessionId)).emit(ChatServerEvent.RECEIVE_MESSAGE, {
      sessionId: parsed.data.sessionId,
      ...message,
      clientMsgId: parsed.data.clientMsgId,
    });
  }

  @SubscribeMessage(ChatClientEvent.TYPING_START)
  async handleTypingStart(@ConnectedSocket() socket: AuthenticatedSocket, @MessageBody() body: unknown) {
    await this.relayTyping(socket, body, true);
  }

  @SubscribeMessage(ChatClientEvent.TYPING_STOP)
  async handleTypingStop(@ConnectedSocket() socket: AuthenticatedSocket, @MessageBody() body: unknown) {
    await this.relayTyping(socket, body, false);
  }

  private async relayTyping(socket: AuthenticatedSocket, body: unknown, isTyping: boolean) {
    const parsed = typingPayloadSchema.safeParse(body);
    if (!parsed.success) return;

    const activeSessionId = await this.sessionsService.getSessionIdForUser(socket.data.user.id);
    if (activeSessionId !== parsed.data.sessionId) return;

    socket.to(room(parsed.data.sessionId)).emit(ChatServerEvent.TYPING, {
      sessionId: parsed.data.sessionId,
      isTyping,
    });
  }

  private async attemptMatchOrQueue(user: User, socket: AuthenticatedSocket, depth = 0): Promise<void> {
    const result = await this.matchmakingService.joinQueue(user.id);
    if (result.status === "queued") {
      socket.emit(ChatServerEvent.QUEUE_STATUS, { status: "queued" });
      return;
    }

    const peerUser = await this.usersService.findById(result.peerId);
    if (!peerUser) {
      if (depth >= MAX_MATCH_RETRY_DEPTH) {
        socket.emit(ChatServerEvent.QUEUE_STATUS, { status: "queued" });
        return;
      }
      await this.attemptMatchOrQueue(user, socket, depth + 1);
      return;
    }

    const identityOfSelfForPeer = await this.usersService.buildPublicIdentity(user);
    const identityOfPeerForSelf = await this.usersService.buildPublicIdentity(peerUser);
    const session = await this.sessionsService.createSession(
      user.id,
      peerUser.id,
      identityOfPeerForSelf,
      identityOfSelfForPeer,
    );

    const message: MatchMessage = { sessionId: session.sessionId, userA: user.id, userB: peerUser.id };
    await this.redis.publish(MATCH_CHANNEL, JSON.stringify(message));
  }

  private async onMatchMessage(msg: MatchMessage) {
    const session = await this.sessionsService.getSession(msg.sessionId);
    if (!session) return;

    for (const [userId, isUserA] of [
      [msg.userA, true],
      [msg.userB, false],
    ] as const) {
      const sockets = this.userSockets.get(userId);
      if (!sockets) continue;

      const peerIdentity = isUserA ? session.peerIdentityA : session.peerIdentityB;
      for (const sock of sockets) {
        sock.join(room(msg.sessionId));
        sock.emit(ChatServerEvent.MATCH_FOUND, {
          sessionId: msg.sessionId,
          peer: peerIdentity,
          startedAt: session.startedAt,
        });
      }
    }
  }

  private onSessionEndedMessage(msg: SessionEndedMessage) {
    for (const userId of [msg.userA, msg.userB]) {
      const sockets = this.userSockets.get(userId);
      if (!sockets) continue;

      for (const sock of sockets) {
        sock.leave(room(msg.sessionId));
        sock.emit(ChatServerEvent.SESSION_ENDED, { sessionId: msg.sessionId, reason: msg.reason });
      }
    }
  }

  private onForceLogoutMessage(msg: ForceLogoutMessage) {
    const sockets = this.userSockets.get(msg.userId);
    if (!sockets) return;

    for (const sock of sockets) {
      sock.emit(ChatServerEvent.FORCE_LOGOUT, { reason: msg.reason });
      sock.disconnect(true);
    }
  }

  private async sweepDisconnectedSessions() {
    const expired = await this.sessionsService.sweepExpiredGrace();
    for (const [, sessionId] of expired) {
      await this.sessionsService.endSessionAndNotify(sessionId, SessionEndReason.PEER_DISCONNECTED);
    }
  }

  /** Returns true when this is the user's first live socket (i.e. they were
   * offline a moment ago), so callers can tell when the online count changed. */
  private registerSocket(userId: string, socket: AuthenticatedSocket): boolean {
    const existing = this.userSockets.get(userId);
    if (existing) {
      existing.add(socket);
      return false;
    }
    this.userSockets.set(userId, new Set([socket]));
    return true;
  }

  private unregisterSocket(userId: string, socket: AuthenticatedSocket) {
    const existing = this.userSockets.get(userId);
    if (!existing) return;
    existing.delete(socket);
    if (existing.size === 0) {
      this.userSockets.delete(userId);
    }
  }
}
