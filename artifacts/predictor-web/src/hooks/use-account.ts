import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, session, type Me } from "@/lib/api";

/** The signed-in customer, or null. */
export function useAccount() {
  const queryClient = useQueryClient();
  const hasToken = Boolean(session.get());

  const query = useQuery<Me | null>({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        return await api.me();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    enabled: hasToken,
    staleTime: 60_000,
  });

  const signOut = () => {
    session.clear();
    queryClient.setQueryData(["me"], null);
    // Anything fetched while signed in may include subscriber-only data.
    queryClient.invalidateQueries();
  };

  const signIn = (token: string) => {
    session.set(token);
    queryClient.invalidateQueries();
  };

  return {
    user: hasToken ? (query.data ?? null) : null,
    isLoading: hasToken && query.isLoading,
    signIn,
    signOut,
  };
}
