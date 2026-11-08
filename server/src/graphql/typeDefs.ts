export const typeDefs = /* GraphQL */ `
  enum ActivityKind {
    BOOKING
    ANNOUNCEMENT
    EQUIPMENT
    MEMBERSHIP
  }

  enum Role {
    OWNER
    STAFF
    MEMBER
  }

  type Person {
    id: ID!
    name: String!
  }

  type Space {
    id: ID!
    name: String!
    role: Role!
  }

  type Viewer {
    id: ID!
    name: String!
    spaces: [Space!]!
  }

  type Activity {
    id: ID!
    kind: ActivityKind!
    summary: String!
    "ISO 8601 timestamp in UTC"
    createdAt: String!
    actor: Person!
    "Own activity always counts as read."
    isRead: Boolean!
  }

  type ActivityPage {
    items: [Activity!]!
    "Pass as 'after' to load older items. Null when there are none."
    nextCursor: String
  }

  type UserError {
    field: String
    message: String!
  }

  type SignInPayload {
    token: String!
    viewer: Viewer!
  }

  type ReadStatePayload {
    unreadCount: Int!
  }

  type PostAnnouncementPayload {
    activity: Activity
    errors: [UserError!]!
  }

  type Query {
    "Demo mode: the people a visitor can act as."
    demoIdentities: [Person!]!
    viewer: Viewer
    "Newest first. 'first' is capped at 50."
    feed(spaceId: ID!, kind: ActivityKind, after: String, first: Int = 20): ActivityPage!
    unreadCount(spaceId: ID!): Int!
  }

  type Mutation {
    signInAsDemo(personId: ID!): SignInPayload!
    markRead(spaceId: ID!, activityIds: [ID!]!): ReadStatePayload!
    markAllRead(spaceId: ID!): ReadStatePayload!
    "Owners and staff only."
    postAnnouncement(spaceId: ID!, message: String!): PostAnnouncementPayload!
  }

  type Subscription {
    "Pushes each new activity in a space the viewer belongs to."
    activityAdded(spaceId: ID!): Activity!
  }
`;
