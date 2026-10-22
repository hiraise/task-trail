import z from "zod";

import { adminTexts } from "@/shared/locales/admin";

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

// The server accepts an http(s) URL and strips a trailing `/` itself (ADR-0015)
export const schema = z.object({
  serviceUrl: z.string().trim().refine(isHttpUrl, adminTexts.serviceUrl.invalid),
});

export type FormValues = z.infer<typeof schema>;
