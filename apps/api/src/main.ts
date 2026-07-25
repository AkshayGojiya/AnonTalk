import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import cookieParser from "cookie-parser";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.use(cookieParser());

  const config = app.get(ConfigService);
  app.enableCors({
    origin: config.get<string>("WEB_APP_URL"),
    credentials: true,
  });

  const port = config.get<number>("PORT") ?? 3000;
  await app.listen(port);
}

bootstrap();
