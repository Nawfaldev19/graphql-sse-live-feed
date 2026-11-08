import { useId, useState, type FormEvent } from "react";
import { useMutation } from "@apollo/client";
import { POST_ANNOUNCEMENT } from "../graphql/operations";

const MAX_LENGTH = 280;

export function AnnouncementForm({ spaceId }: { spaceId: string }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [posted, setPosted] = useState(false);
  const [post, { loading }] = useMutation(POST_ANNOUNCEMENT);
  const id = useId();

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setPosted(false);
    try {
      const { data } = await post({ variables: { spaceId, message } });
      const problem = data?.postAnnouncement.errors[0]?.message;
      setError(problem ?? null);
      if (!problem) {
        setMessage("");
        setPosted(true);
      }
    } catch {
      setError("Could not post. Check your connection and try again.");
    }
  };

  return (
    <form className="form-stack card" onSubmit={(event) => void onSubmit(event)} aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>Post an announcement</h2>
      <div className="field">
        <label htmlFor={`${id}-message`}>Message</label>
        <textarea
          id={`${id}-message`}
          className="input"
          value={message}
          maxLength={MAX_LENGTH}
          onChange={(event) => setMessage(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-hint`}
        />
        <span id={`${id}-hint`} className={error ? "field-error" : "field-hint"}>
          {error ?? `${MAX_LENGTH - message.length} characters left. Everyone in this space sees it immediately.`}
        </span>
      </div>
      <div role="status">{posted && <p className="alert alert-success">Posted.</p>}</div>
      <button type="submit" className="button button-primary" disabled={loading}>
        {loading ? "Posting…" : "Post"}
      </button>
    </form>
  );
}
