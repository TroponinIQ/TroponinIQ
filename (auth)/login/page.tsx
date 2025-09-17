'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AuthForm } from '@/components/auth/auth-form';
import { login, sendMagicLink, type LoginActionState, type MagicLinkActionState } from '../actions';
import { signIn, useSession } from 'next-auth/react';
import { AlertCircle, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isMagicLinkPending, startMagicLinkTransition] = useTransition();
  const [state, setState] = useState<LoginActionState>({ status: 'idle' });
  const [magicLinkState, setMagicLinkState] = useState<MagicLinkActionState>({ status: 'idle' });
  const [showMagicLink, setShowMagicLink] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect authenticated users away from login page
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/');
    }
  }, [session, status, router]);

  const handleLogin = (data: { email: string; password: string }) => {
    startTransition(async () => {
      setState({ status: 'in_progress' });
      
      const formData = new FormData();
      formData.append('email', data.email);
      formData.append('password', data.password);
      
      const result = await login(state, formData);
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

  const handleMagicLink = (data: { email: string }) => {
    startMagicLinkTransition(async () => {
      setMagicLinkState({ status: 'in_progress' });
      
      const formData = new FormData();
      formData.append('email', data.email);
      
      const result = await sendMagicLink(magicLinkState, formData);
      setMagicLinkState(result);
    });
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

  // Don't render login form if user is authenticated (will redirect)
  if (status === 'authenticated') {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light tracking-tight text-foreground mb-2">
            Welcome Back
          </h1>
          <p className="text-muted-foreground text-sm">
            Continue your transformation with expert coaching
          </p>
        </div>
        <div className="space-y-8">
          {!showMagicLink ? (
            <>
              {/* Google Login */}
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
                    <span>Continue with Google</span>
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

              {/* Email/Password Login */}
              <AuthForm
                mode="login"
                onSubmit={handleLogin}
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
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </AuthForm>

              {/* Magic Link Option */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowMagicLink(true)}
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors inline-flex items-center gap-2"
                >
                  <Mail className="size-4" />
                  <span>Send me a login link instead</span>
                </button>
              </div>

              {/* Error Messages */}
              {state.status === 'failed' && (
                <div className="flex items-center space-x-2 text-destructive text-sm">
                  <AlertCircle className="size-4" />
                  <span>{state.message || 'Login failed. Please try again.'}</span>
                </div>
              )}

              {state.status === 'invalid_data' && (
                <div className="flex items-center space-x-2 text-destructive text-sm">
                  <AlertCircle className="size-4" />
                  <span>{state.message || 'Please check your email and password.'}</span>
                </div>
              )}

              {/* Register Link */}
              <div className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-primary hover:underline font-medium">
                  Start your transformation
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Magic Link Form */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setShowMagicLink(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="size-4" />
                  </button>
                  <h3 className="text-lg font-semibold">Send Login Link</h3>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  Enter your email address and we&apos;ll send you a secure login link.
                </p>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const email = formData.get('email') as string;
                  handleMagicLink({ email });
                }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="magic-email" className="text-muted-foreground">
                      Email Address
                    </Label>
                    <Input
                      id="magic-email"
                      name="email"
                      type="email"
                      placeholder="user@acme.com"
                      className="bg-muted text-md md:text-sm"
                      required
                      autoFocus
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isMagicLinkPending}
                    className="w-full h-12"
                    size="lg"
                  >
                    {isMagicLinkPending ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full size-5 border-b-2 border-white" />
                        <span>Sending link...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Mail className="size-4" />
                        <span>Send Login Link</span>
                      </div>
                    )}
                  </Button>
                </form>
              </div>

              {/* Magic Link Status Messages */}
              {magicLinkState.status === 'success' && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  <div className="flex items-center space-x-2 text-green-700 dark:text-green-400 text-sm">
                    <CheckCircle className="size-4" />
                    <span>{magicLinkState.message}</span>
                  </div>
                  {magicLinkState.magicLink && process.env.NODE_ENV === 'development' && (
                    <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs">
                      <p className="font-semibold text-yellow-800 dark:text-yellow-400">Development Mode:</p>
                      <a 
                        href={magicLinkState.magicLink}
                        className="text-primary hover:underline break-all"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {magicLinkState.magicLink}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {magicLinkState.status === 'failed' && (
                <div className="flex items-center space-x-2 text-destructive text-sm">
                  <AlertCircle className="size-4" />
                  <span>{magicLinkState.message || 'Failed to send magic link. Please try again.'}</span>
                </div>
              )}

              {magicLinkState.status === 'rate_limited' && (
                <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400 text-sm">
                  <AlertCircle className="size-4" />
                  <span>{magicLinkState.message}</span>
                </div>
              )}

              {magicLinkState.status === 'invalid_data' && (
                <div className="flex items-center space-x-2 text-destructive text-sm">
                  <AlertCircle className="size-4" />
                  <span>{magicLinkState.message || 'Please enter a valid email address.'}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 