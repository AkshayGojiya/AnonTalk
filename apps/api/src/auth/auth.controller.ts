import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthGuard } from "@nestjs/passport";
import { Throttle } from "@nestjs/throttler";
import { exchangeTokenSchema } from "@anontalk/shared";
import type { Request, Response } from "express";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { toCurrentUserDto } from "../users/user.mapper";
import { AuthService } from "./auth.service";
import { GoogleAuthGuard } from "./guards/google-auth.guard";
import type { GoogleProfilePayload } from "./types";

// Stricter than the app-wide default — these endpoints gate login/session issuance,
// so they're worth protecting against brute-force/abuse specifically.
@Throttle({ default: { limit: 10, ttl: 60_000 } })
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Get("google")
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Passport redirects to Google's consent screen; body never runs.
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as GoogleProfilePayload;
    const webAppUrl = this.config.get<string>("WEB_APP_URL")!;

    const result = await this.authService.validateOAuthLogin(profile);
    if (!result.ok) {
      res.redirect(`${webAppUrl}/login?error=${result.reason}`);
      return;
    }

    const code = await this.authService.createExchangeCode(result.user.id);
    res.redirect(`${webAppUrl}/auth/callback?code=${code}`);
  }

  @Post("token")
  async exchangeToken(
    @Body(new ZodValidationPipe(exchangeTokenSchema)) body: { code: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = await this.authService.consumeExchangeCode(body.code);
    if (!userId) {
      return { error: "invalid_or_expired_code" };
    }

    const user = await this.authService.getUserById(userId);
    if (!user) {
      return { error: "user_not_found" };
    }

    const { accessToken, refreshToken } = this.authService.issueTokens(user);
    res.cookie("refresh_token", refreshToken, this.authService.refreshCookieOptions());

    return { accessToken, user: toCurrentUserDto(user) };
  }

  @Post("refresh")
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.["refresh_token"];
    if (!token) {
      return { error: "no_refresh_token" };
    }

    const user = await this.authService.verifyRefreshToken(token);
    const { accessToken, refreshToken } = this.authService.issueTokens(user);
    res.cookie("refresh_token", refreshToken, this.authService.refreshCookieOptions());

    return { accessToken };
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("refresh_token", { path: "/auth" });
    return { ok: true };
  }
}
