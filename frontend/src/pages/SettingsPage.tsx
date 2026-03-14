import { Bell, LockKeyhole, Wand2, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettingsStore } from "@/store/useSettingsStore";

function SettingRow({
  title,
  description,
  control,
}: {
  title: string;
  description: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[24px] bg-white/75 p-4">
      <div className="max-w-xl">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-7 text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

export function SettingsPage() {
  const {
    twoFactorEnabled,
    loginAlertsEnabled,
    sessionLockEnabled,
    aiTaggingEnabled,
    taskExtractionEnabled,
    reminderEmailsEnabled,
    digestCadence,
    defaultNoteMode,
    appStartPage,
    compactBoardEnabled,
    autoOpenLastProject,
    fullWidthWorkspaceEnabled,
    setBooleanSetting,
    setDigestCadence,
    setDefaultNoteMode,
    setAppStartPage,
  } = useSettingsStore();

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <Card className="rounded-[32px]">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardDescription>Workspace settings</CardDescription>
            <CardTitle className="text-3xl">Control how Notey behaves</CardTitle>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={twoFactorEnabled ? "default" : "outline"}>{twoFactorEnabled ? "2FA enabled" : "2FA off"}</Badge>
            <Badge variant={aiTaggingEnabled && taskExtractionEnabled ? "accent" : "outline"}>
              {aiTaggingEnabled && taskExtractionEnabled ? "AI assist active" : "AI assist limited"}
            </Badge>
          </div>
        </CardHeader>
      </Card>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="grid gap-6 pb-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
          <Card className="rounded-[32px]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-secondary p-3">
                  <LockKeyhole className="h-5 w-5" />
                </div>
                <div>
                  <CardDescription>Security</CardDescription>
                  <CardTitle className="text-2xl">Protect account access</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingRow
                title="Two-factor authentication"
                description="Require a second verification step when signing in. In the mocked app, this acts as your security readiness toggle."
                control={<Switch checked={twoFactorEnabled} onCheckedChange={(value) => setBooleanSetting("twoFactorEnabled", value)} />}
              />
              <SettingRow
                title="Login alerts"
                description="Receive an alert whenever a new device signs in to your account."
                control={<Switch checked={loginAlertsEnabled} onCheckedChange={(value) => setBooleanSetting("loginAlertsEnabled", value)} />}
              />
              <SettingRow
                title="Session lock after inactivity"
                description="Auto-lock the workspace after an idle period to reduce exposure on shared screens."
                control={<Switch checked={sessionLockEnabled} onCheckedChange={(value) => setBooleanSetting("sessionLockEnabled", value)} />}
              />
            </CardContent>
          </Card>

          <Card className="rounded-[32px]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-secondary p-3">
                  <Wand2 className="h-5 w-5" />
                </div>
                <div>
                  <CardDescription>Notes and AI</CardDescription>
                  <CardTitle className="text-2xl">Tune capture and automation</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingRow
                title="Default note mode"
                description="Choose whether new captures should begin in chat mode or full note mode."
                control={
                  <Select value={defaultNoteMode} onChange={(event) => setDefaultNoteMode(event.target.value as "chat" | "full")} className="w-[180px]">
                    <option value="chat">Chat capture</option>
                    <option value="full">Full note</option>
                  </Select>
                }
              />
              <SettingRow
                title="AI tag generation"
                description="Generate smart tags from new notes using the current mocked extraction rules."
                control={<Switch checked={aiTaggingEnabled} onCheckedChange={(value) => setBooleanSetting("aiTaggingEnabled", value)} />}
              />
              <SettingRow
                title="Task extraction"
                description="Automatically create tasks from action-oriented notes."
                control={<Switch checked={taskExtractionEnabled} onCheckedChange={(value) => setBooleanSetting("taskExtractionEnabled", value)} />}
              />
            </CardContent>
          </Card>

          <Card className="rounded-[32px]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-secondary p-3">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <CardDescription>Notifications</CardDescription>
                  <CardTitle className="text-2xl">Keep the right rhythm</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingRow
                title="Digest cadence"
                description="Control how often the product should summarize project activity."
                control={
                  <Select value={digestCadence} onChange={(event) => setDigestCadence(event.target.value as "off" | "daily" | "weekly")} className="w-[180px]">
                    <option value="off">Off</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </Select>
                }
              />
              <SettingRow
                title="Reminder emails"
                description="Receive reminders for extracted tasks and pending work."
                control={<Switch checked={reminderEmailsEnabled} onCheckedChange={(value) => setBooleanSetting("reminderEmailsEnabled", value)} />}
              />
            </CardContent>
          </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-[32px]">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-secondary p-3">
                    <Workflow className="h-5 w-5" />
                  </div>
                  <div>
                    <CardDescription>Workspace</CardDescription>
                    <CardTitle className="text-2xl">Shape the app shell</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <SettingRow
                  title="Open this page after login"
                  description="Choose where the app should drop you after authentication."
                  control={
                    <Select value={appStartPage} onChange={(event) => setAppStartPage(event.target.value as "chat" | "tasks" | "account")} className="w-[180px]">
                      <option value="chat">Chat</option>
                      <option value="tasks">Tasks</option>
                      <option value="account">Account</option>
                    </Select>
                  }
                />
                <SettingRow
                  title="Compact task board"
                  description="Use a tighter layout for the kanban board when managing many tasks."
                  control={<Switch checked={compactBoardEnabled} onCheckedChange={(value) => setBooleanSetting("compactBoardEnabled", value)} />}
                />
                <SettingRow
                  title="Full-width workspace"
                  description="Remove the 1600px app shell limit and let the workspace stretch across the full viewport width."
                  control={<Switch checked={fullWidthWorkspaceEnabled} onCheckedChange={(value) => setBooleanSetting("fullWidthWorkspaceEnabled", value)} />}
                />
                <SettingRow
                  title="Auto-open last selected project"
                  description="Restore your last active project context when returning to the app."
                  control={<Switch checked={autoOpenLastProject} onCheckedChange={(value) => setBooleanSetting("autoOpenLastProject", value)} />}
                />
              </CardContent>
            </Card>

            <Card className="rounded-[32px] bg-primary text-primary-foreground">
              <CardContent className="p-6">
                <p className="text-sm uppercase tracking-[0.2em] text-primary-foreground/80">Recommended split</p>
                <h3 className="mt-3 text-2xl font-extrabold">Put identity in Account, behavior in Settings.</h3>
                <p className="mt-4 text-sm leading-7 text-primary-foreground/85">
                  This keeps profile and billing-adjacent actions separate from operational controls like security, AI behavior, and workspace preferences.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-[32px]">
              <CardContent className="p-6">
                <div className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  What belongs here
                </div>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                  <li>Security controls like 2FA, login alerts, and session policy.</li>
                  <li>AI behavior such as tagging, task extraction, and default capture mode.</li>
                  <li>Workspace-level preferences like start page, board density, and reminders.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
