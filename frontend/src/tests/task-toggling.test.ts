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

    const patchSpy = jest.spyOn(apiClient, "patch").mockResolvedValue({
      data: {
        ok: true,
        task: {
          id: "task1",
          title: "Prepare slides for security meeting",
          statusId: "done",
          projectId: "work",
          noteId: "note1",
          source: "note_ai",
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
      patchSpy.mockRestore();
    }
  });
});
