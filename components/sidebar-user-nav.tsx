'use client';
import { ChevronUp } from 'lucide-react';
import Image from 'next/image';
// COMMENTED OUT FOR CLERK IMPLEMENTATION
// import type { User } from 'next-auth';
// Using a generic user type that works for both auth systems
type User = {
  id: string;
  email?: string | null;
  name?: string | null;
};
// COMMENTED OUT FOR CLERK IMPLEMENTATION
// import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useAuthContext } from './session-provider';
import * as React from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function SidebarUserNav({ user }: { user: User }) {
  const { setTheme, theme } = useTheme();
  const { isAuthDisabled } = useAuthContext();

  // When auth is disabled, show the custom dropdown for guest session
  if (isAuthDisabled) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent bg-background data-[state=open]:text-sidebar-accent-foreground h-10">
                <Image
                  src={`https://avatar.vercel.sh/${user.email || 'guest'}`}
                  alt={user.email ?? 'Guest User Avatar'}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
                <span className="truncate">{user?.email || 'Guest User'}</span>
                <ChevronUp className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              className="w-[--radix-popper-anchor-width]"
            >
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {`Toggle ${theme === 'light' ? 'dark' : 'light'} mode`}
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/accounts" className="w-full cursor-pointer">
                  Connected accounts
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className='text-xs text-muted-foreground px-2 py-1'>
                User ID: {user.id}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // When auth is enabled, dynamically load and use Clerk's UserButton
  const [UserButton, setUserButton] = React.useState<any>(null);

  React.useEffect(() => {
    if (!isAuthDisabled) {
      const loadClerkUserButton = async () => {
        try {
          const { UserButton: ClerkUserButton } = await import('@clerk/nextjs');
          setUserButton(() => ClerkUserButton);
        } catch (error) {
          console.error('Failed to load Clerk UserButton:', error);
        }
      };
      loadClerkUserButton();
    }
  }, [isAuthDisabled]);

  if (!isAuthDisabled && UserButton) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center justify-between h-10 px-2">
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-6 h-6"
                }
              }}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Theme
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="end">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {`Toggle ${theme === 'light' ? 'dark' : 'light'} mode`}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Loading state for Clerk components
  if (!isAuthDisabled && !UserButton) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center justify-center h-10 px-2">
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Fallback: return the guest session UI (this should normally be handled by the earlier return)
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent bg-background data-[state=open]:text-sidebar-accent-foreground h-10">
              <Image
                src={`https://avatar.vercel.sh/${user.email || 'guest'}`}
                alt={user.email ?? 'Guest User Avatar'}
                width={24}
                height={24}
                className="rounded-full"
              />
              <span className="truncate">{user?.email || 'Guest User'}</span>
              <ChevronUp className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            className="w-[--radix-popper-anchor-width]"
          >
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {`Toggle ${theme === 'light' ? 'dark' : 'light'} mode`}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/accounts" className="w-full cursor-pointer">
                Connected accounts
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className='text-xs text-muted-foreground px-2 py-1'>
              User ID: {user.id}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
