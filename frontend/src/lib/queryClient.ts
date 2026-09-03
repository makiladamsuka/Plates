import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes fresh in cache
      gcTime: 10 * 60 * 1000, // Keep in garbage collection cache for 10 minutes
      refetchOnWindowFocus: false, // Prevent jarring loading screens on window focus
      retry: 1,
    },
  },
});
