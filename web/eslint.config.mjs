import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import importPlugin from "eslint-plugin-import";

/**
 * ============================================================================
 * ESLINT CONFIGURATION FOR TASK TRACKER APP (NEXT.JS + DDD ARCHITECTURE)
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
 * - @/presentation    - UI layer (features, pages, components)
 * ============================================================================
 */

// ===== IMPORT PATTERNS FOR ARCHITECTURAL RESTRICTIONS =====

/**
 * Cross-feature import restrictions
 * Features should only import from their own directory or shared modules
 */
const CROSS_FEATURE_IMPORT_RESTRICTIONS = [
  {
    group: [
      "@/presentation/features/**/components/**",
      "@/presentation/features/**/hooks/**",
      "@/presentation/features/**/utils/**",
      "@/presentation/features/**/types/**",
      "@/presentation/features/**/constants/**",
    ],
    message:
      "❌ Cross-feature imports are not allowed. Import only from your own feature or shared modules.",
  },
  {
    group: ["../../../**", "../../../../**", "../../../../../**"],
    message:
      "❌ Avoid deep relative imports. Use absolute imports with @ alias for cross-layer dependencies.",
  },
];

/**
 * Absolute imports forbidden within domain layer
 * Use relative paths within the layer
 */
const DOMAIN_LAYER_RESTRICTIONS = [
  {
    group: ["@/domain/**"],
    message: "❌ Use relative imports within the domain layer.",
  },
];

/**
 * Absolute imports forbidden within infrastructure layer
 */
const INFRASTRUCTURE_LAYER_RESTRICTIONS = [
  {
    group: ["@/infrastructure/**"],
    message: "❌ Use relative imports within the infrastructure layer.",
  },
];

