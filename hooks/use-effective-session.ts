'use client';

import { useAuthContext } from '@/components/session-provider';
import { SESSION_DURATION_MS } from '@/lib/constants';

/**
 * Hook that provides an "effective" session - either the real Clerk session
 * or a guest session when auth is disabled.
 *
 * This abstraction allows components to use the same session interface regardless
 * of whether auth is enabled or disabled, making development easier while keeping
 * the same code paths for production.
 *
 * @returns Session data compatible with auth session hook
 */
export function useEffectiveSession() {
  const { isAuthDisabled, guestSession, clerkSession } = useAuthContext();

  // If auth is disabled, always return the guest session
  if (isAuthDisabled) {
    if (guestSession) {
      return {
        data: {
          ...guestSession,
          expires: new Date(Date.now() + SESSION_DURATION_MS).toISOString()
        },
        status: 'authenticated' as const,
        update: () => Promise.resolve(null)
      };
    }
    return { data: null, status: 'unauthenticated' as const, update: () => Promise.resolve(null) };
  }

  // When auth is enabled, return the clerk session provided by the context
  return clerkSession || { data: null, status: 'unauthenticated' as const, update: () => Promise.resolve(null) };
}