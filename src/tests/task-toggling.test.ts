import { useTasksStore } from "@/store/useTasksStore";

describe("useTasksStore", () => {
  it("toggles task status between draft and done", () => {
    const taskId = "task1";
    expect(useTasksStore.getState().tasks.find((task) => task.id === taskId)?.statusId).toBe("draft");

    useTasksStore.getState().toggleTask(taskId);

    expect(useTasksStore.getState().tasks.find((task) => task.id === taskId)?.statusId).toBe("done");
  });
});
