import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MockedResponse } from "@apollo/client/testing";
import { App } from "../App";
import { DEMO_IDENTITIES, SIGN_IN_AS_DEMO, VIEWER } from "../graphql/operations";
import { renderWithApollo } from "../test/render";

const identities: MockedResponse = {
  request: { query: DEMO_IDENTITIES },
  result: { data: { demoIdentities: [{ __typename: "Person", id: "cora", name: "Cora Mbeki" }] } },
};

describe("Welcome and sign-in", () => {
  it("explains the demo and lists identities", async () => {
    renderWithApollo(<App />, [identities]);
    expect(screen.getByRole("heading", { level: 1, name: /as it happens/ })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "What this demo shows" }).children).toHaveLength(4);
    expect(await screen.findByRole("button", { name: "Continue as Cora Mbeki" })).toBeEnabled();
  });

  it("signs in and switches to the workspace", async () => {
    const user = userEvent.setup();
    renderWithApollo(<App />, [
      identities,
      {
        request: { query: SIGN_IN_AS_DEMO, variables: { personId: "cora" } },
        result: { data: { signInAsDemo: { __typename: "SignInPayload", token: "tok" } } },
      },
      { request: { query: VIEWER }, result: { data: { viewer: null } }, delay: 60_000 },
    ]);

    await user.click(await screen.findByRole("button", { name: "Continue as Cora Mbeki" }));

    expect(await screen.findByRole("button", { name: "Switch person" })).toBeInTheDocument();
    expect(window.localStorage.getItem("live-feed.token")).toBe("tok");
  });

  it("explains when the server cannot be reached", async () => {
    renderWithApollo(<App />, [{ request: { query: DEMO_IDENTITIES }, error: new Error("down") }]);
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not reach the server");
  });
});
