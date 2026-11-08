import { issueToken, TOKEN_LIFETIME_MS } from "../src/auth/tokens.js";
import { SECRET, setup } from "./helpers.js";

const FEED = `query Feed($spaceId: ID!, $kind: ActivityKind, $after: String, $first: Int) {
  feed(spaceId: $spaceId, kind: $kind, after: $after, first: $first) {
    items { id kind summary isRead actor { id name } }
    nextCursor
  }
}`;

interface FeedData {
  feed: {
    items: { id: string; kind: string; summary: string; isRead: boolean; actor: { id: string } }[];
    nextCursor: string | null;
  };
}

const codes = (body: { errors?: { extensions?: { code?: string } }[] }) =>
  (body.errors ?? []).map((error) => error.extensions?.code);

describe("GraphQL API", () => {
  it("lists demo identities and signs in as one", async () => {
    const { graphql } = setup();
    const identities = await graphql<{ demoIdentities: { id: string }[] }>("{ demoIdentities { id name } }");
    expect(identities.data?.demoIdentities.map((person) => person.id)).toEqual(["ada", "ben", "cora", "priya", "theo"]);

    const signIn = await graphql<{
      signInAsDemo: { token: string; viewer: { spaces: { id: string; role: string }[] } };
    }>('mutation { signInAsDemo(personId: "ada") { token viewer { spaces { id role } } } }');
    expect(signIn.data?.signInAsDemo.token).toMatch(/^[\w-]+\.[\w-]+$/);
    expect(signIn.data?.signInAsDemo.viewer.spaces).toEqual([
      { id: "foundry", role: "MEMBER" },
      { id: "riverside", role: "OWNER" },
    ]);
  });

  it("refuses unknown identities and unauthenticated feed access", async () => {
    const { graphql } = setup();
    expect(codes(await graphql('mutation { signInAsDemo(personId: "mallory") { token } }'))).toEqual(["NOT_FOUND"]);
    expect(codes(await graphql(FEED, { spaceId: "riverside" }))).toEqual(["UNAUTHENTICATED"]);
    expect((await graphql<{ viewer: null }>("{ viewer { id } }")).data?.viewer).toBeNull();
  });

  it("returns the feed newest first with read state and a working cursor", async () => {
    const { graphql } = setup();
    const page1 = await graphql<FeedData>(FEED, { spaceId: "riverside", first: 3 }, "cora");
    const page2 = await graphql<FeedData>(
      FEED,
      { spaceId: "riverside", first: 3, after: page1.data?.feed.nextCursor },
      "cora",
    );

    const ids = [...(page1.data?.feed.items ?? []), ...(page2.data?.feed.items ?? [])].map((item) => Number(item.id));
    expect(ids).toEqual([4, 3, 2, 1]);
    expect(page2.data?.feed.nextCursor).toBeNull();
    const own = page1.data?.feed.items.find((item) => item.actor.id === "cora");
    expect(own?.isRead).toBe(true);
  });

  it("filters by kind", async () => {
    const { graphql } = setup();
    const body = await graphql<FeedData>(FEED, { spaceId: "riverside", kind: "ANNOUNCEMENT" }, "cora");
    expect(body.data?.feed.items.map((item) => item.kind)).toEqual(["ANNOUNCEMENT"]);
  });

  it("validates page size and cursors", async () => {
    const { graphql } = setup();
    expect(codes(await graphql(FEED, { spaceId: "riverside", first: 500 }, "cora"))).toEqual(["BAD_USER_INPUT"]);
    expect(codes(await graphql(FEED, { spaceId: "riverside", after: "nonsense" }, "cora"))).toEqual(["BAD_USER_INPUT"]);
  });

  it("a member cannot read, mark, or subscribe to another space, which looks like it does not exist", async () => {
    const { graphql } = setup();
    expect(codes(await graphql(FEED, { spaceId: "foundry" }, "cora"))).toEqual(["NOT_FOUND"]);
    expect(codes(await graphql('{ unreadCount(spaceId: "foundry") }', {}, "cora"))).toEqual(["NOT_FOUND"]);
    expect(codes(await graphql('mutation { markAllRead(spaceId: "foundry") { unreadCount } }', {}, "cora"))).toEqual([
      "NOT_FOUND",
    ]);
    expect(codes(await graphql(FEED, { spaceId: "no-such-space" }, "cora"))).toEqual(["NOT_FOUND"]);
  });

  it("marks items read, ignoring ids from other spaces, and marks all read", async () => {
    const { graphql } = setup();
    const before = await graphql<{ unreadCount: number }>('{ unreadCount(spaceId: "riverside") }', {}, "cora");
    expect(before.data?.unreadCount).toBe(3);

    const marked = await graphql<{ markRead: { unreadCount: number } }>(
      'mutation { markRead(spaceId: "riverside", activityIds: ["4", "7"]) { unreadCount } }',
      {},
      "cora",
    );
    expect(marked.data?.markRead.unreadCount).toBe(2);

    const all = await graphql<{ markAllRead: { unreadCount: number } }>(
      'mutation { markAllRead(spaceId: "riverside") { unreadCount } }',
      {},
      "cora",
    );
    expect(all.data?.markAllRead.unreadCount).toBe(0);
  });

  it("rejects malformed or too many ids", async () => {
    const { graphql } = setup();
    const ids = Array.from({ length: 101 }, (_, index) => String(index + 1));
    expect(
      codes(
        await graphql('mutation { markRead(spaceId: "riverside", activityIds: ["abc"]) { unreadCount } }', {}, "cora"),
      ),
    ).toEqual(["BAD_USER_INPUT"]);
    expect(
      codes(
        await graphql(
          'mutation($ids: [ID!]!) { markRead(spaceId: "riverside", activityIds: $ids) { unreadCount } }',
          { ids },
          "cora",
        ),
      ),
    ).toEqual(["BAD_USER_INPUT"]);
  });

  it("only owners and staff can post announcements, and messages are validated", async () => {
    const { graphql } = setup();
    const post = `mutation($message: String!) {
      postAnnouncement(spaceId: "riverside", message: $message) { activity { kind summary isRead } errors { field message } }
    }`;

    expect(codes(await graphql(post, { message: "Hello" }, "cora"))).toEqual(["FORBIDDEN"]);

    const ok = await graphql<{ postAnnouncement: { activity: { kind: string; summary: string; isRead: boolean } } }>(
      post,
      { message: "  Shop closes early today.  " },
      "ben",
    );
    expect(ok.data?.postAnnouncement.activity).toEqual({
      kind: "ANNOUNCEMENT",
      summary: "Shop closes early today.",
      isRead: true,
    });

    const empty = await graphql<{ postAnnouncement: { activity: null; errors: { field: string; message: string }[] } }>(
      post,
      { message: "   " },
      "ben",
    );
    expect(empty.data?.postAnnouncement).toEqual({
      activity: null,
      errors: [{ field: "message", message: "Write a message first" }],
    });

    const long = await graphql<{ postAnnouncement: { errors: { message: string }[] } }>(
      post,
      { message: "x".repeat(281) },
      "ben",
    );
    expect(long.data?.postAnnouncement.errors[0]?.message).toBe("Keep it under 280 characters");
  });

  it("masks unexpected errors", async () => {
    const { graphql, db } = setup();
    db.close();
    const body = await graphql('{ unreadCount(spaceId: "riverside") }', {}, "cora");
    expect(body.errors?.[0]?.message).toBe("Unexpected error.");
  });
});

