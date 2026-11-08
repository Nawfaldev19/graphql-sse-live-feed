import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraphQLError } from "graphql";
import type { MockedResponse } from "@apollo/client/testing";
import { FeedPage } from "./FeedPage";
import { ACTIVITY_ADDED, FEED, MARK_ALL_READ, MARK_READ } from "../graphql/operations";
import { activity, renderWithApollo } from "../test/render";

const feedMock = (
  kind: string | null,
  items: ReturnType<typeof activity>[],
  unreadCount: number,
  nextCursor: string | null = null,
): MockedResponse => ({
  request: { query: FEED, variables: { spaceId: "riverside", kind } },
  result: { data: { feed: { __typename: "ActivityPage", items, nextCursor }, unreadCount } },
});

const noPush: MockedResponse = {
  request: { query: ACTIVITY_ADDED, variables: { spaceId: "riverside" } },
  result: { data: null as never },
  delay: 60_000,
};

const pushMock = (item: ReturnType<typeof activity>, delay = 20): MockedResponse => ({
  request: { query: ACTIVITY_ADDED, variables: { spaceId: "riverside" } },
  result: { data: { activityAdded: item } },
  delay,
});

function renderFeed(mocks: MockedResponse[], canPost = false) {
  renderWithApollo(<FeedPage spaceId="riverside" spaceName="Riverside Makers" canPost={canPost} />, mocks);
}

const unread = () => screen.getByText(/unread/).querySelector(".unread-count");

