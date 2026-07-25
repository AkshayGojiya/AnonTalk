import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, type Profile } from "passport-google-oauth20";
import type { GoogleProfilePayload } from "../types";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>("GOOGLE_CLIENT_ID")!,
      clientSecret: config.get<string>("GOOGLE_CLIENT_SECRET")!,
      callbackURL: config.get<string>("GOOGLE_CALLBACK_URL")!,
      scope: ["email", "profile"],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err: Error | null, user?: GoogleProfilePayload) => void,
  ) {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error("Google profile did not include an email address"));
      return;
    }

    const payload: GoogleProfilePayload = {
      googleId: profile.id,
      email,
      emailVerified: profile.emails?.[0]?.verified === true,
      displayName: profile.displayName,
    };
    done(null, payload);
  }
}