describe("activityAdded subscription", () => {
  const SUBSCRIPTION =
    "subscription($spaceId: ID!) { activityAdded(spaceId: $spaceId) { id summary isRead actor { id } } }";

  it("pushes new activity in the subscribed space, with read state per viewer", async () => {
    const { subscribe, app, graphql } = setup();
    const cora = await subscribe(SUBSCRIPTION, { spaceId: "riverside" }, "cora");

    await graphql(
      'mutation { postAnnouncement(spaceId: "riverside", message: "Live!") { errors { message } } }',
      {},
      "ben",
    );
    const event = await cora.nextEvent();

    expect(event).toMatchObject({ data: { activityAdded: { summary: "Live!", isRead: false, actor: { id: "ben" } } } });

    app.publish(
      app.services.repository.addActivity({ spaceId: "riverside", actorId: "cora", kind: "booking", summary: "Mine" }),
    );
    expect(await cora.nextEvent()).toMatchObject({ data: { activityAdded: { summary: "Mine", isRead: true } } });
    await cora.close();
  });

  it("never delivers another space's events", async () => {
    const { subscribe, app } = setup();
    const cora = await subscribe(SUBSCRIPTION, { spaceId: "riverside" }, "cora");

    app.publish(
      app.services.repository.addActivity({
        spaceId: "foundry",
        actorId: "theo",
        kind: "announcement",
        summary: "Foundry only",
      }),
    );

    expect(await cora.nextEvent(300)).toBeNull();
    await cora.close();
  });

  it("refuses to subscribe to a space the viewer is not in", async () => {
    const { subscribe } = setup();
    const attempt = await subscribe(SUBSCRIPTION, { spaceId: "foundry" }, "cora");
    const event = await attempt.nextEvent();

    expect(event).toMatchObject({ errors: [{ extensions: { code: "NOT_FOUND" } }] });
    await attempt.close();
  });

  it("ends the stream with UNAUTHENTICATED when the token expires", async () => {
    const { subscribe, app } = setup();
    const shortLived = issueToken("cora", SECRET, Date.now() - TOKEN_LIFETIME_MS + 300);
    const cora = await subscribe(SUBSCRIPTION, { spaceId: "riverside" }, "cora", shortLived);

    app.publish(
      app.services.repository.addActivity({
        spaceId: "riverside",
        actorId: "ben",
        kind: "booking",
        summary: "Before expiry",
      }),
    );
    expect(await cora.nextEvent()).toMatchObject({ data: { activityAdded: { summary: "Before expiry" } } });

    // No event is needed: the expiry timer closes a quiet stream on its own.
    expect(await cora.nextEvent(1500)).toMatchObject({ errors: [{ extensions: { code: "UNAUTHENTICATED" } }] });
    expect(await cora.nextEvent(500)).toBeNull();
    expect(cora.completed()).toBe(true);
    await cora.close();
  });

  it("stops delivering on the next event after the viewer is removed from the space", async () => {
    const { subscribe, app, db } = setup();
    const cora = await subscribe(SUBSCRIPTION, { spaceId: "riverside" }, "cora");

    db.prepare("DELETE FROM memberships WHERE person_id = 'cora' AND space_id = 'riverside'").run();
    app.publish(
      app.services.repository.addActivity({
        spaceId: "riverside",
        actorId: "ben",
        kind: "booking",
        summary: "After removal",
      }),
    );

    const event = await cora.nextEvent();
    expect(event).toMatchObject({ data: null, errors: [{ extensions: { code: "FORBIDDEN" } }] });
    expect(JSON.stringify(event)).not.toContain("After removal");
    expect(await cora.nextEvent(500)).toBeNull();
    expect(cora.completed()).toBe(true);
    await cora.close();
  });

  it("closes a quiet stream on the membership re-check timer", async () => {
    const { subscribe, db } = setup({ membershipRecheckMs: 50 });
    const cora = await subscribe(SUBSCRIPTION, { spaceId: "riverside" }, "cora");

    db.prepare("DELETE FROM memberships WHERE person_id = 'cora' AND space_id = 'riverside'").run();

    expect(await cora.nextEvent()).toMatchObject({ errors: [{ extensions: { code: "FORBIDDEN" } }] });
    expect(await cora.nextEvent(500)).toBeNull();
    expect(cora.completed()).toBe(true);
    await cora.close();
  });
});
