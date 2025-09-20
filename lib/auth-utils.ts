import 'server-only';

// COMMENTED OUT FOR CLERK IMPLEMENTATION - keeping for fallback
// import { auth } from '@/app/(auth)/auth';
import { auth } from '@clerk/nextjs/server';
import { isAuthDisabled, isPersistenceDisabled } from '@/lib/constants';
import { createGuestSession } from '@/lib/utils';

// Shared helper for API routes to get effective session
export async function getEffectiveSession() {
  if (isAuthDisabled) {
    // In dev mode with auth disabled, always return a guest session
    return createGuestSession();
  }

  // Use Clerk auth when enabled
  const { userId } = await auth();

  if (userId) {
    return {
      user: {
        id: userId,
        email: null, // Clerk will provide this via separate call if needed
        name: null,
      }
    };
  }

  return null;
}

// Helper to check if we should persist data to database
export function shouldPersistData() {
  return !isPersistenceDisabled;
}