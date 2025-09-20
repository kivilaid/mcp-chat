'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { SignInModal } from './sign-in-modal';
import { useAuthContext } from './session-provider';
import { Suspense } from 'react';

// Dynamic Clerk auth buttons component
function ClerkAuthButtons() {
  const [ClerkComponents, setClerkComponents] = useState<any>(null);

  React.useEffect(() => {
    const loadClerk = async () => {
      try {
        const { SignInButton, SignUpButton } = await import('@clerk/nextjs');
        setClerkComponents({ SignInButton, SignUpButton });
      } catch (error) {
        console.error('Failed to load Clerk components:', error);
      }
    };
    loadClerk();
  }, []);

  if (!ClerkComponents) {
    return (
      <Button variant="outline" disabled>
        Loading...
      </Button>
    );
  }

  const { SignInButton, SignUpButton } = ClerkComponents;

  return (
    <>
      <SignInButton mode="modal">
        <Button variant="outline">
          Sign in
        </Button>
      </SignInButton>
      <SignUpButton mode="modal">
        <Button variant="blue">
          Get started
        </Button>
      </SignUpButton>
    </>
  );
}

export function SignedOutHeader() {
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const { isAuthDisabled } = useAuthContext();

  const handleGetStarted = () => {
    if (isAuthDisabled) {
      setIsSignInModalOpen(true);
    }
    // For Clerk, the SignUpButton will handle navigation
  };

  return (
    <header className="flex items-center w-full px-4 py-3 bg-background gap-4 sticky top-0 z-10 border-b">
      <Link href="/" className="flex items-center">
        <Image
          src="/images/pipedream.svg"
          alt="Pipedream"
          width={108}
          height={24}
          priority
          className="dark:invert"
        />
      </Link>

      <div className="flex items-center gap-3 ml-auto">
        {isAuthDisabled ? (
          <Button onClick={handleGetStarted} variant="blue">
            Get started
          </Button>
        ) : (
          <ClerkAuthButtons />
        )}
      </div>

      {isAuthDisabled && (
        <SignInModal
          isOpen={isSignInModalOpen}
          onClose={() => setIsSignInModalOpen(false)}
        />
      )}
    </header>
  );
}