/**
 * Domain layer restrictions
 * Domain must not depend on outer layers
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

export default [
  // ===== IGNORED FILES AND DIRECTORIES =====
  {
    ignores: [
      // Next.js build outputs
      ".next/**",
      "out/**",
      "build/**",

      // Type definitions
      "next-env.d.ts",

      // Dependencies
      "node_modules/**",

      // Configuration files (self-linting exclusion)
      "eslint.config.mjs",
      "*.config.js",
      "*.config.mjs",
      "*.config.ts",

      // Environment files
      ".env*",

      // Coverage reports
      "coverage/**",
    ],
  },

  // ===== BASE NEXT.JS CONFIGURATIONS =====
  ...nextVitals,
  ...nextTs,

  // ===== BASE RULES FOR ALL TS/JS FILES =====
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      // ======================================================================
      // IMPORT RULES
      // ======================================================================

      // Allow deep paths for DDD architecture
      "import/no-internal-modules": "off",

      // Strict import order
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          pathGroups: [
            { pattern: "@/**", group: "internal", position: "before" },
            { pattern: "react", group: "external", position: "before" },
            { pattern: "next/**", group: "external", position: "after" },
          ],
          alphabetize: { order: "asc", caseInsensitive: true },
          "newlines-between": "always",
          warnOnUnassignedImports: true,
        },
      ],

      // Forbid duplicate imports
      "import/no-duplicates": "error",

      // Forbid circular dependencies (increased to 3 for flexibility)
      "import/no-cycle": ["error", { maxDepth: 3 }],

      // Forbid default exports (by default)
      "import/no-default-export": "error",

      // Allow relative paths to packages (for monorepos)
      "import/no-relative-packages": "off",

      // Architectural import restrictions
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...CROSS_FEATURE_IMPORT_RESTRICTIONS,
            ...DOMAIN_LAYER_RESTRICTIONS,
            ...INFRASTRUCTURE_LAYER_RESTRICTIONS,
          ],
        },
      ],

      // ======================================================================
      // TYPESCRIPT RULES
      // ======================================================================

      // Enforce type imports usage
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "separate-type-imports",
        },
      ],

      // Warning about unused variables (ignore _ prefixes)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],

      // Warning about using any
      "@typescript-eslint/no-explicit-any": [
        "warn",
        {
          ignoreRestArgs: true,
          fixToUnknown: true,
        },
      ],

      // Forbid unnecessary type suffixes
      "@typescript-eslint/no-redundant-type-constituents": "warn",

      // Prefer interfaces over types
      "@typescript-eslint/consistent-type-definitions": ["warn", "interface"],

      // ======================================================================
      // REACT RULES
      // ======================================================================

      // Required key for list elements
      "react/jsx-key": "error",

      // Disabled for new JSX runtime
      "react/react-in-jsx-scope": "off",

      // Standardize component definitions
      "react/function-component-definition": [
        "error",
        {
          namedComponents: "function-declaration",
          unnamedComponents: "arrow-function",
        },
      ],

      // Hooks rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Forbid dangerous properties
      "react/no-danger": "warn",

      // Prefer functional components
      "react/prefer-stateless-function": "warn",

      // ======================================================================
      // GENERAL BEST PRACTICES
      // ======================================================================

      // Function complexity
      complexity: ["warn", { max: 10 }],

      // Callback nesting
      "max-nested-callbacks": ["warn", { max: 3 }],

      // Quote style
      quotes: ["error", "double", { allowTemplateLiterals: true }],

      // Semicolons
      semi: ["error", "always"],

      // Prefer const
      "prefer-const": "error",

      // Forbid var
      "no-var": "error",

      // Console in production
      "no-console": process.env.NODE_ENV === "production" ? "error" : "warn",

      // Forbid useless constructors
      "no-useless-constructor": "error",

      // Forbid synchronous methods
      "no-sync": "warn",

      // Padding between blocks
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
  // PRESENTATION LAYER - NEXT.JS PAGES (APP ROUTER)
  // ========================================================================
  {
    files: ["**/app/**"],
    rules: {
      // Next.js requires default exports for pages and layouts
      "import/no-default-export": "off",

      // Allow imports from all layers (via absolute paths)
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../../../**", "../../../../**", "../../../../../**"],
              message: "❌ Avoid deep relative imports. Use absolute imports with @ alias.",
            },
          ],
        },
      ],
    },
  },

  // ========================================================================
  // PRESENTATION LAYER - LEGACY ROUTER (PAGES)
  // ========================================================================
  {
    files: ["**/pages/**"],
    rules: {
      // Next.js требует дефолтные экспорты для страниц
      "import/no-default-export": "off",
    },
  },

  // ========================================================================
  // TYPE FILES
  // ========================================================================
  {
    files: ["**/*.d.ts"],
    rules: {
      // Type files often use default exports for augmentation
      "import/no-default-export": "off",
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
      "next.config.{ts,js}",
      "jest.config.{ts,js}",
      "tailwind.config.{ts,js}",
      "postcss.config.{ts,js}",
    ],
    rules: {
      // Configs often use default exports
      "import/no-default-export": "off",

      // Allow absolute imports for configs
      "no-restricted-imports": "off",
    },
  },

  // ========================================================================
  // TEST FILES
  // ========================================================================
  {
    files: ["**/*.{test,spec}.{ts,tsx,js,jsx}", "**/__tests__/**/*.{ts,tsx,js,jsx}"],
    rules: {
      // Tests can use default exports
      "import/no-default-export": "off",

      // Allow console in tests
      "no-console": "off",

      // Reduce strictness for tests
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",

      // Allow deep relative imports in tests
      "no-restricted-imports": "off",
    },
  },

  // ========================================================================
  // APPLICATION LAYER (USE CASES, INTERACTORS)
  // ========================================================================
  {
    files: ["**/application/**"],
    rules: {
      // Application can import from domain and infrastructure
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            // Forbid cross-feature imports (if features exist in application)
            ...CROSS_FEATURE_IMPORT_RESTRICTIONS,

            // Forbid imports from presentation
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
    files: ["**/infrastructure/**"],
    rules: {
      // Infrastructure can import from domain, but not from presentation
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...CROSS_FEATURE_IMPORT_RESTRICTIONS,
            ...INFRASTRUCTURE_LAYER_RESTRICTIONS,

            // Forbid imports from presentation
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
  // DI CONTAINER (SPECIAL EXCEPTION)
  // ========================================================================
  {
    files: ["**/infrastructure/di/**", "**/infrastructure/container/**"],
    rules: {
      // DI container needs access to all infrastructure modules
      "no-restricted-imports": "off",

      // Allow default exports for containers
      "import/no-default-export": "off",
    },
  },

  // ========================================================================
  // DOMAIN LAYER (ISOLATED BUSINESS LOGIC)
  // ========================================================================
  {
    files: ["**/domain/**"],
    rules: {
      // Domain is fully isolated
      "no-restricted-imports": [
        "error",
        {
          patterns: [...DOMAIN_LAYER_RESTRICTIONS, ...DOMAIN_ISOLATION_RESTRICTIONS],
        },
      ],

      // Additional rules for domain
      "@typescript-eslint/no-explicit-any": "error", // Stricter in domain
      complexity: ["warn", { max: 8 }], // Lower complexity
    },
  },

  // ========================================================================
  // PRESENTATION LAYER FEATURES
  // ========================================================================
  {
    files: ["**/presentation/features/**"],
    rules: {
      // Allow default exports for components inside features
      "import/no-default-export": "off",

      // Control imports within features
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            // Forbid imports from other features via absolute paths
            {
              group: ["@/presentation/features/**"],
              message:
                "❌ Import only from your own feature directory. Use relative paths for intra-feature imports.",
            },
            // Forbid deep relative paths
            {
              group: ["../../../**", "../../../../**"],
              message: "❌ Use absolute imports (@) for cross-feature or cross-layer dependencies.",
            },
          ],
        },
      ],
    },
  },

  // ========================================================================
  // MODALS
  // ========================================================================
  {
    files: ["**/presentation/modals/**"],
    rules: {
      // Modals often use default exports
      "import/no-default-export": "off",

      // Import control
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../../../**", "../../../../**", "../../../../../**"],
              message: "❌ Avoid deep relative imports. Use absolute imports with @ alias.",
            },
          ],
        },
      ],
    },
  },

  // ========================================================================
  // COMPONENTS (ALLOW DEFAULT EXPORTS)
  // ========================================================================
  {
    files: [
      "**/components/**/*.{tsx,jsx}",
      "**/ui/**/*.{tsx,jsx}",
      "**/*Modal.{tsx,jsx}",
      "**/*Page.{tsx,jsx}",
      "**/*Item.{tsx,jsx}",
      "**/*Desktop.{tsx,jsx}",
      "**/*Mobile.{tsx,jsx}",
      "**/*Widget.{tsx,jsx}",
      "**/*Card.{tsx,jsx}",
    ],
    rules: {
      // React components traditionally use default exports
      "import/no-default-export": "off",
    },
  },

  // ========================================================================
  // SHARED HOOKS
  // ========================================================================
  {
    files: ["**/shared/hooks/**", "**/presentation/shared/hooks/**"],
    rules: {
      // Import control
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../../../**", "../../../../**"],
              message: "❌ Avoid deep relative imports. Use absolute imports with @ alias.",
            },
          ],
        },
      ],
    },
  },

  // ========================================================================
  // SHARED PRESENTATION MODULES
  // ========================================================================
  {
    files: ["**/presentation/shared/**"],
    rules: {
      // Special restrictions for shared modules
      "no-restricted-imports": [
        "error",
        {
          patterns: SHARED_PRESENTATION_RESTRICTIONS,
        },
      ],
    },
  },

  // ========================================================================
  // UTILS AND HELPER MODULES
  // ========================================================================
  {
    files: ["**/utils/**", "**/lib/**", "**/helpers/**"],
    rules: {
      // Allow default exports for utils
      "import/no-default-export": "off",

      // Prefer pure functions
      "func-style": ["warn", "declaration", { allowArrowFunctions: true }],
    },
  },

  // ========================================================================
  // Prettier - MUST BE LAST!
  // ========================================================================
  prettier,
];
