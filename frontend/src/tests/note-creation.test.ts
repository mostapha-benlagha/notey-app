import { apiClient } from "@/services/api";
import { useNotesStore } from "@/store/useNotesStore";
import { useTasksStore } from "@/store/useTasksStore";

describe("useNotesStore", () => {
  it("creates a note and leaves enrichment to the backend pipeline", async () => {
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
              tags: [],
              analysis: {
                status: "pending",
                summary: "Analysis queued.",
                lastAnalyzedAt: null,
              },
            },
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
      expect(note.tags).toEqual([]);
      expect(useTasksStore.getState().tasks.length).toBe(initialTasks);
      expect(postSpy).toHaveBeenCalledWith(
        "/notes",
        expect.objectContaining({
          content: "Prepare investor summary. Send follow up email after the meeting.",
          projectId: "startup",
        }),
      );
    } finally {
      postSpy.mockRestore();
    }
  });
});
