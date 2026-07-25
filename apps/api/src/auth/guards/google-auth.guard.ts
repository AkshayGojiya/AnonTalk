import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class GoogleAuthGuard extends AuthGuard("google") {
  // Forces Google's account chooser on every login attempt, instead of
  // silently re-using whichever Google account is already signed in in the
  // browser -- otherwise someone rejected for a wrong-domain email has no way
  // to pick a different account without first signing out of Google entirely.
  getAuthenticateOptions() {
    return { prompt: "select_account" };
  }
}
