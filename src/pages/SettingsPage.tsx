import { Bell, Shield, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const settings = [
  {
    icon: Sparkles,
    title: "AI extraction mode",
    description: "Mocked for now. Later this will map to model and prompt settings.",
  },
  {
    icon: Bell,
    title: "Digest cadence",
    description: "Preview where project digests and reminders will be configured.",
  },
  {
    icon: Shield,
    title: "Privacy controls",
    description: "Space reserved for workspace policy and local-first sync preferences.",
  },
];

export function SettingsPage() {
  return (
    <Card className="rounded-[32px]">
      <CardHeader>
        <CardDescription>Workspace settings</CardDescription>
        <CardTitle className="text-3xl">Prepare the control plane</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        {settings.map(({ icon: Icon, title, description }) => (
          <Card key={title} className="rounded-[28px] bg-white/70 p-5">
            <div className="rounded-2xl bg-secondary p-3 w-fit">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
