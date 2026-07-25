import type { INestApplicationContext } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { UserStatus } from "@anontalk/shared";
import { createAdapter } from "@socket.io/redis-adapter";
import jwt from "jsonwebtoken";
import type { ServerOptions, Socket } from "socket.io";
import { PrismaService } from "../prisma/prisma.service";
import type { JwtPayload } from "../auth/types";
import { REDIS_PUB_CLIENT, REDIS_SUB_CLIENT } from "./redis.constants";

export class RedisIoAdapter extends IoAdapter {
  constructor(private readonly app: INestApplicationContext) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const config = this.app.get(ConfigService);
    const prisma = this.app.get(PrismaService);
    const pubClient = this.app.get(REDIS_PUB_CLIENT);
    const subClient = this.app.get(REDIS_SUB_CLIENT);

    const server = super.createIOServer(port, {
      ...options,
      transports: ["websocket"],
      cors: {
        origin: config.get<string>("WEB_APP_URL"),
        credentials: true,
      },
    });

    server.adapter(createAdapter(pubClient, subClient));

    server.use(async (socket: Socket, next: (err?: Error) => void) => {
      try {
        const token = socket.handshake.auth?.["token"] as string | undefined;
        if (!token) {
          next(new Error("unauthorized"));
          return;
        }

        const payload = jwt.verify(token, config.get<string>("JWT_ACCESS_SECRET")!) as JwtPayload;
        const user = await prisma.user.findUnique({ where: { id: payload.sub } });

        if (!user || user.status === UserStatus.BANNED || user.tokenVersion !== payload.tokenVersion) {
          next(new Error("unauthorized"));
          return;
        }

        socket.data.user = user;
        next();
      } catch {
        next(new Error("unauthorized"));
      }
    });

    return server;
  }
}
