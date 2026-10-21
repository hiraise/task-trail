import { createFileRoute } from "@tanstack/react-router";

import { EditPersonalDataPage } from "@/presentation/features/user/pages";

export const Route = createFileRoute("/_main/profile/edit-personal-data")({
  component: EditPersonalDataPage,
});
