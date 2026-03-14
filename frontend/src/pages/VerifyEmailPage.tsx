import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, MailCheck, RefreshCw } from "lucide-react";
import axios from "axios";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/useAuthStore";
import { getDefaultAppRoute } from "@/utils/routes";

interface VerifyState {
  email?: string;
}

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const verifyEmail = useAuthStore((state) => state.verifyEmail);
  const resendVerification = useAuthStore((state) => state.resendVerification);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const state = (location.state as VerifyState | null) ?? null;
  const token = searchParams.get("token");
  const [email, setEmail] = useState(state?.email ?? "");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    state?.email ? `We sent a verification link to ${state.email}.` : null,
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;

    void (async () => {
      try {
        setError(null);
        await verifyEmail(token);
        if (!active) {
          return;
        }
        navigate(getDefaultAppRoute(), { replace: true });
      } catch (requestError) {
        if (!active) {
          return;
        }

        if (axios.isAxiosError<{ message?: string }>(requestError)) {
          setError(requestError.response?.data?.message ?? "Unable to verify your email.");
          return;
        }

        setError("Unable to verify your email.");
      }
    })();

    return () => {
      active = false;
    };
  }, [navigate, token, verifyEmail]);

  return (
    <Card className="w-full max-w-lg rounded-[36px]">
      <CardHeader>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {token ? <CheckCircle2 className="h-6 w-6" /> : <MailCheck className="h-6 w-6" />}
        </div>
        <CardDescription className="pt-3">Verify your email</CardDescription>
        <CardTitle className="text-3xl">{token ? "Confirming your email" : "Check your inbox"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {token ? (
          <p className="text-sm text-muted-foreground">
            We’re validating your verification link and signing you in as soon as it succeeds.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              You need to verify your email before accessing Notey. Open the link in your inbox, or resend it here.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="verify-email">
                Email
              </label>
              <Input id="verify-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
          </>
        )}
        {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {!token ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              className="flex-1 rounded-2xl"
              disabled={isSubmitting || !email.trim()}
              onClick={async () => {
                try {
                  setError(null);
                  const response = await resendVerification(email.trim());
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
              {isSubmitting ? "Sending..." : "Resend verification email"}
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button asChild variant="ghost" className="rounded-2xl">
              <Link to="/login">
                Back to login
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
