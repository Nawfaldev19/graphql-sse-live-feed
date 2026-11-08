import { z } from "zod";
import { issueToken } from "../auth/tokens.js";
import type { ActivityKind } from "../db/database.js";
import { decodeCursor, encodeCursor } from "../feed/cursor.js";
import type { ActivityRecord } from "../feed/repository.js";
import type { GraphQLContext, Viewer } from "./context.js";
import { badInput, membershipEnded, notFound, sessionExpired } from "./errors.js";
import { guardStream, isStreamClosed, type StreamClosed } from "./liveStream.js";

const MAX_PAGE = 50;
const MAX_IDS = 100;

const kindSchema = z
  .enum(["BOOKING", "ANNOUNCEMENT", "EQUIPMENT", "MEMBERSHIP"])
  .transform((value) => value.toLowerCase() as ActivityKind);

const feedArgs = z.object({
  spaceId: z.string().min(1),
  kind: kindSchema.nullish(),
  after: z.string().nullish(),
  first: z.number().int().min(1).max(MAX_PAGE).nullish(),
});

const markReadArgs = z.object({
  spaceId: z.string().min(1),
  activityIds: z
    .array(z.string().regex(/^\d+$/, "Activity ids are numeric"))
    .max(MAX_IDS, `At most ${MAX_IDS} ids at a time`),
});

const announcementArgs = z.object({
  spaceId: z.string().min(1),
  message: z.string().trim().min(1, "Write a message first").max(280, "Keep it under 280 characters"),
});

/** Validates resolver arguments; schema-level typing has already rejected wrong types. */
function parse<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw badInput(result.error.issues.map((issue) => issue.message).join("; "));
  return result.data;
}

function toActivity(record: ActivityRecord, isRead: boolean) {
  return { ...record, id: String(record.id), kind: record.kind.toUpperCase(), isRead };
}

function viewerWithSpaces(context: GraphQLContext, viewer: Viewer) {
  return {
    ...viewer,
    spaces: context.repository.membershipsOf(viewer.id).map((membership) => ({
      id: membership.spaceId,
      name: membership.spaceName,
      role: membership.role.toUpperCase(),
    })),
  };
}

export const resolvers = {
  Query: {
    demoIdentities: (_: unknown, __: unknown, context: GraphQLContext) => context.repository.listPeople(),

    viewer: (_: unknown, __: unknown, context: GraphQLContext) =>
      context.viewer ? viewerWithSpaces(context, context.viewer) : null,

    feed: (_: unknown, args: unknown, context: GraphQLContext) => {
      const { spaceId, kind, after, first } = parse(feedArgs, args);
      const { viewer } = context.requireMember(spaceId);
      const beforeId = after ? decodeCursor(after) : null;
      if (after && beforeId === null) throw badInput("Invalid cursor");

      const page = context.repository.page({ spaceId, kind: kind ?? null, beforeId, limit: first ?? 20 });
      const read = context.repository.readIds(
        viewer.id,
        page.items.map((item) => item.id),
      );
      const last = page.items.at(-1);
      return {
        items: page.items.map((item) => toActivity(item, read.has(item.id))),
        nextCursor: page.hasMore && last ? encodeCursor(last.id) : null,
      };
    },

    unreadCount: (_: unknown, args: { spaceId: string }, context: GraphQLContext) => {
      const { viewer } = context.requireMember(args.spaceId);
      return context.repository.unreadCount(viewer.id, args.spaceId);
    },
  },

  Mutation: {
    signInAsDemo: (_: unknown, args: { personId: string }, context: GraphQLContext) => {
      const person = context.repository.findPerson(args.personId);
      if (!person) throw notFound();
      context.logger.info("auth.demo_sign_in", { personId: person.id });
      return { token: issueToken(person.id, context.tokenSecret), viewer: viewerWithSpaces(context, person) };
    },

    markRead: (_: unknown, args: unknown, context: GraphQLContext) => {
      const { spaceId, activityIds } = parse(markReadArgs, args);
      const { viewer } = context.requireMember(spaceId);
      context.repository.markRead(viewer.id, spaceId, activityIds.map(Number));
      return { unreadCount: context.repository.unreadCount(viewer.id, spaceId) };
    },

    markAllRead: (_: unknown, args: { spaceId: string }, context: GraphQLContext) => {
      const { viewer } = context.requireMember(args.spaceId);
      context.repository.markAllRead(viewer.id, args.spaceId);
      return { unreadCount: 0 };
    },

    postAnnouncement: (_: unknown, args: { spaceId: string; message: string }, context: GraphQLContext) => {
      const viewer = context.requireManager(args.spaceId);
      const parsed = announcementArgs.safeParse(args);
      if (!parsed.success) {
        return {
          activity: null,
          errors: parsed.error.issues.map((issue) => ({ field: String(issue.path[0] ?? ""), message: issue.message })),
        };
      }
      const record = context.repository.addActivity({
        spaceId: args.spaceId,
        actorId: viewer.id,
        kind: "announcement",
        summary: parsed.data.message,
      });
      context.pubSub.publish("activity:added", record.spaceId, record);
      context.logger.info("activity.announcement_posted", { spaceId: record.spaceId, activityId: record.id });
      return { activity: toActivity(record, true), errors: [] };
    },
  },

  Subscription: {
    activityAdded: {
      // The topic is keyed by space, so this stream only ever carries that
      // space's events. Access is checked at the start and again while the
      // stream is open: it ends when the token expires or the viewer leaves.
      subscribe: (_: unknown, args: { spaceId: string }, context: GraphQLContext) => {
        const { viewer } = context.requireMember(args.spaceId);
        return guardStream(context.pubSub.subscribe("activity:added", args.spaceId), {
          expiresAt: context.tokenExpiresAt ?? 0,
          expiredError: sessionExpired,
          checkAccess: () => (context.repository.roleIn(viewer.id, args.spaceId) ? null : membershipEnded()),
          recheckMs: context.membershipRecheckMs,
        });
      },
      resolve: (event: ActivityRecord | StreamClosed, _: unknown, context: GraphQLContext) => {
        if (isStreamClosed(event)) throw event.closed;
        return toActivity(event, event.actor.id === context.viewer?.id);
      },
    },
  },
};
