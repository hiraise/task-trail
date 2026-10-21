import { defineConfig } from "@hey-api/openapi-ts";

// Типы API из контракта (ADR-0020): `npm run api:types` после каждого изменения api/openapi.yaml.
// API_TYPES_OUT задаёт scripts/dev.sh web: генерирует во временную папку и сверяет с закоммиченными.
export default defineConfig({
  input: "../api/openapi.yaml",
  output: process.env.API_TYPES_OUT ?? "src/infrastructure/api/generated",
  plugins: ["@hey-api/typescript"],
  logs: { file: false },
});
