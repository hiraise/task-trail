export type LogType = "error" | "info" | "warn" | "fatal";

export interface ClientLogger {
  error: (message: string, meta?: Record<string, unknown>) => void;
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  fatal: (message: string, meta?: Record<string, unknown>) => void;
}

const isProduction = process.env.NODE_ENV === "production";

export const clientLogger: ClientLogger = {
  error(message, meta) {
    if (!isProduction) {
      console.error(
        "%c[CLIENT][ERROR] ⛔ %s",
        "color: white; background: #d32f2f; font-weight: bold; padding:2px 6px; border-radius:3px;",
        message,
        meta || ""
      );
    }
  },
  info(message, meta) {
    if (!isProduction) {
      console.info(
        "%c[CLIENT][INFO] ℹ️ %s",
        "color: white; background: #1976d2; font-weight: bold; padding:2px 6px; border-radius:3px;",
        message,
        meta || ""
      );
    }
  },
  warn(message, meta) {
    if (!isProduction) {
      console.warn(
        "%c[CLIENT][WARN] ⚠️ %s",
        "color: #fffbe6; background: #ffa000; font-weight: bold; padding:2px 6px; border-radius:3px; color: #333;",
        message,
        meta || ""
      );
    }
  },
  fatal(message, meta) {
    if (!isProduction) {
      console.error(
        "%c[CLIENT][FATAL] 💀 %s",
        "color: white; background: #000; font-weight: bold; padding:2px 6px; border-radius:3px;",
        message,
        meta || ""
      );
    }
  },
};
