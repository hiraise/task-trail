export const ENV = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  ENVIRONMENT: process.env.NODE_ENV || "development",
  IS_PRODUCTION: process.env.NODE_ENV === "production",
  IS_DEVELOPMENT: process.env.NODE_ENV === "development",
  DEBUG: process.env.DEBUG === "true",
} as const;

export function validateEnvironment(): void {
  if (!ENV.API_URL) {
    throw new Error("Missing NEXT_PUBLIC_API_URL environment variable");
  }
}
