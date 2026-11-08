import { useEffect } from "react";
import { useApolloClient, useQuery } from "@apollo/client";
import { LogOut } from "lucide-react";
import { VIEWER } from "../graphql/operations";
import { useSession } from "../lib/session";
import { FeedPage } from "./FeedPage";
import { ThemeToggle } from "./ThemeToggle";

/** Signed-in shell: resolves the viewer, keeps the selected space valid, and renders its feed. */
export function Workspace() {
  const { spaceId, selectSpace, signOut } = useSession();
  const client = useApolloClient();
  const { data, loading, error } = useQuery(VIEWER);
  const viewer = data?.viewer;
  const space = viewer?.spaces.find((candidate) => candidate.id === spaceId) ?? viewer?.spaces[0];

  useEffect(() => {
    if (space && space.id !== spaceId) selectSpace(space.id);
  }, [space, spaceId, selectSpace]);

  useEffect(() => {
    if (data && !viewer) signOut();
  }, [data, viewer, signOut]);

  const leave = async () => {
    signOut();
    await client.clearStore();
  };

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <span className="brand">Live Feed</span>
        <div className="topbar-end">
          {viewer && viewer.spaces.length > 1 && space && (
            <>
              <label className="visually-hidden" htmlFor="space-switcher">
                Space
              </label>
              <select
                id="space-switcher"
                className="select"
                value={space.id}
                onChange={(event) => selectSpace(event.target.value)}
              >
                {viewer.spaces.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name} ({option.role.toLowerCase()})
                  </option>
                ))}
              </select>
            </>
          )}
          {viewer && <span className="meta">Signed in as {viewer.name}</span>}
          <ThemeToggle />
          <button type="button" className="button button-ghost" onClick={() => void leave()}>
            <LogOut size={18} aria-hidden="true" /> Switch person
          </button>
        </div>
      </header>
      <main id="main" className="main">
        {error ? (
          <p className="alert alert-error" role="alert">
            Could not load your spaces. Check that the server is running.
          </p>
        ) : loading || !space ? (
          <p role="status">Loading…</p>
        ) : (
          <FeedPage key={space.id} spaceId={space.id} spaceName={space.name} canPost={space.role !== "MEMBER"} />
        )}
      </main>
    </div>
  );
}
