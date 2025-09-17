'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AuthForm } from '@/components/auth/auth-form';
import { register, type RegisterActionState } from '../actions';
import { signIn, useSession } from 'next-auth/react';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const [isPending, startTransition] = useTransition();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [state, setState] = useState<RegisterActionState>({ status: 'idle' });
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect authenticated users away from register page
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/');
    }
  }, [session, status, router]);

  const handleRegister = (data: { email: string; password: string; displayName?: string }) => {
    startTransition(async () => {
      setState({ status: 'in_progress' });
      
      const formData = new FormData();
      formData.append('email', data.email);
      formData.append('password', data.password);
      if (data.displayName) {
        formData.append('displayName', data.displayName);
      }
      
      const result = await register(state, formData);
      setState(result);
      
      if (result.status === 'success') {
        // Use window.location for full page reload to ensure session sync
        setTimeout(() => {
          window.location.href = '/chat/new-chat';
        }, 100);
      }
    });
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn('google', {
        callbackUrl: '/chat/new-chat',
      });
    } catch (error) {
      console.error('Google login error:', error);
      setIsGoogleLoading(false);
    }
  };

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full size-8 border-b-2 border-foreground" />
        </div>
      </div>
    );
  }

  // Don't render register form if user is authenticated (will redirect)
  if (status === 'authenticated') {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light tracking-tight text-foreground mb-2">
            Start Your Elite Coaching Experience
          </h1>
          <p className="text-muted-foreground text-sm">
            Get instant access to 20+ years of world-class bodybuilding expertise
          </p>
        </div>
        <div className="space-y-8">
          {/* Google Signup */}
          <Button
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 transition-colors"
            size="lg"
          >
            {isGoogleLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full size-5 border-b-2 border-white" />
                <span>Connecting to Google...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <svg className="size-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Get started with Google</span>
              </div>
            )}
          </Button>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Email/Password Registration */}
          <AuthForm
            mode="register"
            onSubmit={handleRegister}
          >
            <Button 
              type="submit" 
              disabled={isPending}
              className="w-full h-12"
              size="lg"
            >
              {isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full size-5 border-b-2 border-white" />
                  <span>Setting up your coaching...</span>
                </div>
              ) : (
                'Begin Your Transformation'
              )}
            </Button>
          </AuthForm>

          {/* Success Message */}
          {state.status === 'success' && (
            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 text-sm">
              <CheckCircle className="size-4" />
              <span>Account created successfully! Redirecting...</span>
            </div>
          )}

          {/* Error Messages */}
          {state.status === 'failed' && (
            <div className="flex items-center space-x-2 text-destructive text-sm">
              <AlertCircle className="size-4" />
              <span>{state.message || 'Registration failed. Please try again.'}</span>
            </div>
          )}

          {state.status === 'user_exists' && (
            <div className="flex items-center space-x-2 text-destructive text-sm">
              <AlertCircle className="size-4" />
              <span>{state.message || 'An account with this email already exists.'}</span>
            </div>
          )}

          {state.status === 'invalid_data' && (
            <div className="flex items-center space-x-2 text-destructive text-sm">
              <AlertCircle className="size-4" />
              <span>{state.message || 'Please check your input.'}</span>
            </div>
          )}

          {/* Login Link */}
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Access your coaching
            </Link>
          </div>

          {/* Terms Notice */}
          <div className="text-xs text-muted-foreground text-center">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .<br />
            <span className="text-primary font-medium">Join elite athletes who trust TroponinIQ for results.</span>
          </div>
        </div>
      </div>
    </div>
  );
} 