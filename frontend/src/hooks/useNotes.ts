import { useNotesStore } from "@/store/useNotesStore";
import { useProjectsStore } from "@/store/useProjectsStore";

export function useNotes() {
  const notes = useNotesStore((state) => state.notes);
  const searchTerm = useNotesStore((state) => state.searchTerm);
  const selectedProjectId = useProjectsStore((state) => state.selectedProjectId);

  const normalized = searchTerm.trim().toLowerCase();
  const filteredNotes = notes.filter((note) => {
    const matchesProject = !selectedProjectId || note.projectId === selectedProjectId;
    if (!matchesProject) {
      return false;
    }

    if (!normalized) {
      return true;
    }

    return (
      note.content.toLowerCase().includes(normalized) ||
      note.projectId.toLowerCase().includes(normalized) ||
      note.tags.some((tag) => tag.toLowerCase().includes(normalized))
    );
  });

  return {
    notes,
    filteredNotes,
    searchTerm,
  };
}
