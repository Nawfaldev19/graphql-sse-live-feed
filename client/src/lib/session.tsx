import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { readStored, writeStored } from "./storage";

const TOKEN_KEY = "live-feed.token";
const SPACE_KEY = "live-feed.space";

export interface Session {
  token: string | null;
  spaceId: string | null;
  signIn: (token: string) => void;
  signOut: () => void;
  selectSpace: (spaceId: string) => void;
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => readStored(TOKEN_KEY));
  const [spaceId, setSpaceId] = useState(() => readStored(SPACE_KEY));

  const signIn = useCallback((next: string) => {
    writeStored(TOKEN_KEY, next);
    setToken(next);
  }, []);
  const signOut = useCallback(() => {
    writeStored(TOKEN_KEY, null);
    writeStored(SPACE_KEY, null);
    setToken(null);
    setSpaceId(null);
  }, []);
  const selectSpace = useCallback((next: string) => {
    writeStored(SPACE_KEY, next);
    setSpaceId(next);
  }, []);

  const value = useMemo(
    () => ({ token, spaceId, signIn, signOut, selectSpace }),
    [token, spaceId, signIn, signOut, selectSpace],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession must be used inside <SessionProvider>");
  return session;
}
