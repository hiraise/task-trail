import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { InvitePage } from "@/presentation/features/auth/pages";

// Токен приглашения из ссылки `<адрес сервиса>/auth/invite?token=…`; в API он уходит в теле
const searchSchema = z.object({ token: z.string().optional() });

export const Route = createFileRoute("/auth/invite/")({
  validateSearch: searchSchema,
  component: InvitePage,
});
