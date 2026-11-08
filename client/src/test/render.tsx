import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing";
import { SessionProvider } from "../lib/session";

export function renderWithApollo(ui: ReactElement, mocks: MockedResponse[] = []) {
  return render(
    <SessionProvider>
      <MockedProvider mocks={mocks}>{ui}</MockedProvider>
    </SessionProvider>,
  );
}

export const activity = (id: string, overrides: Record<string, unknown> = {}) => ({
  __typename: "Activity" as const,
  id,
  kind: "BOOKING" as const,
  summary: `Booked item ${id}`,
  createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
  isRead: false,
  actor: { __typename: "Person" as const, id: "ben", name: "Ben Lindqvist" },
  ...overrides,
});
