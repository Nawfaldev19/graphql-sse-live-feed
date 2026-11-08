import { graphql } from "./generated";

export const DEMO_IDENTITIES = graphql(`
  query DemoIdentities {
    demoIdentities {
      id
      name
    }
  }
`);

export const SIGN_IN_AS_DEMO = graphql(`
  mutation SignInAsDemo($personId: ID!) {
    signInAsDemo(personId: $personId) {
      token
    }
  }
`);

export const VIEWER = graphql(`
  query Viewer {
    viewer {
      id
      name
      spaces {
        id
        name
        role
      }
    }
  }
`);

export const ACTIVITY_FIELDS = graphql(`
  fragment ActivityFields on Activity {
    id
    kind
    summary
    createdAt
    isRead
    actor {
      id
      name
    }
  }
`);

export const FEED = graphql(`
  query Feed($spaceId: ID!, $kind: ActivityKind, $after: String) {
    feed(spaceId: $spaceId, kind: $kind, after: $after, first: 15) {
      items {
        ...ActivityFields
      }
      nextCursor
    }
    unreadCount(spaceId: $spaceId)
  }
`);

export const ACTIVITY_ADDED = graphql(`
  subscription ActivityAdded($spaceId: ID!) {
    activityAdded(spaceId: $spaceId) {
      ...ActivityFields
    }
  }
`);

export const MARK_READ = graphql(`
  mutation MarkRead($spaceId: ID!, $activityIds: [ID!]!) {
    markRead(spaceId: $spaceId, activityIds: $activityIds) {
      unreadCount
    }
  }
`);

export const MARK_ALL_READ = graphql(`
  mutation MarkAllRead($spaceId: ID!) {
    markAllRead(spaceId: $spaceId) {
      unreadCount
    }
  }
`);

export const POST_ANNOUNCEMENT = graphql(`
  mutation PostAnnouncement($spaceId: ID!, $message: String!) {
    postAnnouncement(spaceId: $spaceId, message: $message) {
      activity {
        ...ActivityFields
      }
      errors {
        field
        message
      }
    }
  }
`);
