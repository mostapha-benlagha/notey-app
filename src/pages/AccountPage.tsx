import { ShieldAlert, Trash2, UserRound } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/useAuthStore";

export function AccountPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const deleteAccount = useAuthStore((state) => state.deleteAccount);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({
    email: user?.email ?? "",
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
  });

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-[32px]">
        <CardHeader>
          <CardDescription>Account profile</CardDescription>
          <CardTitle className="text-3xl">Manage your identity and workspace access</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="account-first-name">
                  First name
                </label>
                <Input
                  id="account-first-name"
                  value={form.firstName}
                  onChange={(event) => setForm((state) => ({ ...state, firstName: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="account-last-name">
                  Last name
                </label>
                <Input
                  id="account-last-name"
                  value={form.lastName}
                  onChange={(event) => setForm((state) => ({ ...state, lastName: event.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="account-email">
                Email
              </label>
              <Input
                id="account-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((state) => ({ ...state, email: event.target.value }))}
              />
            </div>
            <Button
              className="rounded-2xl"
              onClick={() => {
                updateProfile(form);
              }}
            >
              Save profile
            </Button>
          </div>
          <div className="space-y-4">
            <Card className="rounded-[28px] bg-secondary/65">
              <CardContent className="p-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-primary/10 text-primary">
                  <UserRound className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-lg font-semibold">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="mt-5 grid gap-3 text-sm">
                  <div className="rounded-2xl bg-white/80 p-3">
                    <span className="font-semibold">Plan:</span> {user.plan}
                  </div>
                  <div className="rounded-2xl bg-white/80 p-3">
                    <span className="font-semibold">Role:</span> {user.role}
                  </div>
                  <div className="rounded-2xl bg-white/80 p-3">
                    <span className="font-semibold">Joined:</span> {new Date(user.joinedAt).toLocaleDateString("en-US")}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-rose-200 bg-rose-50/80">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-white p-3 text-rose-600">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-rose-900">Danger zone</h3>
                    <p className="mt-2 text-sm leading-7 text-rose-800/80">
                      Delete your account to clear your mocked session and return to the public site.
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="mt-5 rounded-2xl border-rose-200 text-rose-700 hover:bg-rose-100" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="h-4 w-4" />
                  Delete account
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This mocked action logs you out and clears your profile from local state. Use it to test destructive account flows.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              tone="destructive"
              onClick={() => {
                deleteAccount();
                navigate("/", { replace: true });
              }}
            >
              Delete account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
