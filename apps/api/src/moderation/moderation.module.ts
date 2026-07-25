import { Module } from "@nestjs/common";
import { SessionsModule } from "../sessions/sessions.module";
import { ModerationController } from "./moderation.controller";
import { ModerationService } from "./moderation.service";

@Module({
  imports: [SessionsModule],
  controllers: [ModerationController],
  providers: [ModerationService],
})
export class ModerationModule {}
