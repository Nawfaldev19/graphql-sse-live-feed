import type { PubSub } from "graphql-yoga";
import { readToken } from "../auth/tokens.js";
import type { Role } from "../db/database.js";
import type { ActivityRecord, Repository } from "../feed/repository.js";
import type { Logger } from "../logger.js";
import { forbidden, notFound, unauthenticated } from "./errors.js";

export type ActivityPubSub = PubSub<{ "activity:added": [spaceId: string, activity: ActivityRecord] }>;

export interface AppServices {
  repository: Repository;
  pubSub: ActivityPubSub;
  tokenSecret: string;
  logger: Logger;
  /** How often an open subscription re-checks membership when no events arrive. */
  membershipRecheckMs: number;
}

export interface Viewer {
  id: string;
  name: string;
}

export interface GraphQLContext extends AppServices {
  viewer: Viewer | null;
  /** Expiry of the token that authenticated this request (epoch ms), or null when signed out. */
  tokenExpiresAt: number | null;
  requireViewer(): Viewer;
  /** Resolves the viewer's role in a space, or throws NOT_FOUND if they are not a member. */
  requireMember(spaceId: string): { viewer: Viewer; role: Role };
  requireManager(spaceId: string): Viewer;
}

export function buildContext(services: AppServices, authorization: string | null): GraphQLContext {
  const token = authorization?.match(/^Bearer (\S+)$/)?.[1];
  const claims = token ? readToken(token, services.tokenSecret) : null;
  const viewer = claims ? (services.repository.findPerson(claims.sub) ?? null) : null;

  const requireViewer = () =>
    viewer ??
    (() => {
      throw unauthenticated();
    })();
  const requireMember = (spaceId: string) => {
    const current = requireViewer();
    const role = services.repository.roleIn(current.id, spaceId);
    if (!role) throw notFound();
    return { viewer: current, role };
  };
  const requireManager = (spaceId: string) => {
    const { viewer: current, role } = requireMember(spaceId);
    if (role === "member") throw forbidden();
    return current;
  };

  return {
    ...services,
    viewer,
    tokenExpiresAt: viewer && claims ? claims.exp : null,
    requireViewer,
    requireMember,
    requireManager,
  };
}
