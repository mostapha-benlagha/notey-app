import { useNotesStore } from "@/store/useNotesStore";
import { useTasksStore } from "@/store/useTasksStore";

describe("useNotesStore", () => {
  it("creates a note and extracts mocked tasks", () => {
    const initialNotes = useNotesStore.getState().notes.length;
    const initialTasks = useTasksStore.getState().tasks.length;

    const note = useNotesStore.getState().addNote({
      content: "Prepare investor summary. Send follow up email after the meeting.",
      projectId: "startup",
      attachments: [],
    });

    expect(useNotesStore.getState().notes).toHaveLength(initialNotes + 1);
    expect(note.tags).toEqual(expect.arrayContaining(["meeting", "task"]));
    expect(useTasksStore.getState().tasks.length).toBeGreaterThan(initialTasks);
  });
});