describe("FeedPage", () => {
  it("shows the feed newest first with unread markers and count", async () => {
    renderFeed([feedMock(null, [activity("2"), activity("1", { isRead: true })], 1), noPush]);

    const list = await screen.findByRole("list", { name: "Activity, newest first" });
    expect(
      within(list)
        .getAllByRole("listitem")
        .map((item) => item.querySelector(".activity__summary")?.textContent),
    ).toEqual(["Unread: Booked item 2", "Booked item 1"]);
    expect(unread()).toHaveTextContent("1");
    expect(screen.getByRole("button", { name: "Mark read: Booked item 2" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mark read: Booked item 1" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Post an announcement" })).toBeNull();
  });

  it("marks an item read optimistically and keeps the server's count", async () => {
    const user = userEvent.setup();
    const markRead: MockedResponse = {
      request: { query: MARK_READ, variables: { spaceId: "riverside", activityIds: ["2"] } },
      result: { data: { markRead: { __typename: "ReadStatePayload", unreadCount: 0 } } },
      delay: 50,
    };
    renderFeed([feedMock(null, [activity("2")], 1), noPush, markRead]);

    await user.click(await screen.findByRole("button", { name: "Mark read: Booked item 2" }));

    expect(screen.queryByRole("button", { name: "Mark read: Booked item 2" })).toBeNull();
    expect(unread()).toHaveTextContent("0");
    await waitFor(() => expect(unread()).toHaveTextContent("0"));
  });

  it("marks everything read", async () => {
    const user = userEvent.setup();
    const markAll: MockedResponse = {
      request: { query: MARK_ALL_READ, variables: { spaceId: "riverside" } },
      result: { data: { markAllRead: { __typename: "ReadStatePayload", unreadCount: 0 } } },
    };
    renderFeed([feedMock(null, [activity("3"), activity("2")], 2), noPush, markAll]);

    await user.click(await screen.findByRole("button", { name: "Mark all read" }));

    expect(screen.queryAllByRole("button", { name: /^Mark read:/ })).toHaveLength(0);
    expect(unread()).toHaveTextContent("0");
    expect(screen.getByRole("button", { name: "Mark all read" })).toBeDisabled();
  });

  it("filters by kind with pressed-state buttons", async () => {
    const user = userEvent.setup();
    renderFeed([
      feedMock(null, [activity("2"), activity("1", { kind: "ANNOUNCEMENT", summary: "Shop closed Monday" })], 2),
      noPush,
      feedMock("ANNOUNCEMENT", [activity("1", { kind: "ANNOUNCEMENT", summary: "Shop closed Monday" })], 2),
    ]);
    await screen.findByText("Booked item 2");

    await user.click(screen.getByRole("button", { name: "Announcements" }));

    expect(screen.getByRole("button", { name: "Announcements" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Everything" })).toHaveAttribute("aria-pressed", "false");
    await waitFor(() => expect(screen.queryByText("Booked item 2")).toBeNull());
    expect(screen.getByText("Shop closed Monday")).toBeInTheDocument();
  });

  it("inserts pushed activity at the top and counts it as unread", async () => {
    renderFeed([feedMock(null, [activity("1")], 1), pushMock(activity("7", { summary: "Live booking" }))]);
    await screen.findByText("Booked item 1");

    expect(await screen.findByText("Live booking")).toBeInTheDocument();
    const items = within(screen.getByRole("list", { name: "Activity, newest first" })).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Live booking");
    expect(unread()).toHaveTextContent("2");
  });

  it("shows a 'new' pill when the reader has scrolled down, and returns to the top", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "scrollY", { value: 500, configurable: true });
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    renderFeed([feedMock(null, [activity("1")], 1), pushMock(activity("8", { summary: "Another" }))]);

    const pill = await screen.findByRole("button", { name: "1 new" });
    expect(screen.getByText("1 new update above")).toBeInTheDocument();
    await user.click(pill);

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
    expect(screen.queryByRole("button", { name: "1 new" })).toBeNull();
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
  });

  it("offers older activity when there is a next cursor", async () => {
    renderFeed([feedMock(null, [activity("9")], 1, "cursor-1"), noPush]);
    expect(await screen.findByRole("button", { name: "Load older activity" })).toBeEnabled();
  });

  it("shows empty and error states", async () => {
    renderFeed([feedMock(null, [], 0), noPush]);
    expect(await screen.findByRole("heading", { name: "Nothing here yet" })).toBeInTheDocument();
  });

  it("shows an error with retry when the feed fails", async () => {
    renderFeed([
      { request: { query: FEED, variables: { spaceId: "riverside", kind: null } }, error: new Error("down") },
      noPush,
    ]);
    expect(await screen.findByRole("alert")).toHaveTextContent("The feed didn't load");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("shows the announcement form to managers", async () => {
    renderFeed([feedMock(null, [], 0), noPush], true);
    expect(await screen.findByRole("heading", { name: "Post an announcement" })).toBeInTheDocument();
  });

  it("shows a booking pushed while on Announcements after switching back to Everything", async () => {
    const user = userEvent.setup();
    const notice = activity("1", { kind: "ANNOUNCEMENT", summary: "Shop closed Monday" });
    renderFeed([
      feedMock(null, [activity("2"), notice], 2),
      feedMock("ANNOUNCEMENT", [notice], 2),
      pushMock(activity("7", { summary: "Live booking" }), 300),
    ]);
    await screen.findByText("Booked item 2");

    await user.click(screen.getByRole("button", { name: "Announcements" }));
    await waitFor(() => expect(screen.queryByText("Booked item 2")).toBeNull());
    await waitFor(() => expect(unread()).toHaveTextContent("3"));
    expect(screen.queryByText("Live booking")).toBeNull();

    // There is no second "Everything" mock: the list must come from the cache, with the push already in it.
    await user.click(screen.getByRole("button", { name: "Everything" }));
    const items = within(await screen.findByRole("list", { name: "Activity, newest first" })).getAllByRole("listitem");
    expect(items.map((item) => item.querySelector(".activity__summary")?.textContent)).toEqual([
      "Unread: Live booking",
      "Unread: Booked item 2",
      "Unread: Shop closed Monday",
    ]);
    expect(unread()).toHaveTextContent("3");
  });

  it("adds a pushed item to its own kind's cached filter too, and leaves other kinds alone", async () => {
    const user = userEvent.setup();
    const notice = activity("1", { kind: "ANNOUNCEMENT", summary: "Shop closed Monday" });
    renderFeed([
      feedMock(null, [activity("2"), notice], 2),
      feedMock("BOOKING", [activity("2")], 2),
      feedMock("ANNOUNCEMENT", [notice], 2),
      pushMock(activity("7", { summary: "Live booking" }), 300),
    ]);
    await screen.findByText("Booked item 2");
    await user.click(screen.getByRole("button", { name: "Bookings" }));
    await user.click(screen.getByRole("button", { name: "Announcements" }));
    await screen.findByText("Shop closed Monday");
    await waitFor(() => expect(unread()).toHaveTextContent("3"));
    expect(screen.queryByText("Live booking")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Bookings" }));
    expect(await screen.findByText("Live booking")).toBeInTheDocument();
  });

  it("marks items read in every cached filter, not only the visible one", async () => {
    const user = userEvent.setup();
    const notice = activity("1", { kind: "ANNOUNCEMENT", summary: "Shop closed Monday" });
    const markAll: MockedResponse = {
      request: { query: MARK_ALL_READ, variables: { spaceId: "riverside" } },
      result: { data: { markAllRead: { __typename: "ReadStatePayload", unreadCount: 0 } } },
    };
    renderFeed([feedMock(null, [activity("2"), notice], 2), feedMock("ANNOUNCEMENT", [notice], 2), noPush, markAll]);
    await screen.findByText("Booked item 2");
    await user.click(screen.getByRole("button", { name: "Announcements" }));
    await screen.findByRole("button", { name: "Mark read: Shop closed Monday" });

    await user.click(screen.getByRole("button", { name: "Mark all read" }));
    await user.click(screen.getByRole("button", { name: "Everything" }));

    await screen.findByText("Booked item 2");
    expect(screen.queryAllByRole("button", { name: /^Mark read:/ })).toHaveLength(0);
  });

  it("says so when the server ends the live stream", async () => {
    const ended: MockedResponse = {
      request: { query: ACTIVITY_ADDED, variables: { spaceId: "riverside" } },
      result: { errors: [new GraphQLError("You are no longer a member of this space")] },
      delay: 20,
    };
    renderFeed([feedMock(null, [activity("1")], 1), ended]);

    expect(
      await screen.findByText(/Live updates stopped: You are no longer a member of this space/),
    ).toBeInTheDocument();
    expect(screen.getByText("Booked item 1")).toBeInTheDocument();
  });
});
