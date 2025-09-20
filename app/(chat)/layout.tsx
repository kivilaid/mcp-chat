import { cookies } from 'next/headers';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
// COMMENTED OUT FOR CLERK IMPLEMENTATION
// import { auth } from '../(auth)/auth';
import { auth } from '@clerk/nextjs/server';
import Script from 'next/script';
import { SessionProvider } from '@/components/session-provider';
import { SignedOutHeader } from '@/components/signed-out-header';
import { isAuthDisabled, isPersistenceDisabled } from '@/lib/constants';
import { createGuestSession } from '@/lib/utils';

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  let session = null;
  let isSignedIn = false;

  if (isAuthDisabled) {
    // Use guest session when auth is disabled
    session = createGuestSession();
    isSignedIn = true;
  } else {
    // Use Clerk auth when enabled
    const { userId } = await auth();
    if (userId) {
      session = { user: { id: userId } };
      isSignedIn = true;
    }
  }

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <SessionProvider 
        isAuthDisabled={isAuthDisabled} 
        isPersistenceDisabled={isPersistenceDisabled}
        guestSession={isAuthDisabled ? session : undefined}
      >
        <SidebarProvider defaultOpen={!isCollapsed}>
          {isSignedIn ? (
            <>
              <AppSidebar user={session.user} />
              <SidebarInset>{children}</SidebarInset>
            </>
          ) : (
            <div className="flex flex-col h-dvh w-full overflow-hidden">
              <SignedOutHeader />
              <main className="flex-1 overflow-hidden">{children}</main>
            </div>
          )}
        </SidebarProvider>
      </SessionProvider>
    </>
  );
}
