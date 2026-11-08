/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query DemoIdentities {\n    demoIdentities {\n      id\n      name\n    }\n  }\n": typeof types.DemoIdentitiesDocument,
    "\n  mutation SignInAsDemo($personId: ID!) {\n    signInAsDemo(personId: $personId) {\n      token\n    }\n  }\n": typeof types.SignInAsDemoDocument,
    "\n  query Viewer {\n    viewer {\n      id\n      name\n      spaces {\n        id\n        name\n        role\n      }\n    }\n  }\n": typeof types.ViewerDocument,
    "\n  fragment ActivityFields on Activity {\n    id\n    kind\n    summary\n    createdAt\n    isRead\n    actor {\n      id\n      name\n    }\n  }\n": typeof types.ActivityFieldsFragmentDoc,
    "\n  query Feed($spaceId: ID!, $kind: ActivityKind, $after: String) {\n    feed(spaceId: $spaceId, kind: $kind, after: $after, first: 15) {\n      items {\n        ...ActivityFields\n      }\n      nextCursor\n    }\n    unreadCount(spaceId: $spaceId)\n  }\n": typeof types.FeedDocument,
    "\n  subscription ActivityAdded($spaceId: ID!) {\n    activityAdded(spaceId: $spaceId) {\n      ...ActivityFields\n    }\n  }\n": typeof types.ActivityAddedDocument,
    "\n  mutation MarkRead($spaceId: ID!, $activityIds: [ID!]!) {\n    markRead(spaceId: $spaceId, activityIds: $activityIds) {\n      unreadCount\n    }\n  }\n": typeof types.MarkReadDocument,
    "\n  mutation MarkAllRead($spaceId: ID!) {\n    markAllRead(spaceId: $spaceId) {\n      unreadCount\n    }\n  }\n": typeof types.MarkAllReadDocument,
    "\n  mutation PostAnnouncement($spaceId: ID!, $message: String!) {\n    postAnnouncement(spaceId: $spaceId, message: $message) {\n      activity {\n        ...ActivityFields\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.PostAnnouncementDocument,
};
const documents: Documents = {
    "\n  query DemoIdentities {\n    demoIdentities {\n      id\n      name\n    }\n  }\n": types.DemoIdentitiesDocument,
    "\n  mutation SignInAsDemo($personId: ID!) {\n    signInAsDemo(personId: $personId) {\n      token\n    }\n  }\n": types.SignInAsDemoDocument,
    "\n  query Viewer {\n    viewer {\n      id\n      name\n      spaces {\n        id\n        name\n        role\n      }\n    }\n  }\n": types.ViewerDocument,
    "\n  fragment ActivityFields on Activity {\n    id\n    kind\n    summary\n    createdAt\n    isRead\n    actor {\n      id\n      name\n    }\n  }\n": types.ActivityFieldsFragmentDoc,
    "\n  query Feed($spaceId: ID!, $kind: ActivityKind, $after: String) {\n    feed(spaceId: $spaceId, kind: $kind, after: $after, first: 15) {\n      items {\n        ...ActivityFields\n      }\n      nextCursor\n    }\n    unreadCount(spaceId: $spaceId)\n  }\n": types.FeedDocument,
    "\n  subscription ActivityAdded($spaceId: ID!) {\n    activityAdded(spaceId: $spaceId) {\n      ...ActivityFields\n    }\n  }\n": types.ActivityAddedDocument,
    "\n  mutation MarkRead($spaceId: ID!, $activityIds: [ID!]!) {\n    markRead(spaceId: $spaceId, activityIds: $activityIds) {\n      unreadCount\n    }\n  }\n": types.MarkReadDocument,
    "\n  mutation MarkAllRead($spaceId: ID!) {\n    markAllRead(spaceId: $spaceId) {\n      unreadCount\n    }\n  }\n": types.MarkAllReadDocument,
    "\n  mutation PostAnnouncement($spaceId: ID!, $message: String!) {\n    postAnnouncement(spaceId: $spaceId, message: $message) {\n      activity {\n        ...ActivityFields\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.PostAnnouncementDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query DemoIdentities {\n    demoIdentities {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  query DemoIdentities {\n    demoIdentities {\n      id\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SignInAsDemo($personId: ID!) {\n    signInAsDemo(personId: $personId) {\n      token\n    }\n  }\n"): (typeof documents)["\n  mutation SignInAsDemo($personId: ID!) {\n    signInAsDemo(personId: $personId) {\n      token\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Viewer {\n    viewer {\n      id\n      name\n      spaces {\n        id\n        name\n        role\n      }\n    }\n  }\n"): (typeof documents)["\n  query Viewer {\n    viewer {\n      id\n      name\n      spaces {\n        id\n        name\n        role\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ActivityFields on Activity {\n    id\n    kind\n    summary\n    createdAt\n    isRead\n    actor {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  fragment ActivityFields on Activity {\n    id\n    kind\n    summary\n    createdAt\n    isRead\n    actor {\n      id\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Feed($spaceId: ID!, $kind: ActivityKind, $after: String) {\n    feed(spaceId: $spaceId, kind: $kind, after: $after, first: 15) {\n      items {\n        ...ActivityFields\n      }\n      nextCursor\n    }\n    unreadCount(spaceId: $spaceId)\n  }\n"): (typeof documents)["\n  query Feed($spaceId: ID!, $kind: ActivityKind, $after: String) {\n    feed(spaceId: $spaceId, kind: $kind, after: $after, first: 15) {\n      items {\n        ...ActivityFields\n      }\n      nextCursor\n    }\n    unreadCount(spaceId: $spaceId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription ActivityAdded($spaceId: ID!) {\n    activityAdded(spaceId: $spaceId) {\n      ...ActivityFields\n    }\n  }\n"): (typeof documents)["\n  subscription ActivityAdded($spaceId: ID!) {\n    activityAdded(spaceId: $spaceId) {\n      ...ActivityFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation MarkRead($spaceId: ID!, $activityIds: [ID!]!) {\n    markRead(spaceId: $spaceId, activityIds: $activityIds) {\n      unreadCount\n    }\n  }\n"): (typeof documents)["\n  mutation MarkRead($spaceId: ID!, $activityIds: [ID!]!) {\n    markRead(spaceId: $spaceId, activityIds: $activityIds) {\n      unreadCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation MarkAllRead($spaceId: ID!) {\n    markAllRead(spaceId: $spaceId) {\n      unreadCount\n    }\n  }\n"): (typeof documents)["\n  mutation MarkAllRead($spaceId: ID!) {\n    markAllRead(spaceId: $spaceId) {\n      unreadCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation PostAnnouncement($spaceId: ID!, $message: String!) {\n    postAnnouncement(spaceId: $spaceId, message: $message) {\n      activity {\n        ...ActivityFields\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation PostAnnouncement($spaceId: ID!, $message: String!) {\n    postAnnouncement(spaceId: $spaceId, message: $message) {\n      activity {\n        ...ActivityFields\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;