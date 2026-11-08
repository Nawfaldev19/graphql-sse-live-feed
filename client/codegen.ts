import type { CodegenConfig } from "@graphql-codegen/cli";

// Generates typed documents from the server's schema dump (`npm run schema` in server/).
const config: CodegenConfig = {
  schema: "../server/schema.graphql",
  documents: ["src/**/*.{ts,tsx}", "!src/graphql/generated/**"],
  generates: {
    "src/graphql/generated/": {
      preset: "client",
      config: { enumsAsTypes: true, useTypeImports: true },
      presetConfig: { fragmentMasking: false },
    },
  },
};

export default config;
