import { gql } from "@apollo/client";

const sseSubscribe = vi.fn();
const sseOptions: { headers?: () => Record<string, string> }[] = [];

vi.mock("graphql-sse", () => ({
  createClient: (options: { headers?: () => Record<string, string> }) => {
    sseOptions.push(options);
    return { subscribe: sseSubscribe, iterate: vi.fn(), dispose: vi.fn(), terminate: vi.fn() };
  },
}));

const { createApolloClient } = await import("./apollo");

const QUERY = gql`
  query Probe {
    unreadCount(spaceId: "riverside")
  }
`;
const SUBSCRIPTION = gql`
  subscription Live {
    activityAdded(spaceId: "riverside") {
      id
    }
  }
`;

function stubFetch(body: object) {
  const fetchMock = vi.fn(() =>
    Promise.resolve(new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } })),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  sseSubscribe.mockReset();
});

describe("createApolloClient", () => {
  it("sends queries over HTTP with the current bearer token", async () => {
    const fetchMock = stubFetch({ data: { unreadCount: 2 } });
    const client = createApolloClient({ getToken: () => "abc", onUnauthenticated: vi.fn() });

    const result = await client.query({ query: QUERY });

    expect(result.data).toEqual({ unreadCount: 2 });
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(init.headers).toMatchObject({ authorization: "Bearer abc" });
  });

  it("routes subscriptions to the SSE client, which reads the token per connection", async () => {
    sseSubscribe.mockImplementation((_payload: unknown, sink: { next: (value: unknown) => void }) => {
      sink.next({ data: { activityAdded: { id: "9" } } });
      return () => undefined;
    });
    let token: string | null = "first";
    const client = createApolloClient({ getToken: () => token, onUnauthenticated: vi.fn() });
    const first = new Promise((resolve) => {
      client.subscribe({ query: SUBSCRIPTION }).subscribe({ next: (value) => resolve(value.data) });
    });

    expect(await first).toEqual({ activityAdded: { id: "9" } });
    expect(sseSubscribe).toHaveBeenCalledTimes(1);
    expect((sseSubscribe.mock.calls[0]?.[0] as { query: string }).query).toContain("activityAdded");
    expect(sseOptions.at(-1)?.headers?.()).toEqual({ Authorization: "Bearer first" });
    token = null;
    expect(sseOptions.at(-1)?.headers?.()).toEqual({});
  });

  it("signals UNAUTHENTICATED responses", async () => {
    stubFetch({ data: null, errors: [{ message: "Choose a demo identity", extensions: { code: "UNAUTHENTICATED" } }] });
    const onUnauthenticated = vi.fn();
    const client = createApolloClient({ getToken: () => "expired", onUnauthenticated });

    await expect(client.query({ query: QUERY })).rejects.toThrow("Choose a demo identity");
    expect(onUnauthenticated).toHaveBeenCalledTimes(1);
  });

  it("signs out when a live stream ends because the token expired", async () => {
    sseSubscribe.mockImplementation(
      (_payload: unknown, sink: { next: (value: unknown) => void; complete: () => void }) => {
        sink.next({
          data: null,
          errors: [{ message: "Your session has expired.", extensions: { code: "UNAUTHENTICATED" } }],
        });
        sink.complete();
        return () => undefined;
      },
    );
    const onUnauthenticated = vi.fn();
    const client = createApolloClient({ getToken: () => "old", onUnauthenticated });

    await new Promise<void>((resolve) => {
      client.subscribe({ query: SUBSCRIPTION }).subscribe({ error: () => resolve(), complete: () => resolve() });
    });
    expect(onUnauthenticated).toHaveBeenCalledTimes(1);
  });
});
