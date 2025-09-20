'use client';

import { createContext, useContext, ReactNode } from 'react';
import { SESSION_DURATION_MS } from '@/lib/constants';
import { GuestSession } from '@/types/user';

type SessionData = {
  data: any;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  update: () => Promise<any>;
};

type AuthContextType = {
  isAuthDisabled: boolean;
  isPersistenceDisabled: boolean;
  guestSession?: GuestSession;
  clerkSession?: SessionData;
};

const AuthContext = createContext<AuthContextType>({
  isAuthDisabled: false,
  isPersistenceDisabled: false
});

// Component that handles Clerk session when auth is enabled
function ClerkSessionProvider({ children, isPersistenceDisabled }: { children: ReactNode, isPersistenceDisabled: boolean }) {
  // Import Clerk hooks dynamically to avoid issues when auth is disabled
  const { useUser } = require('@clerk/nextjs');
  const { user, isLoaded, isSignedIn } = useUser();

  const clerkSession: SessionData = (() => {
    if (!isLoaded) {
      return { data: null, status: 'loading' as const, update: () => Promise.resolve(null) };
    }

    if (isSignedIn && user) {
      return {
        data: {
          user: {
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress || null,
            name: user.fullName || user.firstName || null,
          },
          expires: new Date(Date.now() + SESSION_DURATION_MS).toISOString()
        },
        status: 'authenticated' as const,
        update: () => Promise.resolve(null)
      };
    }

    return { data: null, status: 'unauthenticated' as const, update: () => Promise.resolve(null) };
  })();

  return (
    <AuthContext.Provider value={{
      isAuthDisabled: false,
      isPersistenceDisabled,
      clerkSession
    }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * SessionProvider provides authentication context for both disabled and enabled auth modes.
 *
 * When auth is disabled, it provides guest session data.
 * When auth is enabled, it wraps Clerk's session management.
 */
export function SessionProvider({
  children,
  isAuthDisabled,
  isPersistenceDisabled,
  guestSession
}: {
  children: ReactNode;
  isAuthDisabled: boolean;
  isPersistenceDisabled: boolean;
  guestSession?: GuestSession;
}) {
  if (isAuthDisabled) {
    return (
      <AuthContext.Provider value={{ isAuthDisabled, isPersistenceDisabled, guestSession }}>
        {children}
      </AuthContext.Provider>
    );
  }

  // When auth is enabled, use the Clerk session provider
  return <ClerkSessionProvider isPersistenceDisabled={isPersistenceDisabled}>{children}</ClerkSessionProvider>;
}

export function useAuthContext() {
  return useContext(AuthContext);
}