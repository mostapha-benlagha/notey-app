import { ArrowRight, CheckCircle2, FilePenLine, FolderKanban, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { NoteyLogoFull } from "@/components/brand/NoteyLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LandingPage() {
  const featureCards: Array<{ label: string; icon: LucideIcon }> = [
    { label: "Project-aware notes", icon: FolderKanban },
    { label: "Rich editor for deep work", icon: FilePenLine },
    { label: "AI-ready tagging and task extraction", icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-6 md:px-6">
      <div className="mx-auto max-w-[1440px]">
        <header className="flex items-center justify-between rounded-[32px] border border-white/80 bg-white/70 px-5 py-4 shadow-soft backdrop-blur">
          <Link to="/" className="flex items-center gap-3">
            <NoteyLogoFull className="h-9 w-auto" aria-hidden />
          </Link>
          <div className="flex gap-2">
            <Button asChild variant="ghost" className="rounded-2xl">
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild className="rounded-2xl">
              <Link to="/signup">Start free</Link>
            </Button>
          </div>
        </header>

        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_460px]">
          <Card className="surface-grid overflow-hidden rounded-[36px]">
            <CardContent className="grid gap-10 p-8 md:p-10">
              <div>
                <div className="inline-flex rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  For founders, operators, and researchers
                </div>
                <h1 className="mt-6 max-w-3xl text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
                  Chat-first notes for ideas that need structure later.
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                  Capture a thought like a message, expand it into a full document, and let the system turn notes into tags, tasks, and project context.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild size="lg" className="rounded-2xl">
                    <Link to="/signup">
                      Build your workspace
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-2xl">
                    <Link to="/login">See the app</Link>
                  </Button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ["Chat capture", "Start from low-friction notes without opening a heavy editor."],
                  ["Full note mode", "Expand any note into a full-screen editor when you need depth."],
                  ["Project dashboards", "Keep notes and extracted tasks anchored to the right project."],
                ].map(([title, description]) => (
                  <div key={title} className="rounded-[28px] border border-white/80 bg-white/85 p-5">
                    <h2 className="text-base font-semibold">{title}</h2>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="rounded-[36px]">
              <CardHeader>
                <CardDescription>What your workspace gives you</CardDescription>
                <CardTitle className="text-2xl">Built for modern note operations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {featureCards.map(({ label, icon: Icon }) => (
                  <div key={label} className="flex items-start gap-3 rounded-[24px] bg-secondary/70 p-4">
                    <div className="rounded-2xl bg-white p-2 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-sm leading-7 text-foreground/90">{label}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[36px] bg-primary text-primary-foreground">
              <CardContent className="p-8">
                <p className="text-sm uppercase tracking-[0.2em] text-primary-foreground/80">Launch quickly</p>
                <h2 className="mt-3 text-3xl font-extrabold">Ship the frontend now, connect the backend later.</h2>
                <p className="mt-4 text-sm leading-7 text-primary-foreground/85">
                  Notey is structured for mocked data today and API integration when you are ready.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
