import { useState } from "react";
import axios from "axios";
import { ArrowRight, CheckCircle2, FolderKanban, MessageSquareText, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/useAuthStore";
import { getDefaultAppRoute } from "@/utils/routes";

const onboardingSteps = [
  {
    eyebrow: "Welcome to Notey",
    title: "Capture thoughts quickly in a chat-first workspace.",
    description:
      "Start fast with a conversation-style flow. You can turn rough ideas into structured notes without stopping momentum.",
    icon: MessageSquareText,
  },
  {
    eyebrow: "How to use it",
    title: "Promote the important ideas into richer notes when they deserve more space.",
    description:
      "Use chat for fast capture, then expand into full notes for polished writing, planning, or reference material.",
    icon: Sparkles,
  },
  {
    eyebrow: "Projects and to-do lists",
    title: "Keep notes anchored to projects and turn action items into tasks.",
    description:
      "Projects give context, and extracted tasks keep execution close to the original thinking that created them.",
    icon: FolderKanban,
  },
] as const;

export function OnboardingPage() {
  const navigate = useNavigate();
  const complete = useAuthStore((state) => state.completeOnboarding);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const isLastStep = stepIndex === onboardingSteps.length - 1;
  const step = onboardingSteps[stepIndex];
  const StepIcon = step.icon;

  return (
    <div className="min-h-screen bg-background px-4 py-8 md:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1280px] items-center justify-center">
        <Card className="surface-grid w-full overflow-hidden rounded-[36px]">
          <CardContent className="grid gap-8 p-6 md:p-10 lg:grid-cols-[1.1fr_minmax(0,420px)] lg:items-stretch">
            <div className="flex flex-col justify-between rounded-[32px] border border-white/80 bg-white/70 p-6 shadow-soft backdrop-blur">
              <div>
                <div className="inline-flex rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Step {stepIndex + 1} of {onboardingSteps.length}
                </div>
                <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
                  {step.title}
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">{step.description}</p>
              </div>

              <div className="mt-8 flex gap-3">
                {onboardingSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 flex-1 rounded-full ${index <= stepIndex ? "bg-primary" : "bg-secondary"}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-[32px] border border-white/80 bg-white/82 p-6 shadow-soft backdrop-blur">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-primary/10 text-primary">
                  <StepIcon className="h-6 w-6" />
                </div>
                <CardHeader className="px-0 pt-6">
                  <CardDescription>{step.eyebrow}</CardDescription>
                  <CardTitle className="text-3xl">Important before you start</CardTitle>
                </CardHeader>
                <div className="space-y-4 text-sm leading-7 text-muted-foreground">
                  <p>
                    We’ll save that this account completed onboarding so next time you can go straight into the app.
                  </p>
                  <div className="rounded-[24px] bg-secondary/70 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-white p-2 text-primary">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <p>
                        This is a one-time tutorial. Once completed, the backend marks your account and skips this flow
                        on future logins.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                {error ? <p className="text-sm text-rose-600">{error}</p> : null}
                <div className="flex justify-between gap-3">
                  <Button
                    variant="ghost"
                    className="rounded-2xl"
                    disabled={stepIndex === 0 || isSubmitting}
                    onClick={() => setStepIndex((value) => value - 1)}
                  >
                    Back
                  </Button>
                  <Button
                    className="rounded-2xl"
                    disabled={isSubmitting}
                    onClick={async () => {
                      if (!isLastStep) {
                        setStepIndex((value) => value + 1);
                        return;
                      }

                      try {
                        setError(null);
                        await complete();
                        navigate(getDefaultAppRoute(), { replace: true });
                      } catch (requestError) {
                        if (axios.isAxiosError<{ message?: string }>(requestError)) {
                          setError(requestError.response?.data?.message ?? "Unable to complete onboarding.");
                          return;
                        }

                        setError("Unable to complete onboarding.");
                      }
                    }}
                  >
                    {isLastStep ? (isSubmitting ? "Finishing..." : "Enter workspace") : "Next step"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
