import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

import "./styles/font.css";
import "./styles/globals.css";

import { metadataTexts } from "@/shared/locales/metadata";

document.title = metadataTexts.app.title;
document
  .querySelector('meta[name="description"]')
  ?.setAttribute("content", metadataTexts.app.description);

const router = createRouter({
  routeTree,
  defaultPreload: "intent", // Preload on user intent (e.g., hover, focus)
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
