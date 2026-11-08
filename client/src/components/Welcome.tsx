import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Bell, Filter, Radio, ShieldCheck } from "lucide-react";
import { DEMO_IDENTITIES, SIGN_IN_AS_DEMO } from "../graphql/operations";
import { useSession } from "../lib/session";

const FEATURES = [
  {
    icon: Radio,
    title: "Live over Server-Sent Events",
    body: "New activity is pushed by a GraphQL subscription; no polling, no refresh.",
  },
  {
    icon: ShieldCheck,
    title: "Authorized push channel",
    body: "A subscription only starts for a space you belong to, and its topic only carries that space's events.",
  },
  {
    icon: Filter,
    title: "Keyset pagination",
    body: "Older pages stay correct while new items keep arriving at the top.",
  },
  {
    icon: Bell,
    title: "Optimistic read state",
    body: "Unread counts update instantly and reconcile with the server's answer.",
  },
];

export function Welcome() {
  const { data, loading, error } = useQuery(DEMO_IDENTITIES);
  const [signInAsDemo, { loading: signingIn }] = useMutation(SIGN_IN_AS_DEMO);
  const [failed, setFailed] = useState(false);
  const { signIn } = useSession();

  const choose = async (personId: string) => {
    setFailed(false);
    try {
      const result = await signInAsDemo({ variables: { personId } });
      const token = result.data?.signInAsDemo.token;
      if (token) signIn(token);
      else setFailed(true);
    } catch {
      setFailed(true);
    }
  };

  return (
    <div className="split">
      <section className="hero">
        <p className="badge">Portfolio demo</p>
        <h1>What&apos;s happening at the workshop, as it happens.</h1>
        <p className="lead">
          A live activity feed for a fictional network of makerspaces. A simulator posts new bookings every few seconds
          so you can watch updates arrive.
        </p>
        <ul className="feature-list" aria-label="What this demo shows">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <li key={title}>
              <Icon size={22} aria-hidden="true" />
              <div>
                <h2 className="feature-title">{title}</h2>
                <p className="meta">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="card" aria-labelledby="identity-heading">
        <h2 id="identity-heading">Pick someone to be</h2>
        <p className="meta">
          No passwords in demo mode. Ada belongs to two spaces; Cora is a member and cannot post announcements.
        </p>
        {(error ?? failed) && (
          <p className="alert alert-error" role="alert">
            Could not reach the server. Make sure it is running, then try again.
          </p>
        )}
        {loading ? (
          <p role="status">Loading people…</p>
        ) : (
          <div className="identity-list">
            {data?.demoIdentities.map((person) => (
              <button
                key={person.id}
                type="button"
                className="button button-secondary"
                disabled={signingIn}
                onClick={() => void choose(person.id)}
              >
                Continue as {person.name}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
