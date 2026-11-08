import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MockedResponse } from "@apollo/client/testing";
import { AnnouncementForm } from "./AnnouncementForm";
import { POST_ANNOUNCEMENT } from "../graphql/operations";
import { activity, renderWithApollo } from "../test/render";

const postMock = (message: string, payload: object): MockedResponse => ({
  request: { query: POST_ANNOUNCEMENT, variables: { spaceId: "riverside", message } },
  result: { data: { postAnnouncement: { __typename: "PostAnnouncementPayload", ...payload } } },
});

describe("AnnouncementForm", () => {
  it("posts, confirms, and clears the message", async () => {
    const user = userEvent.setup();
    renderWithApollo(<AnnouncementForm spaceId="riverside" />, [
      postMock("Doors open at 8", {
        activity: activity("10", { kind: "ANNOUNCEMENT", summary: "Doors open at 8", isRead: true }),
        errors: [],
      }),
    ]);

    await user.type(screen.getByLabelText("Message"), "Doors open at 8");
    expect(screen.getByText(/265 characters left/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Post" }));

    expect(await screen.findByText("Posted.")).toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toHaveValue("");
  });

  it("shows the server's validation message on the field", async () => {
    const user = userEvent.setup();
    renderWithApollo(<AnnouncementForm spaceId="riverside" />, [
      postMock("", {
        activity: null,
        errors: [{ __typename: "UserError", field: "message", message: "Write a message first" }],
      }),
    ]);

    await user.click(screen.getByRole("button", { name: "Post" }));

    const field = screen.getByLabelText("Message");
    expect(await screen.findByText("Write a message first")).toBeInTheDocument();
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveAccessibleDescription("Write a message first");
  });

  it("reports network failures", async () => {
    const user = userEvent.setup();
    renderWithApollo(<AnnouncementForm spaceId="riverside" />, [
      {
        request: { query: POST_ANNOUNCEMENT, variables: { spaceId: "riverside", message: "Hi" } },
        error: new Error("offline"),
      },
    ]);

    await user.type(screen.getByLabelText("Message"), "Hi");
    await user.click(screen.getByRole("button", { name: "Post" }));

    expect(await screen.findByText("Could not post. Check your connection and try again.")).toBeInTheDocument();
  });
});
