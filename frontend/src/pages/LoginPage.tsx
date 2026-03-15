import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { NoteyAppIcon } from "@/components/brand/NoteyLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PinInput } from "@/components/ui/PinInput";
import { useAuthStore } from "@/store/useAuthStore";
import { getDefaultAppRoute } from "@/utils/routes";

export function LoginPage() {
  const login = useAuthStore((state) => state.login);
  const verifyTwoFactor = useAuthStore((state) => state.verifyTwoFactor);
  const resendTwoFactor = useAuthStore((state) => state.resendTwoFactor);
  const clearPendingTwoFactor = useAuthStore((state) => state.clearPendingTwoFactor);
  const pendingTwoFactorChallenge = useAuthStore((state) => state.pendingTwoFactorChallenge);
  const resendVerification = useAuthStore((state) => state.resendVerification);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("alex@notey.app");
  const [password, setPassword] = useState("password123");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const destination = (location.state as { from?: string } | null)?.from ?? getDefaultAppRoute();
  const isTwoFactorStep = Boolean(pendingTwoFactorChallenge);

  function getAuthErrorMessage(error: unknown) {
    if (axios.isAxiosError<{ message?: string; code?: string }>(error)) {
      const code = error.response?.data?.code;

      if (code === "AUTHENTICATOR_NOT_CONFIGURED") {
        return "Your account is set to use an authenticator app, but setup is incomplete. Open Settings after signing in another way or switch back to email 2FA.";
      }
      if (code === "INVALID_2FA_CODE") {
        return pendingTwoFactorChallenge?.method === "authenticator"
          ? "That authenticator code did not match. Use the newest 6-digit code from Google Authenticator, Authy, or your TOTP app."
          : "That email verification code did not match. Try the latest code we sent.";
      }
      if (code === "INVALID_2FA_CHALLENGE") {
        return "That verification step expired. Start the login flow again to get a fresh code.";
      }

      return error.response?.data?.message ?? "Unable to log in.";
    }

    return "Unable to log in.";
  }

  return (
    <Card className="w-full max-w-lg rounded-[36px]">
      <CardHeader>
        <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-primary/10 text-primary">
          <NoteyAppIcon className="h-9 w-9" alt="Notey app icon" />
        </div>
        <CardDescription className="pt-3">{isTwoFactorStep ? "Second step" : "Welcome back"}</CardDescription>
        <CardTitle className="text-3xl">{isTwoFactorStep ? "Verify your sign-in" : "Log in to your workspace"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {!isTwoFactorStep ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="login-email">
                Email
              </label>
              <Input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="login-password">
                Password
              </label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="login-2fa-code">
              {pendingTwoFactorChallenge!.method === "email" ? "Email code" : "Authenticator code"}
            </label>
            <PinInput
              value={twoFactorCode}
              onChange={setTwoFactorCode}
              disabled={isSubmitting}
            />
            <p className="text-sm text-muted-foreground">
              {pendingTwoFactorChallenge!.method === "email"
                ? `We sent a 6-digit code to ${pendingTwoFactorChallenge!.email ?? email}.`
                : "Open your authenticator app and enter the current 6-digit code."}
            </p>
          </div>
        )}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <Button
          className="w-full rounded-2xl"
          disabled={isSubmitting}
          onClick={async () => {
            try {
              setError(null);
              setNeedsVerification(false);
              setSuccessMessage(null);
              if (isTwoFactorStep) {
                await verifyTwoFactor(twoFactorCode);
                navigate(destination, { replace: true });
              } else {
                await login({ email, password });
                if (useAuthStore.getState().isAuthenticated) {
                  navigate(destination, { replace: true });
                }
              }
            } catch (requestError) {
              if (axios.isAxiosError<{ message?: string; code?: string }>(requestError)) {
                const code = requestError.response?.data?.code;
                if (code === "EMAIL_NOT_VERIFIED") {
                  setNeedsVerification(true);
                }
                setError(getAuthErrorMessage(requestError));
                return;
              }

              setError("Unable to log in.");
            }
          }}
        >
          {isSubmitting ? "Logging in..." : isTwoFactorStep ? "Verify and continue" : "Continue to Notey"}
          <ArrowRight className="h-4 w-4" />
        </Button>
        {isTwoFactorStep ? (
          <div className="flex flex-wrap gap-2">
            {pendingTwoFactorChallenge!.method === "email" ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                disabled={isSubmitting}
                onClick={async () => {
                  try {
                    setError(null);
                    const response = await resendTwoFactor();
                    setSuccessMessage(`We sent a fresh code to ${response.email ?? email}.`);
                  } catch (requestError) {
                    if (axios.isAxiosError<{ message?: string }>(requestError)) {
                      setError(requestError.response?.data?.message ?? "Unable to resend the login code.");
                      return;
                    }

                    setError("Unable to resend the login code.");
                  }
                }}
              >
                Resend code
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              className="rounded-2xl"
              onClick={() => {
                clearPendingTwoFactor();
                setTwoFactorCode("");
                setSuccessMessage(null);
                setError(null);
              }}
            >
              Start over
            </Button>
          </div>
        ) : null}
        {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}
        {needsVerification ? (
          <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4">
            <p className="text-sm text-foreground/80">This account exists, but the email still needs to be verified.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                disabled={isSubmitting}
                onClick={async () => {
                  try {
                    setError(null);
                    const response = await resendVerification(email);
                    setSuccessMessage(`We sent a fresh verification link to ${response.email}.`);
                  } catch (requestError) {
                    if (axios.isAxiosError<{ message?: string }>(requestError)) {
                      setError(requestError.response?.data?.message ?? "Unable to resend verification email.");
                      return;
                    }

                    setError("Unable to resend verification email.");
                  }
                }}
              >
                Resend verification
              </Button>
              <Button asChild type="button" variant="ghost" className="rounded-2xl">
                <Link to="/verify-email" state={{ email }}>
                  Open verification screen
                </Link>
              </Button>
            </div>
          </div>
        ) : null}
        <p className="text-sm text-muted-foreground">
          Need an account?{" "}
          <Link to="/signup" className="font-semibold text-primary">
            Create one
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
