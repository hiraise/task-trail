import { defineConfig } from "@hey-api/openapi-ts";

// API types from the contract (ADR-0020): `npm run api:types` after each change to api/openapi.yaml.
// API_TYPES_OUT is set by scripts/dev.sh web: it generates into a temp folder and compares with the committed ones.
export default defineConfig({
  input: "../api/openapi.yaml",
  output: process.env.API_TYPES_OUT ?? "src/infrastructure/api/generated",
  plugins: ["@hey-api/typescript"],
  logs: { file: false },
});
