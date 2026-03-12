import { useTasksStore } from "@/store/useTasksStore";

describe("useTasksStore", () => {
  it("toggles task status", () => {
    const taskId = "task1";
    expect(useTasksStore.getState().tasks.find((task) => task.id === taskId)?.status).toBe("pending");

    useTasksStore.getState().toggleTask(taskId);

    expect(useTasksStore.getState().tasks.find((task) => task.id === taskId)?.status).toBe("completed");
  });
});
