import Form from 'next/form';

import { signOut } from '@/app/(auth)/auth';

export const SignOutForm = () => {
  return (
    <Form
      className="w-full"
      action={async () => {
        'use server';

        try {
          await signOut({
            redirectTo: '/',
          });
        } catch (error) {
          console.error('Server-side logout failed:', error);
          // The error will be handled by the auth system
          // In case of failure, user will be redirected to an error page
        }
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
