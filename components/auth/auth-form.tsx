'use client';

// import Form from 'next/form'; // No longer using Next.js Form for this simple case
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AuthForm({
  onSubmit, 
  children,
  defaultEmail = '',
  mode = 'login',
}: {
  onSubmit: (data: { email: string; password: string; displayName?: string }) => void | Promise<void>;
  children: React.ReactNode; // This will be the submit button
  defaultEmail?: string;
  mode?: 'login' | 'register';
}) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const displayName = formData.get('displayName') as string;
    
    onSubmit({ 
      email, 
      password, 
      ...(mode === 'register' ? { displayName } : {})
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 sm:px-16">
      {mode === 'register' && (
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="displayName"
            className="text-zinc-600 font-normal dark:text-zinc-400"
          >
            Display Name (Optional)
          </Label>

          <Input
            id="displayName"
            name="displayName"
            className="bg-muted text-md md:text-sm"
            type="text"
            placeholder="Your Name"
            autoComplete="name"
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="email"
          className="text-zinc-600 font-normal dark:text-zinc-400"
        >
          Email Address
        </Label>

        <Input
          id="email"
          name="email"
          className="bg-muted text-md md:text-sm"
          type="email"
          placeholder="user@acme.com"
          autoComplete="email"
          required
          autoFocus={mode === 'login'}
          defaultValue={defaultEmail}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="password"
          className="text-zinc-600 font-normal dark:text-zinc-400"
        >
          Password
        </Label>

        <Input
          id="password"
          name="password"
          className="bg-muted text-md md:text-sm"
          type="password"
          placeholder={mode === 'register' ? 'Choose a secure password (min 6 characters)' : 'Enter your password'}
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          required
          minLength={6}
        />
      </div>

      {children} {/* This is where the SubmitButton will go */}
    </form>
  );
}
