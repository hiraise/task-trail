import js from "@eslint/js";
import prettier from "eslint-config-prettier/flat";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

/**
 * ============================================================================
 * ESLINT CONFIGURATION FOR TASK TRACKER APP (VITE + REACT + DDD ARCHITECTURE)
 * ============================================================================
 *
 * Architectural principles:
 * - Clean Architecture with layer isolation
 * - Cross-feature imports forbidden in presentation layer
 * - Relative imports within layers (domain, infrastructure)
 * - Absolute imports (@) for cross-layer dependencies
 *
 * Application layers:
 * - @/domain          - business logic (isolated)
 * - @/application     - use cases, interactors
 * - @/infrastructure  - external dependencies, adapters
 * - @/presentation    - UI layer (features, routes, components)
 * ============================================================================
 */

// ===== IMPORT PATTERNS FOR ARCHITECTURAL RESTRICTIONS =====

/**
 * Domain layer must not depend on outer layers
 */
const DOMAIN_ISOLATION_RESTRICTIONS = [
  {
    group: ["@/application/**", "@/infrastructure/**", "@/presentation/**"],
    message:
      "❌ Domain layer should not import from application, infrastructure, or presentation layers. Domain must remain pure and framework-agnostic.",
  },
];

/**
 * Shared presentation modules restrictions
 */
const SHARED_PRESENTATION_RESTRICTIONS = [
  {
    group: ["@/presentation/shared", "@/presentation/shared/**"],
    message: "❌ Use relative imports for modules within the shared presentation layer.",
  },
  {
    group: ["../../../../../**"],
    message: "❌ Path is too deep. Restructure your shared modules.",
  },
];

export default defineConfig([
  // ========================================================================
  // IGNORED FILES AND DIRECTORIES
  // ========================================================================
  globalIgnores([
    // Vite build outputs
    "dist/**",
    "build/**",

    // TanStack Router auto-generated route tree
    "src/routeTree.gen.ts",

    // API types generated from api/openapi.yaml (ADR-0020)
    "src/infrastructure/api/generated/**",

    // Dependencies
    "node_modules/**",

    // Configuration files (self-linting exclusion)
    "eslint.config.js",
    "eslint.config.mjs",
    "vite.config.{ts,js}",
    "vitest.config.{ts,js}",
    "*.config.js",
    "*.config.mjs",
    "*.config.ts",

    // Environment files
    ".env*",

    // Coverage reports
    "coverage/**",
  ]),

  // ========================================================================
  // BASE RULES FOR ALL TS/JS FILES
  // ========================================================================
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      // Architectural import restrictions (applied globally)
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["next", "next/*"],
              message: "❌ This is a Vite project. Imports from next/* are forbidden.",
            },
            {
              group: ["../../../**", "../../../../**", "../../../../../**"],
              message: "❌ Avoid deep relative imports. Use absolute imports with @ alias.",
            },
          ],
        },
      ],

      // ======================================================================
      // TYPESCRIPT RULES
      // ======================================================================

      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "separate-type-imports",
        },
      ],

      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],

      "@typescript-eslint/no-explicit-any": ["warn", { ignoreRestArgs: true, fixToUnknown: true }],

      "@typescript-eslint/consistent-type-definitions": ["warn", "interface"],

      // react-hooks rules come from reactHooks.configs.flat.recommended
      "react-hooks/exhaustive-deps": "warn",

      // ======================================================================
      // REACT REFRESH (VITE HMR)
      // ======================================================================

      // Files should mostly export components for HMR to work properly.
      // allowConstantExport lets you export const values alongside.
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      // ======================================================================
      // GENERAL BEST PRACTICES
      // ======================================================================

      complexity: ["warn", { max: 10 }],
      "max-nested-callbacks": ["warn", { max: 3 }],
      quotes: ["error", "double", { allowTemplateLiterals: true }],
      semi: ["error", "always"],
      "prefer-const": "error",
      "no-var": "error",
      "no-console": process.env.NODE_ENV === "production" ? "error" : "warn",
      "no-useless-constructor": "error",
      "no-sync": "warn",

      "padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: "import", next: "*" },
        { blankLine: "any", prev: "import", next: "import" },
        { blankLine: "always", prev: ["const", "let", "var"], next: "*" },
        { blankLine: "any", prev: ["const", "let", "var"], next: ["const", "let", "var"] },
        { blankLine: "always", prev: "*", next: "return" },
      ],
    },
  },

  // ========================================================================
  // TANSTACK ROUTER ROUTE FILES
  // ========================================================================
  {
    files: ["**/routes/**"],
    rules: {
      // TanStack Router file-based routes export `Route` (route definition)
      // alongside the component. Allow this for react-refresh.
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true, allowExportNames: ["Route"] },
      ],

      // Routes are entry points — they can import from all layers.
      // Reset restrictions for maximum flexibility.
      "no-restricted-imports": "off",
    },
  },

  // ========================================================================
  // CONFIGURATION FILES
  // ========================================================================
  {
    files: [
      "**/config/**/*.{ts,js}",
      "**/*Config.{ts,js}",
      "**/*Client.{ts,js}",
      "vite.config.{ts,js}",
      "vitest.config.{ts,js}",
      "playwright.config.{ts,js}",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },

  // ========================================================================
  // TEST FILES
  // ========================================================================
  {
    files: ["**/*.{test,spec}.{ts,tsx,js,jsx}", "**/__tests__/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-restricted-imports": "off",
    },
  },

  // ========================================================================
  // APPLICATION LAYER (USE CASES, INTERACTORS)
  // ========================================================================
  {
    files: ["src/application/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/presentation/**"],
              message: "❌ Application layer should not import from presentation layer.",
            },
          ],
        },
      ],
    },
  },

  // ========================================================================
  // INFRASTRUCTURE LAYER (ADAPTERS, EXTERNAL DEPENDENCIES)
  // ========================================================================
  {
    files: ["src/infrastructure/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/infrastructure/**"],
              message: "❌ Use relative imports within the infrastructure layer.",
            },
            {
              group: ["@/presentation/**"],
              message: "❌ Infrastructure layer should not import from presentation layer.",
            },
          ],
        },
      ],
    },
  },

  // ========================================================================
  // DOMAIN LAYER (ISOLATED BUSINESS LOGIC)
  // ========================================================================
  {
    files: ["src/domain/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/domain/**"],
              message: "❌ Use relative imports within the domain layer.",
            },
            ...DOMAIN_ISOLATION_RESTRICTIONS,
          ],
        },
      ],

      // Stricter rules for domain layer
      "@typescript-eslint/no-explicit-any": "error",
      complexity: ["warn", { max: 8 }],
    },
  },

  // ========================================================================
  // PRESENTATION LAYER FEATURES (PREVENT CROSS-FEATURE IMPORTS)
  // ========================================================================
  {
    files: ["src/presentation/features/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/presentation/features/**"],
              message:
                "❌ Cross-feature imports forbidden. Use relative paths within your feature or import from shared.",
            },
          ],
        },
      ],
    },
  },

  // ========================================================================
  // Prettier - MUST BE LAST!
  // ========================================================================
  prettier,
]);
