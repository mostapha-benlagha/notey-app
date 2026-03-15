import { ArrowLeft, FilePenLine, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useProjectPageContext } from "@/features/project-page/ProjectPageContext";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ProjectPageHeader() {
  const { isAllProjectsView, openNewProjectNote, project, setConfirmDeleteProject } = useProjectPageContext();
  if (!project) {
    return null;
  }

  return (
    <Card className="rounded-[32px] bg-white/75">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <CardDescription>{isAllProjectsView ? "Workspace browser" : "Project workspace"}</CardDescription>
          <CardTitle className="text-3xl">{project.name}</CardTitle>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{project.description}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="ghost" className="rounded-2xl">
            <Link to="/app">
              <ArrowLeft className="h-4 w-4" />
              Back to chat
            </Link>
          </Button>
          {!isAllProjectsView ? (
            <Button variant="ghost" className="rounded-2xl text-rose-600 hover:text-rose-700" onClick={() => setConfirmDeleteProject(true)}>
              <Trash2 className="h-4 w-4" />
              Delete project
            </Button>
          ) : null}
          <Button className="rounded-2xl" onClick={openNewProjectNote}>
            <FilePenLine className="h-4 w-4" />
            {isAllProjectsView ? "Create note" : `Create note for ${project.name}`}
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}
