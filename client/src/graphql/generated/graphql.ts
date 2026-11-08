/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Activity = {
  __typename?: 'Activity';
  actor: Person;
  /** ISO 8601 timestamp in UTC */
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /** Own activity always counts as read. */
  isRead: Scalars['Boolean']['output'];
  kind: ActivityKind;
  summary: Scalars['String']['output'];
};

export type ActivityKind =
  | 'ANNOUNCEMENT'
  | 'BOOKING'
  | 'EQUIPMENT'
  | 'MEMBERSHIP';

export type ActivityPage = {
  __typename?: 'ActivityPage';
  items: Array<Activity>;
  /** Pass as 'after' to load older items. Null when there are none. */
  nextCursor?: Maybe<Scalars['String']['output']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  markAllRead: ReadStatePayload;
  markRead: ReadStatePayload;
  /** Owners and staff only. */
  postAnnouncement: PostAnnouncementPayload;
  signInAsDemo: SignInPayload;
};


export type MutationMarkAllReadArgs = {
  spaceId: Scalars['ID']['input'];
};


export type MutationMarkReadArgs = {
  activityIds: Array<Scalars['ID']['input']>;
  spaceId: Scalars['ID']['input'];
};


export type MutationPostAnnouncementArgs = {
  message: Scalars['String']['input'];
  spaceId: Scalars['ID']['input'];
};


export type MutationSignInAsDemoArgs = {
  personId: Scalars['ID']['input'];
};

export type Person = {
  __typename?: 'Person';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type PostAnnouncementPayload = {
  __typename?: 'PostAnnouncementPayload';
  activity?: Maybe<Activity>;
  errors: Array<UserError>;
};

export type Query = {
  __typename?: 'Query';
  /** Demo mode: the people a visitor can act as. */
  demoIdentities: Array<Person>;
  /** Newest first. 'first' is capped at 50. */
  feed: ActivityPage;
  unreadCount: Scalars['Int']['output'];
  viewer?: Maybe<Viewer>;
};


export type QueryFeedArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  kind?: InputMaybe<ActivityKind>;
  spaceId: Scalars['ID']['input'];
};


export type QueryUnreadCountArgs = {
  spaceId: Scalars['ID']['input'];
};

export type ReadStatePayload = {
  __typename?: 'ReadStatePayload';
  unreadCount: Scalars['Int']['output'];
};

export type Role =
  | 'MEMBER'
  | 'OWNER'
  | 'STAFF';

export type SignInPayload = {
  __typename?: 'SignInPayload';
  token: Scalars['String']['output'];
  viewer: Viewer;
};

export type Space = {
  __typename?: 'Space';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  role: Role;
};

export type Subscription = {
  __typename?: 'Subscription';
  /** Pushes each new activity in a space the viewer belongs to. */
  activityAdded: Activity;
};


export type SubscriptionActivityAddedArgs = {
  spaceId: Scalars['ID']['input'];
};

export type UserError = {
  __typename?: 'UserError';
  field?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
};

export type Viewer = {
  __typename?: 'Viewer';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  spaces: Array<Space>;
};

export type DemoIdentitiesQueryVariables = Exact<{ [key: string]: never; }>;


export type DemoIdentitiesQuery = { __typename?: 'Query', demoIdentities: Array<{ __typename?: 'Person', id: string, name: string }> };

export type SignInAsDemoMutationVariables = Exact<{
  personId: Scalars['ID']['input'];
}>;


export type SignInAsDemoMutation = { __typename?: 'Mutation', signInAsDemo: { __typename?: 'SignInPayload', token: string } };

export type ViewerQueryVariables = Exact<{ [key: string]: never; }>;


export type ViewerQuery = { __typename?: 'Query', viewer?: { __typename?: 'Viewer', id: string, name: string, spaces: Array<{ __typename?: 'Space', id: string, name: string, role: Role }> } | null };

export type ActivityFieldsFragment = { __typename?: 'Activity', id: string, kind: ActivityKind, summary: string, createdAt: string, isRead: boolean, actor: { __typename?: 'Person', id: string, name: string } };

export type FeedQueryVariables = Exact<{
  spaceId: Scalars['ID']['input'];
  kind?: InputMaybe<ActivityKind>;
  after?: InputMaybe<Scalars['String']['input']>;
}>;


