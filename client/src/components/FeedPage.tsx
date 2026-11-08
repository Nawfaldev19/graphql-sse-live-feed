import { useEffect, useState } from "react";
import { NetworkStatus, useMutation, useQuery, useSubscription } from "@apollo/client";
import { ArrowUp, CheckCheck } from "lucide-react";
import { ACTIVITY_ADDED, FEED, MARK_ALL_READ, MARK_READ } from "../graphql/operations";
import type { ActivityKind, FeedQuery } from "../graphql/generated/graphql";
import { prependLive } from "../lib/feedCache";
import { ActivityItem } from "./ActivityItem";
import { AnnouncementForm } from "./AnnouncementForm";

type FeedItem = FeedQuery["feed"]["items"][number];

const FILTERS: { label: string; kind: ActivityKind | null }[] = [
  { label: "Everything", kind: null },
  { label: "Bookings", kind: "BOOKING" },
  { label: "Announcements", kind: "ANNOUNCEMENT" },
  { label: "Equipment", kind: "EQUIPMENT" },
  { label: "Members", kind: "MEMBERSHIP" },
];

/** Re-renders every 30 seconds so relative times ("2 minutes ago") stay fresh. */
function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, intervalMs);
    return () => {
      window.clearInterval(timer);
    };
  }, [intervalMs]);
  return now;
}

export function FeedPage({ spaceId, spaceName, canPost }: { spaceId: string; spaceName: string; canPost: boolean }) {
  const [kind, setKind] = useState<ActivityKind | null>(null);
  const [unseen, setUnseen] = useState(0);
  const variables = { spaceId, kind };
  const now = useNow();
  const { data, error, fetchMore, networkStatus, refetch, client } = useQuery(FEED, {
    variables,
    notifyOnNetworkStatusChange: true,
  });

  // Each filter is its own cache entry. A pushed item goes into every entry that would list it ("Everything" and
  // its own kind), not only the one on screen; otherwise switching filters after a push showed a stale, cache-first
  // list. Filters that were never loaded read back as null and are left alone.
  const prependToCachedFilters = (activity: FeedItem) => {
    for (const filter of FILTERS) {
      if (filter.kind !== null && filter.kind !== activity.kind) continue;
      client.cache.updateQuery(
        { query: FEED, variables: { spaceId, kind: filter.kind } },
        (previous: FeedQuery | null) =>
          previous && { ...previous, feed: { ...previous.feed, items: prependLive(previous.feed.items, activity) } },
      );
    }
  };

  const { error: liveError } = useSubscription(ACTIVITY_ADDED, {
    variables: { spaceId },
    onData: ({ data: pushed }) => {
      const activity = pushed.data?.activityAdded;
      if (!activity) return;
      // unreadCount is one field per space, shared by every filter's query, so it is bumped once.
      if (!activity.isRead) {
        client.cache.updateQuery(
          { query: FEED, variables },
          (previous: FeedQuery | null) => previous && { ...previous, unreadCount: previous.unreadCount + 1 },
        );
      }
      prependToCachedFilters(activity);
      if (window.scrollY > 160) setUnseen((count) => count + 1);
    },
  });

  const [markRead] = useMutation(MARK_READ);
  const [markAllRead, { loading: markingAll }] = useMutation(MARK_ALL_READ);

  const setReadInCache = (ids: readonly string[], unreadCount: number) => {
    for (const id of ids) {
      client.cache.modify({
        id: client.cache.identify({ __typename: "Activity", id }),
        fields: { isRead: () => true },
      });
    }
    client.cache.updateQuery(
      { query: FEED, variables },
      (previous: FeedQuery | null) => previous && { ...previous, unreadCount },
    );
  };

  // Optimistic: the item turns read and the count drops immediately; the server's count then replaces the guess.
  const onMarkRead = (id: string) => {
    const guess = Math.max(0, (data?.unreadCount ?? 1) - 1);
    setReadInCache([id], guess);
    void markRead({ variables: { spaceId, activityIds: [id] } }).then(
      (result) => {
        setReadInCache([id], result.data?.markRead.unreadCount ?? guess);
      },
      () => {
        void refetch();
      },
    );
  };

  // The server marks the whole space read, so every cached filter is updated, not just the visible one.
  const cachedUnreadIds = () => {
    const ids = new Set<string>();
    for (const filter of FILTERS) {
      const cached = client.cache.readQuery({ query: FEED, variables: { spaceId, kind: filter.kind } });
      for (const item of cached?.feed.items ?? []) if (!item.isRead) ids.add(item.id);
    }
    return [...ids];
  };

  const onMarkAll = async () => {
    const ids = cachedUnreadIds();
    setReadInCache(ids, 0);
    try {
      await markAllRead({ variables: { spaceId } });
    } catch {
      await refetch();
    }
  };

  const items = data?.feed.items;
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div className="feed-layout">
      <section aria-labelledby="feed-heading">
        <div className="page-header">
          <div>
            <h1 id="feed-heading">{spaceName}</h1>
            <p>
              <span className="live-dot" aria-hidden="true" />
              Live activity · <span className="unread-count">{unreadCount}</span> unread
            </p>
          </div>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => void onMarkAll()}
            disabled={markingAll || unreadCount === 0}
          >
            <CheckCheck size={18} aria-hidden="true" /> Mark all read
          </button>
        </div>

        <div className="chips" role="group" aria-label="Filter activity">
          {FILTERS.map((filter) => (
            <button
              key={filter.label}
              type="button"
              className="chip"
              aria-pressed={kind === filter.kind}
              onClick={() => setKind(filter.kind)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div aria-live="polite" className="visually-hidden">
          {unseen > 0 ? `${unseen} new ${unseen === 1 ? "update" : "updates"} above` : ""}
        </div>
        {unseen > 0 && (
          <button
            type="button"
            className="button button-primary new-pill"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              setUnseen(0);
            }}
          >
            <ArrowUp size={16} aria-hidden="true" /> {unseen} new
          </button>
        )}

        {liveError && (
          <p className="alert alert-error" role="status">
            Live updates stopped: {liveError.message}
          </p>
        )}

        {error && !items ? (
          <div className="state card" role="alert">
            <h2>The feed didn&apos;t load</h2>
            <p>Check that the server is running, then try again.</p>
            <button type="button" className="button button-secondary" onClick={() => void refetch()}>
              Try again
            </button>
          </div>
        ) : !items ? (
          <p role="status">Loading activity…</p>
        ) : items.length === 0 ? (
          <div className="state card">
            <h2>Nothing here yet</h2>
            <p>New activity will appear here as soon as it happens.</p>
          </div>
        ) : (
          <>
            <ol className="feed" aria-label="Activity, newest first">
              {items.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} onMarkRead={onMarkRead} now={now} />
              ))}
            </ol>
            {data.feed.nextCursor && (
              <div className="pagination">
                <button
                  type="button"
                  className="button button-secondary"
                  disabled={networkStatus === NetworkStatus.fetchMore}
                  onClick={() => void fetchMore({ variables: { after: data.feed.nextCursor } })}
                >
                  Load older activity
                </button>
              </div>
            )}
          </>
        )}
      </section>
      {canPost && <AnnouncementForm spaceId={spaceId} />}
    </div>
  );
}
