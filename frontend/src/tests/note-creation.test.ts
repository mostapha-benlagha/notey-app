import { apiClient } from "@/services/api";
import { useNotesStore } from "@/store/useNotesStore";
import { useTasksStore } from "@/store/useTasksStore";

describe("useNotesStore", () => {
  it("creates a note and extracts mocked tasks", async () => {
    const postSpy = jest.spyOn(apiClient, "post").mockImplementation(async (url) => {
      if (url === "/notes") {
        return {
          data: {
            ok: true,
            note: {
              id: "note-created-from-test",
              attachments: [],
              content: "Prepare investor summary. Send follow up email after the meeting.",
              createdAt: "2026-03-14T12:00:00.000Z",
              projectId: "startup",
              richContent: "<p>Prepare investor summary. Send follow up email after the meeting.</p>",
              tags: ["meeting", "task"],
            },
          },
          status: 201,
          statusText: "Created",
          headers: {},
          config: { headers: {} as never },
        };
      }

      if (url === "/tasks/extracted") {
        return {
          data: {
            ok: true,
            tasks: [
              {
                id: "task-created-from-test",
                title: "Send follow up email after the meeting",
                statusId: "draft",
                projectId: "startup",
                noteId: "note-created-from-test",
                source: "note_ai",
                deletedAt: null,
              },
            ],
          },
          status: 201,
          statusText: "Created",
          headers: {},
          config: { headers: {} as never },
        };
      }

      throw new Error(`Unexpected POST ${url}`);
    });

    try {
      const initialNotes = useNotesStore.getState().notes.length;
      const initialTasks = useTasksStore.getState().tasks.length;

      const note = await useNotesStore.getState().addNote({
        content: "Prepare investor summary. Send follow up email after the meeting.",
        projectId: "startup",
        attachments: [],
      });

      expect(useNotesStore.getState().notes).toHaveLength(initialNotes + 1);
      expect(note.tags).toEqual(expect.arrayContaining(["meeting", "task"]));
      expect(useTasksStore.getState().tasks.length).toBeGreaterThan(initialTasks);
      expect(postSpy).toHaveBeenCalledWith(
        "/notes",
        expect.objectContaining({
          content: "Prepare investor summary. Send follow up email after the meeting.",
          projectId: "startup",
        }),
      );
      expect(postSpy).toHaveBeenCalledWith("/tasks/extracted", {
        noteId: "note-created-from-test",
        projectId: "startup",
        titles: expect.any(Array),
      });
    } finally {
      postSpy.mockRestore();
    }
  });
});
