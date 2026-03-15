import { createContext, useContext, type ReactNode } from "react";
import { useProjectPage } from "@/features/project-page/useProjectPage";

type ProjectPageValue = ReturnType<typeof useProjectPage>;

const ProjectPageContext = createContext<ProjectPageValue | null>(null);

export function ProjectPageProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: ProjectPageValue;
}) {
  return <ProjectPageContext.Provider value={value}>{children}</ProjectPageContext.Provider>;
}

export function useProjectPageContext() {
  const value = useContext(ProjectPageContext);
  if (!value) {
    throw new Error("useProjectPageContext must be used inside ProjectPageProvider");
  }

  return value;
}
