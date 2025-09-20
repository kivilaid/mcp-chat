import Form from 'next/form';

// COMMENTED OUT FOR CLERK IMPLEMENTATION
// import { signOut } from '@/app/(auth)/auth';

export const SignOutForm = () => {
  return (
    <Form
      className="w-full"
      action={async () => {
        'use server';

        // COMMENTED OUT FOR CLERK IMPLEMENTATION
        // await signOut({
        //   redirectTo: '/',
        // });
        console.log('Sign out clicked - functionality depends on auth configuration');
      }}
    >
      <button
        type="submit"
        className="w-full text-left px-1 py-0.5 text-red-500"
      >
        Sign out
      </button>
    </Form>
  );
};
