import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { MessageInput } from "@/components/chat/MessageInput";
import { uploadNoteAttachments } from "@/services/api";

jest.mock("@/services/api", () => ({
  uploadNoteAttachments: jest.fn(async (attachments) => attachments),
}));

describe("MessageInput", () => {
  it("submits note content with the selected project", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn(async () => {});

    render(
      <MemoryRouter>
        <MessageInput onSubmit={onSubmit} />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/message input/i), "Draft the customer handoff note");
    await user.selectOptions(screen.getByLabelText(/project selector/i), "startup");
    await user.click(screen.getByRole("button", { name: /save note/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      attachments: [],
      content: "Draft the customer handoff note",
      projectId: "startup",
    });
    expect(uploadNoteAttachments).toHaveBeenCalledWith([]);
  });
});
