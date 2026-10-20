import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { handleGlobalError } from "@/shared/errors/handleGlobalError";
import { AppRootProviders } from "@/presentation/app";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleGlobalError,
  }),
  mutationCache: new MutationCache({
    onError: handleGlobalError,
  }),
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

// Connect with TanStack Query DevTools
declare global {
  interface Window {
    __TANSTACK_QUERY_CLIENT__: QueryClient;
  }
}

window.__TANSTACK_QUERY_CLIENT__ = queryClient;

// Export queryClient for use in route loaders
export { queryClient };

export const Route = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <AppRootProviders>
        <Outlet />
        {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
      </AppRootProviders>
    </QueryClientProvider>
  ),
});
