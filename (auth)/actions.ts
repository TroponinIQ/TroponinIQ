'use server';

import { z } from 'zod';
import { signIn } from './auth';

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
  message?: string;
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    const result = await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    if (result?.error) {
      return { 
        status: 'failed',
        message: 'Invalid email or password'
      };
    }

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        status: 'invalid_data',
        message: 'Please check your email and password'
      };
    }

    return { 
      status: 'failed',
      message: 'An error occurred during login'
    };
  }
};

export interface RegisterActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'user_exists'
    | 'invalid_data';
  message?: string;
}

export const register = async (
  _: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    // First, try to create the user
    const baseUrl = process.env.BASE_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://www.troponiniq.com' 
        : 'http://localhost:3000');

    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: validatedData.email,
        password: validatedData.password,
        displayName: formData.get('displayName') || undefined,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      if (response.status === 409) {
        return { 
          status: 'user_exists',
          message: 'An account with this email already exists'
        };
      }
      return { 
        status: 'failed',
        message: result.error || 'Failed to create account'
      };
    }

    // If user creation successful, try to sign them in
    const signInResult = await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    if (signInResult?.error) {
      return { 
        status: 'failed',
        message: 'Account created but failed to sign in. Please try logging in.'
      };
    }

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        status: 'invalid_data',
        message: 'Please check your email and password'
      };
    }

    return { 
      status: 'failed',
      message: 'An error occurred during registration'
    };
  }
};

export interface MagicLinkActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data' | 'rate_limited';
  message?: string;
  magicLink?: string; // Only in development
}

export const sendMagicLink = async (
  _: MagicLinkActionState,
  formData: FormData,
): Promise<MagicLinkActionState> => {
  try {
    const email = formData.get('email') as string;

    if (!email) {
      return { 
        status: 'invalid_data',
        message: 'Email is required'
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { 
        status: 'invalid_data',
        message: 'Please enter a valid email address'
      };
    }

    const baseUrl = process.env.BASE_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://www.troponiniq.com' 
        : 'http://localhost:3000');

    const response = await fetch(`${baseUrl}/api/auth/magic-link/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();

    if (!response.ok) {
      if (response.status === 429) {
        return { 
          status: 'rate_limited',
          message: result.error || 'Too many requests. Please wait before trying again.'
        };
      }
      return { 
        status: 'failed',
        message: result.error || 'Failed to send magic link'
      };
    }

    return { 
      status: 'success',
      message: result.message,
      ...(result.magicLink ? { magicLink: result.magicLink } : {})
    };
  } catch (error) {
    return { 
      status: 'failed',
      message: 'An error occurred while sending the magic link'
    };
  }
};

export interface MagicLinkVerifyActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
  message?: string;
}

export const verifyMagicLink = async (
  token: string,
  email: string,
): Promise<MagicLinkVerifyActionState> => {
  try {
    if (!token || !email) {
      return { 
        status: 'invalid_data',
        message: 'Invalid magic link'
      };
    }

    const signInResult = await signIn('magic-link', {
      token,
      email,
      redirect: false,
    });

    if (signInResult?.error) {
      return { 
        status: 'failed',
        message: 'Invalid or expired magic link. Please request a new one.'
      };
    }

    return { status: 'success' };
  } catch (error) {
    return { 
      status: 'failed',
      message: 'An error occurred during magic link verification'
    };
  }
};
