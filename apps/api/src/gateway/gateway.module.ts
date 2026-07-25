import { Module } from "@nestjs/common";
import { RateLimiterService } from "../common/rate-limiter.service";
import { MatchmakingModule } from "../matchmaking/matchmaking.module";
import { SessionsModule } from "../sessions/sessions.module";
import { UsersModule } from "../users/users.module";
import { ChatGateway } from "./chat.gateway";

@Module({
  imports: [MatchmakingModule, SessionsModule, UsersModule],
  providers: [ChatGateway, RateLimiterService],
})
export class GatewayModule {}
