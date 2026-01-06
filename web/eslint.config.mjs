import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import importPlugin from "eslint-plugin-import";

// ===== CONSTANTS FOR REUSABLE PATTERNS =====
const CROSS_FEATURE_IMPORT_RESTRICTIONS = [
  {
    group: [
      "@/presentation/features/*/components",
      "@/presentation/features/*/components/*",
      "@/presentation/features/*/hooks",
      "@/presentation/features/*/hooks/*",
      "@/presentation/features/*/utils",
      "@/presentation/features/*/utils/*",
      "@/presentation/features/*/types",
      "@/presentation/features/*/types/*",
      "@/presentation/features/*/constants",
      "@/presentation/features/*/constants/*",
    ],
    message:
      "Cross-feature imports are not allowed. Import only from your own feature or shared modules.",
  },
  {
    group: ["../../../*", "../../../../*", "../../../../../*"],
    message:
      "Avoid deep relative imports. Use absolute imports with @ alias for cross-layer dependencies.",
  },
];

const DOMAIN_LAYER_RESTRICTIONS = [
  {
    group: ["@/domain/*"],
    message: "Use relative imports within the domain layer.",
  },
];

const INFRASTRUCTURE_LAYER_RESTRICTIONS = [
  {
    group: ["@/infrastructure/*"],
    message: "Use relative imports within the infrastructure layer.",
  },
];

export default [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "node_modules/**",
      "eslint.config.mjs", // Exclude ESLint config from linting
      "*.config.js", // Exclude other config files
      "*.config.mjs", // Exclude ES module config files
    ],
  },

  // ===== NEXT.JS BASE CONFIGURATION =====
  ...nextVitals,
  ...nextTs,

  // ===== BASE CONFIGURATION =====
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      import: importPlugin,
    },
    rules: {
      // === IMPORT RULES ===
      "import/no-internal-modules": "off", // DDD architecture with deep paths
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          pathGroups: [{ pattern: "@/**", group: "internal", position: "before" }],
          alphabetize: { order: "asc", caseInsensitive: true },
          "newlines-between": "always",
        },
      ],
      "import/no-duplicates": "error",
      "import/no-cycle": ["error", { maxDepth: 2 }],
      "import/no-default-export": "error", // Enforced by default, overridden for specific cases
      "import/no-relative-packages": "off",
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

      // === TYPESCRIPT RULES ===
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",

      // === REACT RULES ===
      "react/jsx-key": "error",
      "react/react-in-jsx-scope": "off",
      "react/function-component-definition": [
        "error",
        { namedComponents: "function-declaration", unnamedComponents: "arrow-function" },
      ],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // === GENERAL BEST PRACTICES ===
      complexity: ["warn", 10],
      "max-nested-callbacks": ["warn", 3],
      quotes: ["error", "double", { allowTemplateLiterals: true }],
      semi: ["error", "always"],
      "prefer-const": "error",
      "no-var": "error",
      "no-console": process.env.NODE_ENV === "production" ? "error" : "warn",
      "padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: "import", next: "*" },
        { blankLine: "any", prev: "import", next: "import" },
      ],
    },
  },

  // ===== NEXT.JS APP LAYER (can import features and shared modules) =====
  {
    files: ["**/app/**"],
    rules: {
      "import/no-default-export": "off", // Next.js requires default exports for pages and layouts
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../../../*", "../../../../*", "../../../../../*"],
              message: "Avoid deep relative imports. Use absolute imports with @ alias.",
            },
          ],
        },
      ],
    },
  },

  // ===== NEXT.JS PAGES =====
  {
    files: ["**/pages/**"],
    rules: {
      "import/no-default-export": "off", // Next.js requires default exports for pages
    },
  },

  // ===== TYPE DECLARATION FILES =====
  {
    files: ["**/*.d.ts"],
    rules: {
      "import/no-default-export": "off", // Type declaration files often need default exports for module augmentation
    },
  },

  // ===== CONFIGURATION FILES =====
  {
    files: [
      "**/config/**",
      "**/*Client.{ts,js}",
      "**/*Config.{ts,js}",
      "next.config.ts",
      "jest.config.ts",
    ],
    rules: {
      "import/no-default-export": "off", // Configuration files often use default exports
    },
  },

  // ===== APPLICATION LAYER (can import from domain and infrastructure) =====
  {
    files: ["**/application/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...CROSS_FEATURE_IMPORT_RESTRICTIONS,
            // Application layer can import from domain and infrastructure
          ],
        },
      ],
    },
  },

  // ===== INFRASTRUCTURE LAYER (can import from domain, but restrict cross-infrastructure imports) =====
  {
    files: ["**/infrastructure/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [...CROSS_FEATURE_IMPORT_RESTRICTIONS, ...INFRASTRUCTURE_LAYER_RESTRICTIONS],
        },
      ],
    },
  },

  // ===== INFRASTRUCTURE DI CONTAINER (can import from all infrastructure) =====
  {
    files: ["**/infrastructure/di/**"],
    rules: {
      "no-restricted-imports": "off", // DI container needs to import from all infrastructure modules
    },
  },

  // ===== DOMAIN LAYER (isolated) =====
  {
    files: ["**/domain/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...CROSS_FEATURE_IMPORT_RESTRICTIONS,
            ...DOMAIN_LAYER_RESTRICTIONS,
            {
              group: ["@/application/*", "@/infrastructure/*", "@/presentation/*"],
              message:
                "Domain layer should not import from application, infrastructure, or presentation layers.",
            },
          ],
        },
      ],
    },
  },

  // ===== PRESENTATION FEATURES (allow imports within same feature) =====
  {
    files: ["**/presentation/features/**"],
    rules: {
      "no-restricted-imports": "off", // Allow flexible imports within features
    },
  },

  // ===== MODALS (can access features but should use absolute imports) =====
  {
    files: ["**/presentation/modals/**"],
    rules: {
      "import/no-default-export": "off", // Modals often use default exports
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../../../*", "../../../../*", "../../../../../*"],
              message: "Avoid deep relative imports. Use absolute imports with @ alias.",
            },
          ],
        },
      ],
    },
  },

  // ===== COMPONENT FILES (allow default exports for components) =====
  {
    files: [
      "**/components/**/*.{tsx,jsx}",
      "**/ui/**/*.{tsx,jsx}",
      "**/*Modal.{tsx,jsx}",
      "**/*Page.{tsx,jsx}",
      "**/*Item.{tsx,jsx}",
      "**/*Desktop.{tsx,jsx}",
      "**/*Mobile.{tsx,jsx}",
    ],
    rules: {
      "import/no-default-export": "off", // React components typically use default exports
    },
  },

  // ===== SHARED HOOKS (can import from infrastructure but maintain other restrictions) =====
  {
    files: ["**/shared/hooks/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../../../*", "../../../../*", "../../../../../*"],
              message: "Avoid deep relative imports. Use absolute imports with @ alias.",
            },
          ],
        },
      ],
    },
  },

  // ===== SHARED PRESENTATION =====
  {
    files: ["**/presentation/shared/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            // Prohibit absolute imports within shared modules
            {
              group: ["@/presentation/shared", "@/presentation/shared/*"],
              message: "Use relative imports for modules within the shared presentation layer.",
            },
            // Prohibit excessively deep relative paths
            {
              group: ["../../../../../*"],
              message: "Path is too deep. Restructure your shared modules.",
            },
          ],
        },
      ],
    },
  },
  // ===== PRETTIER =====
  prettier,
];
