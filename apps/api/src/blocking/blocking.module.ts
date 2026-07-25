import { Module } from "@nestjs/common";
import { SessionsModule } from "../sessions/sessions.module";
import { BlockingController } from "./blocking.controller";
import { BlockingService } from "./blocking.service";

@Module({
  imports: [SessionsModule],
  controllers: [BlockingController],
  providers: [BlockingService],
})
export class BlockingModule {}