export type FeedQuery = { __typename?: 'Query', unreadCount: number, feed: { __typename?: 'ActivityPage', nextCursor?: string | null, items: Array<{ __typename?: 'Activity', id: string, kind: ActivityKind, summary: string, createdAt: string, isRead: boolean, actor: { __typename?: 'Person', id: string, name: string } }> } };

export type ActivityAddedSubscriptionVariables = Exact<{
  spaceId: Scalars['ID']['input'];
}>;


export type ActivityAddedSubscription = { __typename?: 'Subscription', activityAdded: { __typename?: 'Activity', id: string, kind: ActivityKind, summary: string, createdAt: string, isRead: boolean, actor: { __typename?: 'Person', id: string, name: string } } };

export type MarkReadMutationVariables = Exact<{
  spaceId: Scalars['ID']['input'];
  activityIds: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type MarkReadMutation = { __typename?: 'Mutation', markRead: { __typename?: 'ReadStatePayload', unreadCount: number } };

export type MarkAllReadMutationVariables = Exact<{
  spaceId: Scalars['ID']['input'];
}>;


export type MarkAllReadMutation = { __typename?: 'Mutation', markAllRead: { __typename?: 'ReadStatePayload', unreadCount: number } };

export type PostAnnouncementMutationVariables = Exact<{
  spaceId: Scalars['ID']['input'];
  message: Scalars['String']['input'];
}>;


export type PostAnnouncementMutation = { __typename?: 'Mutation', postAnnouncement: { __typename?: 'PostAnnouncementPayload', activity?: { __typename?: 'Activity', id: string, kind: ActivityKind, summary: string, createdAt: string, isRead: boolean, actor: { __typename?: 'Person', id: string, name: string } } | null, errors: Array<{ __typename?: 'UserError', field?: string | null, message: string }> } };

export const ActivityFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ActivityFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Activity"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"isRead"}},{"kind":"Field","name":{"kind":"Name","value":"actor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ActivityFieldsFragment, unknown>;
export const DemoIdentitiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DemoIdentities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"demoIdentities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<DemoIdentitiesQuery, DemoIdentitiesQueryVariables>;
export const SignInAsDemoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SignInAsDemo"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"personId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"signInAsDemo"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"personId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"personId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}}]}}]}}]} as unknown as DocumentNode<SignInAsDemoMutation, SignInAsDemoMutationVariables>;
export const ViewerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Viewer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"viewer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"spaces"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]}}]} as unknown as DocumentNode<ViewerQuery, ViewerQueryVariables>;
export const FeedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Feed"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"spaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"kind"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ActivityKind"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"feed"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"spaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"spaceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"kind"},"value":{"kind":"Variable","name":{"kind":"Name","value":"kind"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"15"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}}]}},{"kind":"Field","name":{"kind":"Name","value":"unreadCount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"spaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"spaceId"}}}]}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ActivityFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Activity"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"isRead"}},{"kind":"Field","name":{"kind":"Name","value":"actor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<FeedQuery, FeedQueryVariables>;
export const ActivityAddedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"ActivityAdded"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"spaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activityAdded"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"spaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"spaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ActivityFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Activity"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"isRead"}},{"kind":"Field","name":{"kind":"Name","value":"actor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ActivityAddedSubscription, ActivityAddedSubscriptionVariables>;
export const MarkReadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkRead"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"spaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"activityIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markRead"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"spaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"spaceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"activityIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"activityIds"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unreadCount"}}]}}]}}]} as unknown as DocumentNode<MarkReadMutation, MarkReadMutationVariables>;
export const MarkAllReadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkAllRead"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"spaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markAllRead"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"spaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"spaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unreadCount"}}]}}]}}]} as unknown as DocumentNode<MarkAllReadMutation, MarkAllReadMutationVariables>;
export const PostAnnouncementDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PostAnnouncement"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"spaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"message"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"postAnnouncement"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"spaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"spaceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"message"},"value":{"kind":"Variable","name":{"kind":"Name","value":"message"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ActivityFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Activity"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"isRead"}},{"kind":"Field","name":{"kind":"Name","value":"actor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<PostAnnouncementMutation, PostAnnouncementMutationVariables>;