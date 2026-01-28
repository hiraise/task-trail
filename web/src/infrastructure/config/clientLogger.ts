/* eslint-disable no-console */
export type LogType = "error" | "info" | "warn" | "fatal";

export interface ClientLogger {
  error(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  fatal(message: string, meta?: Record<string, unknown>): void;
}

const CONSOLE_STYLES = {
  error:
    "color: white; background: #d32f2f; font-weight: bold; padding:2px 6px; border-radius:3px;",
  info: "color: white; background: #1976d2; font-weight: bold; padding:2px 6px; border-radius:3px;",
  warn: "color: #333; background: #ffa000; font-weight: bold; padding:2px 6px; border-radius:3px;",
  fatal: "color: white; background: #000; font-weight: bold; padding:2px 6px; border-radius:3px;",
} as const;

const LOG_PREFIXES = {
  error: "[CLIENT][ERROR] ⛔",
  info: "[CLIENT][INFO] ℹ️",
  warn: "[CLIENT][WARN] ⚠️",
  fatal: "[CLIENT][FATAL] 💀",
} as const;

function getConsoleMethod(type: LogType): typeof console.error {
  switch (type) {
    case "error":
    case "fatal":
      return console.error;
    case "warn":
      return console.warn;
    case "info":
    default:
      return console.info;
  }
}

const log = (type: LogType, message: string, meta?: Record<string, unknown>): void => {
  if (process.env.NODE_ENV === "production") return;

  const prefix = LOG_PREFIXES[type];
  const style = CONSOLE_STYLES[type];
  const consoleMethod = getConsoleMethod(type);

  const hasMetadata =
    meta &&
    Object.keys(meta).length > 0 &&
    Object.values(meta).some((v) => v !== undefined && v !== null);

  if (hasMetadata) {
    consoleMethod(`%c${prefix} %s`, style, message, meta);
  } else {
    consoleMethod(`%c${prefix} %s`, style, message);
  }
};

export const clientLogger: ClientLogger = {
  error: (message, meta) => log("error", message, meta),
  info: (message, meta) => log("info", message, meta),
  warn: (message, meta) => log("warn", message, meta),
  fatal: (message, meta) => log("fatal", message, meta),
};
