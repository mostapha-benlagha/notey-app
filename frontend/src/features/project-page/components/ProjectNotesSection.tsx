import { FilePenLine, Search } from "lucide-react";
import { useProjectPageContext } from "@/features/project-page/ProjectPageContext";
import { ProjectNoteCard } from "@/features/project-page/components/ProjectNoteCard";
import { PROJECT_SORT_OPTIONS, type ProjectSortOrder } from "@/features/project-page/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function ProjectNotesSection() {
  const {
    availableProjectFilters,
    availableTags,
    filteredNotes,
    isAllProjectsView,
    openNewProjectNote,
    project,
    query,
    selectedProjectFilter,
    selectedTag,
    setQuery,
    setSelectedProjectFilter,
    setSelectedTag,
    setSortOrder,
    sortOrder,
  } = useProjectPageContext();

  if (!project) {
    return null;
  }

  return (
    <Card className="rounded-[32px]">
      <CardHeader className="gap-4">
        <div>
          <CardDescription>{isAllProjectsView ? "Workspace notes" : "Project notes"}</CardDescription>
          <CardTitle className="text-2xl">{isAllProjectsView ? "Browse everything in one place" : `${project.name} notes`}</CardTitle>
        </div>
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_180px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes, tags, or project names..." />
          </div>
          <Select value={selectedTag} onChange={(event) => setSelectedTag(event.target.value)}>
            <option value="all">All tags</option>
            {availableTags.map((tag) => (
              <option key={tag} value={tag}>
                #{tag}
              </option>
            ))}
          </Select>
          {isAllProjectsView ? (
            <Select value={selectedProjectFilter} onChange={(event) => setSelectedProjectFilter(event.target.value)}>
              {availableProjectFilters.map((projectFilter) => (
                <option key={projectFilter.id} value={projectFilter.id}>
                  {projectFilter.name}
                </option>
              ))}
            </Select>
          ) : null}
          <Select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as ProjectSortOrder)}>
            {PROJECT_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {filteredNotes.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredNotes.map((note) => <ProjectNoteCard key={note.id} note={note} />)}
          </div>
        ) : (
          <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[28px] border border-dashed border-border bg-white/45 px-6 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-primary/10 text-primary">
              <FilePenLine className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-xl font-semibold">No notes match these filters</h3>
            <p className="mt-3 max-w-lg text-sm leading-7 text-muted-foreground">
              Try a broader search, clear the tag or project filters, or create a new note to populate this space.
            </p>
            <Button className="mt-6 rounded-2xl" onClick={openNewProjectNote}>
              <FilePenLine className="h-4 w-4" />
              Create a new note
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
