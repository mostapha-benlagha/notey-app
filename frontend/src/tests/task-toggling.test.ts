import { mockTaskStatuses, mockTasks } from "@/services/mockData";
import { apiClient } from "@/services/api";
import { useTasksStore } from "@/store/useTasksStore";

describe("useTasksStore", () => {
  it("toggles task status between draft and done", async () => {
    useTasksStore.setState({
      isLoading: false,
      statuses: [...mockTaskStatuses],
      tasks: [...mockTasks],
    });

    const postSpy = jest.spyOn(apiClient, "post").mockResolvedValue({
      data: {
        ok: true,
        task: {
          id: "task1",
          title: "Prepare slides for security meeting",
          description: "Pull the latest deck, tighten the security overview, and keep the executive summary short.",
          statusId: "done",
          projectId: "work",
          noteId: "note1",
          evidenceNoteIds: ["note1"],
          source: "note_ai",
          tags: ["meeting", "security"],
          order: 0,
          deletedAt: null,
        },
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config: { headers: {} as never },
    });

    const taskId = "task1";
    expect(useTasksStore.getState().tasks.find((task) => task.id === taskId)?.statusId).toBe("draft");

    try {
      await useTasksStore.getState().toggleTask(taskId);
      expect(useTasksStore.getState().tasks.find((task) => task.id === taskId)?.statusId).toBe("done");
    } finally {
      postSpy.mockRestore();
    }
  });
});
