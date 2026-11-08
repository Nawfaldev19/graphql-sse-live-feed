import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
  Observable,
  split,
  type FetchResult,
  type Operation,
} from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";
import { onError } from "@apollo/client/link/error";
import { Kind, OperationTypeNode, print } from "graphql";
import { createClient, type Client } from "graphql-sse";
import { appendPage, type HasId } from "./feedCache";

export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:4000/graphql";

/** Sends subscriptions over Server-Sent Events (graphql-sse protocol). */
class SSELink extends ApolloLink {
  constructor(private readonly client: Client) {
    super();
  }

  override request(operation: Operation): Observable<FetchResult> {
    return new Observable((sink) =>
      this.client.subscribe(
        { ...operation, query: print(operation.query) },
        {
          // graphql-sse yields standard GraphQL execution results, which is what Apollo's FetchResult describes.
          next: (value) => sink.next(value as FetchResult),
          complete: () => sink.complete(),
          error: (error: unknown) => sink.error(error),
        },
      ),
    );
  }
}

interface ClientOptions {
  getToken: () => string | null;
  onUnauthenticated: () => void;
}

export function createApolloClient({ getToken, onUnauthenticated }: ClientOptions) {
  const authHeaders = (): Record<string, string> => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const sse = new SSELink(createClient({ url: API_URL, headers: authHeaders, retryAttempts: Infinity }));
  const http = new HttpLink({ uri: API_URL });
  const withAuth = new ApolloLink((operation, forward) => {
    operation.setContext(({ headers = {} }: { headers?: Record<string, string> }) => ({
      headers: { ...headers, ...authHeaders() },
    }));
    return forward(operation);
  });

  // UNAUTHENTICATED can arrive on any result, including the last payload of a live stream whose token ran out,
  // so the check sits in front of both links. The 3.x typings flag `response` as deprecated; it stays until 4.x.
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const authErrors = onError(({ response }) => {
    if (response?.errors?.some((error) => error.extensions?.code === "UNAUTHENTICATED")) onUnauthenticated();
  });

  const isSubscription = ({ query }: Operation) => {
    const definition = getMainDefinition(query);
    return definition.kind === Kind.OPERATION_DEFINITION && definition.operation === OperationTypeNode.SUBSCRIPTION;
  };

  return new ApolloClient({
    link: ApolloLink.from([authErrors, split(isSubscription, sse, ApolloLink.from([withAuth, http]))]),
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            feed: {
              keyArgs: ["spaceId", "kind"],
              merge(existing: { items: HasId[] } | undefined, incoming: { items: HasId[] }, { args }) {
                if (!existing || !args?.after) return incoming;
                return { ...incoming, items: appendPage(existing.items, incoming.items) };
              },
            },
          },
        },
      },
    }),
  });
}
