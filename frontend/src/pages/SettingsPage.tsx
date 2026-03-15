import { useState } from "react";
import { Bell, KeyRound, LockKeyhole, Wand2, Workflow } from "lucide-react";
import axios from "axios";
import { NoteyAppIcon } from "@/components/brand/NoteyLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PinInput } from "@/components/ui/PinInput";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createAuthenticatorSetup, verifyAuthenticatorSetup } from "@/services/api";
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
  const [isAuthenticatorDialogOpen, setIsAuthenticatorDialogOpen] = useState(false);
  const [isAuthenticatorSetupLoading, setIsAuthenticatorSetupLoading] = useState(false);
  const [authenticatorCode, setAuthenticatorCode] = useState("");
  const [authenticatorSetup, setAuthenticatorSetup] = useState<{ manualEntryKey: string; otpAuthUrl: string } | null>(null);
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const {
    twoFactorEnabled,
    twoFactorMethod,
    authenticatorAppEnabled,
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
    setTwoFactorMethod,
    setDigestCadence,
    setDefaultNoteMode,
    setAppStartPage,
  } = useSettingsStore();

  const qrCodeUrl = authenticatorSetup
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(authenticatorSetup.otpAuthUrl)}`
    : null;

  function getSecurityErrorMessage(error: unknown, fallback: string) {
    if (axios.isAxiosError<{ message?: string; code?: string }>(error)) {
      const code = error.response?.data?.code;
      if (code === "AUTHENTICATOR_SETUP_REQUIRED") {
        return "Finish connecting your authenticator app first. Open setup, scan the QR code, then verify one 6-digit code.";
      }
      if (code === "AUTHENTICATOR_NOT_CONFIGURED") {
        return "This account expects an authenticator app, but setup is incomplete. Reconnect your app from Settings and verify it once.";
      }
      if (code === "AUTHENTICATOR_SETUP_NOT_STARTED") {
        return "Start the authenticator setup flow first so Notey can generate a QR code and setup key.";
      }
      if (code === "INVALID_AUTHENTICATOR_CODE") {
        return "That 6-digit authenticator code did not match. Use the newest code shown in Google Authenticator, Authy, or your TOTP app.";
      }

      return error.response?.data?.message ?? fallback;
    }

    return fallback;
  }

  async function openAuthenticatorSetupDialog() {
    try {
      setSecurityError(null);
      setSecurityMessage(null);
      setAuthenticatorCode("");
      setIsAuthenticatorDialogOpen(true);
      setIsAuthenticatorSetupLoading(true);
      const response = await createAuthenticatorSetup();
      setAuthenticatorSetup({
        manualEntryKey: response.setup.manualEntryKey,
        otpAuthUrl: response.setup.otpAuthUrl,
      });
    } catch (error) {
      setSecurityError(getSecurityErrorMessage(error, "We could not start authenticator setup."));
    } finally {
      setIsAuthenticatorSetupLoading(false);
    }
  }

  async function copyToClipboard(value: string, successLabel: string) {
    try {
      await navigator.clipboard.writeText(value);
      setSecurityError(null);
      setSecurityMessage(successLabel);
    } catch {
      setSecurityError("Clipboard access was blocked. You can still copy the setup key manually.");
    }
  }

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
                description="Require a second verification step when signing in. Email code is the default method, and you can switch to an authenticator app after setup."
                control={
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={async (value) => {
                      try {
                        setSecurityError(null);
                        setSecurityMessage(null);
                        await setBooleanSetting("twoFactorEnabled", value);
                        if (!value) {
                          setSecurityMessage("Two-factor authentication is now off.");
                        } else if (twoFactorMethod === "email") {
                          setSecurityMessage("Two-factor authentication is now using email codes.");
                        }
                      } catch {
                        setSecurityError("We could not update two-factor authentication.");
                      }
                    }}
                  />
                }
              />
              <SettingRow
                title="Two-factor method"
                description="Choose how Notey should deliver the second sign-in step."
                control={
                  <Select
                    value={twoFactorMethod}
                    onChange={async (event) => {
                      const nextMethod = event.target.value as "email" | "authenticator";
                      try {
                        setSecurityError(null);
                        setSecurityMessage(null);
                        await setTwoFactorMethod(nextMethod);
                        if (nextMethod === "email") {
                          setSecurityMessage("Email is now the selected two-factor method.");
                        }
                      } catch (requestError) {
                        if (axios.isAxiosError<{ message?: string }>(requestError)) {
                          setSecurityError(requestError.response?.data?.message ?? "We could not change the two-factor method.");
                          return;
                        }

                        setSecurityError("We could not change the two-factor method.");
                      }
                    }}
                    className="w-[180px]"
                  >
                    <option value="email">Email</option>
                    <option value="authenticator">Authenticator app</option>
                  </Select>
                }
              />
              {twoFactorMethod === "authenticator" ? (
                <div className="rounded-[24px] border border-dashed border-border bg-secondary/30 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-white p-2 text-primary shadow-soft">
                      <NoteyAppIcon className="h-6 w-6" alt="Notey app icon" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold">Authenticator app setup</h3>
                      <p className="mt-1 text-sm leading-7 text-muted-foreground">
                        Use Google Authenticator, Authy, or another TOTP app. {authenticatorAppEnabled ? "Your app is already connected." : "Set it up once, then enable authenticator-based 2FA."}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          className="rounded-2xl"
                          onClick={openAuthenticatorSetupDialog}
                        >
                          {authenticatorAppEnabled ? "Reconnect app" : "Set up authenticator"}
                        </Button>
                        {authenticatorAppEnabled ? (
                          <div className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                            App connected
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
              {securityError ? <p className="text-sm text-rose-600">{securityError}</p> : null}
              {securityMessage ? <p className="text-sm text-emerald-700">{securityMessage}</p> : null}
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
      <Dialog
        open={isAuthenticatorDialogOpen}
        onOpenChange={(open) => {
          setIsAuthenticatorDialogOpen(open);
          if (!open) {
            setAuthenticatorCode("");
            setAuthenticatorSetup(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl rounded-[36px] p-0">
          <div className="grid gap-0 md:grid-cols-[1.05fr_0.95fr]">
            <div className="bg-[linear-gradient(135deg,rgba(22,99,199,0.08),rgba(22,99,199,0.02))] p-8">
              <DialogHeader>
                <DialogDescription>Authenticator setup</DialogDescription>
                <DialogTitle className="text-3xl">Scan to connect your phone</DialogTitle>
              </DialogHeader>
              <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">
                Scan this QR code with Google Authenticator, Authy, or any TOTP app. If your phone is on the same device, you can also open the setup link directly or copy the secret manually.
              </p>
              <div className="mt-6 flex min-h-[272px] items-center justify-center rounded-[28px] border border-white/80 bg-white/85 p-6 shadow-soft">
                {isAuthenticatorSetupLoading ? (
                  <p className="text-sm text-muted-foreground">Preparing secure setup...</p>
                ) : qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR code for authenticator app setup" className="h-[240px] w-[240px] rounded-[24px]" />
                ) : (
                  <p className="max-w-xs text-center text-sm text-muted-foreground">
                    We could not prepare the QR code yet. Try reopening setup, or use the manual key once it appears.
                  </p>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl"
                  disabled={!authenticatorSetup}
                  onClick={() => authenticatorSetup && copyToClipboard(authenticatorSetup.manualEntryKey, "Manual setup key copied.")}
                >
                  Copy setup key
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl"
                  disabled={!authenticatorSetup}
                  onClick={() => authenticatorSetup && copyToClipboard(authenticatorSetup.otpAuthUrl, "Setup link copied.")}
                >
                  Copy setup link
                </Button>
                <Button
                  asChild
                  type="button"
                  variant="ghost"
                  className="rounded-2xl"
                  disabled={!authenticatorSetup}
                >
                  <a href={authenticatorSetup?.otpAuthUrl ?? "#"} target="_self" rel="noreferrer">
                    Open setup link
                  </a>
                </Button>
              </div>
            </div>
            <div className="p-8">
              <DialogHeader>
                <DialogDescription>Step 2</DialogDescription>
                <DialogTitle>Confirm the 6-digit code</DialogTitle>
              </DialogHeader>
              <div className="mt-6 rounded-[28px] border border-border bg-secondary/25 p-5">
                <p className="text-sm leading-7 text-muted-foreground">
                  After scanning, your app will create a Notey entry automatically. If scanning is not available, paste this key manually.
                </p>
                <div className="mt-4 rounded-[20px] bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Manual key</p>
                  <p className="mt-2 break-all font-mono text-sm text-foreground">
                    {authenticatorSetup?.manualEntryKey ?? "Loading secure key..."}
                  </p>
                </div>
              </div>
              <div className="mt-6 space-y-2">
                <label className="text-sm font-medium" htmlFor="authenticator-code">
                  Current authenticator code
                </label>
                <PinInput
                  value={authenticatorCode}
                  onChange={setAuthenticatorCode}
                  disabled={isAuthenticatorSetupLoading}
                />
                <p className="text-sm text-muted-foreground">
                  Enter the latest code from your app to finish setup and activate authenticator-based 2FA.
                </p>
              </div>
              <DialogFooter className="mt-8 justify-start">
                <Button
                  type="button"
                  className="rounded-2xl"
                  disabled={!authenticatorSetup || isAuthenticatorSetupLoading}
                  onClick={async () => {
                    try {
                      setSecurityError(null);
                      setSecurityMessage(null);
                      const response = await verifyAuthenticatorSetup(authenticatorCode);
                      useSettingsStore.setState({ ...response.settings });
                      setAuthenticatorCode("");
                      setAuthenticatorSetup(null);
                      setIsAuthenticatorDialogOpen(false);
                      setSecurityMessage("Authenticator app connected. Your sign-ins now require the app code.");
                    } catch (error) {
                      setSecurityError(getSecurityErrorMessage(error, "We could not verify that authenticator code."));
                    }
                  }}
                >
                  <KeyRound className="h-4 w-4" />
                  Verify authenticator app
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-2xl"
                  onClick={() => {
                    setIsAuthenticatorDialogOpen(false);
                    setAuthenticatorCode("");
                    setAuthenticatorSetup(null);
                  }}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
