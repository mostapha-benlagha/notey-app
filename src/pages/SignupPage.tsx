import { useState } from "react";
import { ArrowRight, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/useAuthStore";

export function SignupPage() {
  const signup = useAuthStore((state) => state.signup);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "alex@notey.app",
    firstName: "Alex",
    lastName: "Morgan",
  });

  return (
    <Card className="w-full max-w-lg rounded-[36px]">
      <CardHeader>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <UserPlus className="h-6 w-6" />
        </div>
        <CardDescription className="pt-3">Start your workspace</CardDescription>
        <CardTitle className="text-3xl">Create your account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="signup-first-name">
              First name
            </label>
            <Input
              id="signup-first-name"
              value={form.firstName}
              onChange={(event) => setForm((state) => ({ ...state, firstName: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="signup-last-name">
              Last name
            </label>
            <Input
              id="signup-last-name"
              value={form.lastName}
              onChange={(event) => setForm((state) => ({ ...state, lastName: event.target.value }))}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="signup-email">
            Work email
          </label>
          <Input
            id="signup-email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((state) => ({ ...state, email: event.target.value }))}
          />
        </div>
        <Button
          className="w-full rounded-2xl"
          onClick={() => {
            signup(form);
            navigate("/app", { replace: true });
          }}
        >
          Create workspace
          <ArrowRight className="h-4 w-4" />
        </Button>
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
