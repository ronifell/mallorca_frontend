import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

/** Drop cached API data on logout / account switch so the next user never sees stale profiles. */
export function clearAppQueryCache(): void {
  queryClient.clear();
}
