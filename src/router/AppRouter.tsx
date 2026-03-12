import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { ChatPage } from "@/pages/ChatPage";
import { ProjectPage } from "@/pages/ProjectPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { TasksPage } from "@/pages/TasksPage";

const NoteEditorPage = lazy(() =>
  import("@/pages/NoteEditorPage").then((module) => ({ default: module.NoteEditorPage })),
);

export function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<ChatPage />} />
        <Route
          path="/notes/new"
          element={
            <Suspense fallback={null}>
              <NoteEditorPage />
            </Suspense>
          }
        />
        <Route
          path="/notes/:id"
          element={
            <Suspense fallback={null}>
              <NoteEditorPage />
            </Suspense>
          }
        />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/projects/:id" element={<ProjectPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
