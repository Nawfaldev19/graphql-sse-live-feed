import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MockedResponse } from "@apollo/client/testing";
import { Workspace } from "./Workspace";
import { ACTIVITY_ADDED, FEED, VIEWER } from "../graphql/operations";
import { renderWithApollo } from "../test/render";

const space = (id: string, name: string, role: string) => ({ __typename: "Space", id, name, role });
const viewerMock = (spaces: object[] | null): MockedResponse => ({
  request: { query: VIEWER },
  result: { data: { viewer: spaces && { __typename: "Viewer", id: "ada", name: "Ada Okafor", spaces } } },
});
const emptyFeed = (spaceId: string): MockedResponse[] => [
  {
    request: { query: FEED, variables: { spaceId, kind: null } },
    result: { data: { feed: { __typename: "ActivityPage", items: [], nextCursor: null }, unreadCount: 0 } },
  },
  { request: { query: ACTIVITY_ADDED, variables: { spaceId } }, result: { data: null as never }, delay: 60_000 },
];

beforeEach(() => {
  window.localStorage.setItem("live-feed.token", "tok");
});

describe("Workspace", () => {
  it("opens the first space, offers a switcher, and switches", async () => {
    const user = userEvent.setup();
    renderWithApollo(<Workspace />, [
      viewerMock([
        space("foundry", "Foundry Lane Workshop", "MEMBER"),
        space("riverside", "Riverside Makers", "OWNER"),
      ]),
      ...emptyFeed("foundry"),
      ...emptyFeed("riverside"),
    ]);

    expect(await screen.findByRole("heading", { level: 1, name: "Foundry Lane Workshop" })).toBeInTheDocument();
    expect(screen.getByText("Signed in as Ada Okafor")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Space"), "riverside");

    expect(await screen.findByRole("heading", { level: 1, name: "Riverside Makers" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Post an announcement" })).toBeInTheDocument();
    expect(window.localStorage.getItem("live-feed.space")).toBe("riverside");
  });

  it("signs out when the token is no longer valid", async () => {
    renderWithApollo(<Workspace />, [viewerMock(null)]);
    await screen.findByRole("button", { name: "Switch person" });
    await vi.waitFor(() => expect(window.localStorage.getItem("live-feed.token")).toBeNull());
  });

  it("lets the visitor switch person", async () => {
    const user = userEvent.setup();
    renderWithApollo(<Workspace />, [
      viewerMock([space("riverside", "Riverside Makers", "MEMBER")]),
      ...emptyFeed("riverside"),
    ]);
    await screen.findByRole("heading", { level: 1, name: "Riverside Makers" });
    expect(screen.queryByLabelText("Space")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Switch person" }));

    expect(window.localStorage.getItem("live-feed.token")).toBeNull();
  });

  it("explains a server failure", async () => {
    renderWithApollo(<Workspace />, [{ request: { query: VIEWER }, error: new Error("down") }]);
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not load your spaces");
  });
});
