import { Module } from "@nestjs/common";
import { MatchmakingModule } from "../matchmaking/matchmaking.module";
import { SessionsModule } from "../sessions/sessions.module";
import { UsersModule } from "../users/users.module";
import { ChatGateway } from "./chat.gateway";

@Module({
  imports: [MatchmakingModule, SessionsModule, UsersModule],
  providers: [ChatGateway],
})
export class GatewayModule {}
