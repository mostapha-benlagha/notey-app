import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 md:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1400px] gap-6 lg:grid-cols-[minmax(0,1.1fr)_520px]">
        <section className="surface-grid hidden rounded-[36px] border border-white/80 bg-white/50 p-8 shadow-soft backdrop-blur lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="inline-flex rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              AI-native note workspace
            </div>
            <h1 className="mt-6 max-w-xl text-5xl font-extrabold leading-tight tracking-tight text-foreground">
              Capture messy thinking, shape it into projects, and let AI turn it into action.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground">
              Notey combines a fast chat capture flow with deeper full-note editing, extracted tasks, and project-aware organization.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Quick capture", "Drop notes instantly in chat and return later."],
              ["Project aware", "Keep work, research, and personal notes separated."],
              ["AI assisted", "Mocked today, API-ready when backend arrives."],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-[28px] border border-white/80 bg-white/80 p-5">
                <h2 className="text-base font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{copy}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="flex min-h-0 items-center justify-center">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
