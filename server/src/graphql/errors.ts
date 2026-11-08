// createGraphQLError builds the error with the same graphql-js instance Yoga
// uses, so these coded errors pass through masking instead of becoming
// "Unexpected error." (avoids the dual ESM/CommonJS package hazard).
import { createGraphQLError } from "graphql-yoga";

const coded = (message: string, code: string) => createGraphQLError(message, { extensions: { code } });

export const unauthenticated = () => coded("Choose a demo identity to continue", "UNAUTHENTICATED");
export const forbidden = () => coded("Your role in this space does not allow that", "FORBIDDEN");
/** Used for spaces the viewer is not in, so the response does not confirm that the space exists. */
export const notFound = () => coded("Not found", "NOT_FOUND");
export const badInput = (message: string) => coded(message, "BAD_USER_INPUT");
/** Ends a live stream whose token has run out; the client treats it like any other sign-out. */
export const sessionExpired = () => coded("Your session has expired. Choose an identity again.", "UNAUTHENTICATED");
/** Ends a live stream after the viewer leaves the space. They knew the space, so FORBIDDEN hides nothing. */
export const membershipEnded = () => coded("You are no longer a member of this space", "FORBIDDEN");
