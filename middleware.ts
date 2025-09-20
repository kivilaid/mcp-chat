// COMMENTED OUT FOR CLERK IMPLEMENTATION
// NextAuth middleware - will be replaced with Clerk middleware

/*
import NextAuth from 'next-auth';

import { authConfig } from '@/app/(auth)/auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ['/api/:path*', '/login', '/register'],
};
*/

// Conditional Clerk middleware implementation
import { NextRequest, NextResponse } from 'next/server';
import { isAuthDisabled } from '@/lib/constants';

export default async function middleware(request: NextRequest) {
  // If auth is disabled, just pass through
  if (isAuthDisabled) {
    return NextResponse.next();
  }

  // Dynamically import Clerk middleware only when auth is enabled
  const { clerkMiddleware, createRouteMatcher } = await import('@clerk/nextjs/server');

  const isProtectedRoute = createRouteMatcher([
    '/api/chat(.*)',
    '/chat(.*)',
  ]);

  return clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) {
      await auth.protect();
    }
  })(request);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
