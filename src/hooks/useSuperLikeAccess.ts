import { useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { discoveryApi } from '../api/endpoints';
import { useAuthStore } from '../store/auth';

/**
 * Super Like UI + gating reads weekly quota from the API, but Premium purchase
 * only patched auth state — leaving a cached non-Premium quota until refetch.
 */
export function useSuperLikeAccess() {
  const authIsPremium = useAuthStore((s) => s.user?.isPremium ?? false);
  const { data: quota, refetch } = useQuery({
    queryKey: ['superLikeQuota'],
    queryFn: () => discoveryApi.superLikeQuota(),
  });

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const unlocked = authIsPremium || quota?.isPremium === true;
  const remaining = quota?.isPremium === true ? quota.remaining : null;

  return { quota, unlocked, remaining, refetch, authIsPremium };
}
