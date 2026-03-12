import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { useProjectsStore } from "@/store/useProjectsStore";

describe("Sidebar project selection", () => {
  it("updates the selected project from the sidebar list", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /startup/i }));

    expect(useProjectsStore.getState().selectedProjectId).toBe("startup");
  });
});
