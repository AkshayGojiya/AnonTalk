import { Global, Logger, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { REDIS_APP_SUB_CLIENT, REDIS_CLIENT, REDIS_PUB_CLIENT, REDIS_SUB_CLIENT } from "./redis.constants";

const logger = new Logger("Redis");

function attachErrorLogger(client: Redis, label: string): Redis {
  client.on("error", (err) => logger.error(`${label}: ${err.message}`));
  return client;
}

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        attachErrorLogger(new Redis(config.get<string>("REDIS_URL")!), "command"),
    },
    {
      provide: REDIS_PUB_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => attachErrorLogger(new Redis(config.get<string>("REDIS_URL")!), "pub"),
    },
    {
      // Subscriber-role clients: `enableReadyCheck: false` avoids a well-known ioredis
      // bug where its automatic post-reconnect `INFO` ready-check fails with
      // "Connection in subscriber mode" once the client has ever subscribed --
      // reconnects only actually happen against a real (non-local) Redis that drops
      // idle connections, so this was latent until pointed at Upstash.
      provide: REDIS_SUB_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        attachErrorLogger(new Redis(config.get<string>("REDIS_URL")!, { enableReadyCheck: false }), "sub"),
    },
    {
      provide: REDIS_APP_SUB_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        attachErrorLogger(new Redis(config.get<string>("REDIS_URL")!, { enableReadyCheck: false }), "app-sub"),
    },
  ],
  exports: [REDIS_CLIENT, REDIS_PUB_CLIENT, REDIS_SUB_CLIENT, REDIS_APP_SUB_CLIENT],
})
export class RedisModule {}
