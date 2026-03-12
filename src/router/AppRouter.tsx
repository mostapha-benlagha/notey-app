import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PublicOnlyRoute } from "@/components/auth/PublicOnlyRoute";
import { AuthLayout } from "@/layouts/AuthLayout";
import { MainLayout } from "@/layouts/MainLayout";
import { AccountPage } from "@/pages/AccountPage";
import { ChatPage } from "@/pages/ChatPage";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { ProjectPage } from "@/pages/ProjectPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { SignupPage } from "@/pages/SignupPage";
import { TasksPage } from "@/pages/TasksPage";

const NoteEditorPage = lazy(() =>
  import("@/pages/NoteEditorPage").then((module) => ({ default: module.NoteEditorPage })),
);

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/app" element={<ChatPage />} />
          <Route
            path="/app/notes/new"
            element={
              <Suspense fallback={null}>
                <NoteEditorPage />
              </Suspense>
            }
          />
          <Route
            path="/app/notes/:id"
            element={
              <Suspense fallback={null}>
                <NoteEditorPage />
              </Suspense>
            }
          />
          <Route path="/app/tasks" element={<TasksPage />} />
          <Route path="/app/projects/:id" element={<ProjectPage />} />
          <Route path="/app/settings" element={<SettingsPage />} />
          <Route path="/app/account" element={<AccountPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
