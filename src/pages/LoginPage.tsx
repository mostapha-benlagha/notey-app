import { useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/useAuthStore";

export function LoginPage() {
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("alex@notey.app");

  const destination = (location.state as { from?: string } | null)?.from ?? "/app";

  return (
    <Card className="w-full max-w-lg rounded-[36px]">
      <CardHeader>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <CardDescription className="pt-3">Welcome back</CardDescription>
        <CardTitle className="text-3xl">Log in to your workspace</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="login-email">
            Email
          </label>
          <Input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <Button
          className="w-full rounded-2xl"
          onClick={() => {
            login({ email });
            navigate(destination, { replace: true });
          }}
        >
          Continue to Notey
          <ArrowRight className="h-4 w-4" />
        </Button>
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
