'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { verifyMagicLink, type MagicLinkVerifyActionState } from '../../actions';
import { getSession } from 'next-auth/react';
import Link from 'next/link';

function MagicLinkContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<MagicLinkVerifyActionState>({ status: 'idle' });
  const [isVerifying, setIsVerifying] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const handleVerification = useCallback(async () => {
    if (!token || !email) {
      setState({
        status: 'invalid_data',
        message: 'Invalid magic link. Missing token or email.'
      });
      return;
    }

    setIsVerifying(true);
    setState({ status: 'in_progress' });

    try {
      const result = await verifyMagicLink(token, email);
      setState(result);

      if (result.status === 'success') {
        // Force session refresh to sync client-side state
        console.log('[Magic Link] Authentication successful, refreshing session...');
        await getSession(); // This forces a session refresh
        
        // Use window.location for full page reload to ensure session sync
        setTimeout(() => {
          window.location.href = '/chat/new-chat';
        }, 1000); // Reduced from 1500ms to 1000ms since we refreshed session
      }
    } catch (error) {
      setState({
        status: 'failed',
        message: 'An unexpected error occurred during verification.'
      });
    } finally {
      setIsVerifying(false);
    }
  }, [token, email]);

  useEffect(() => {
    // Auto-verify when component mounts if we have token and email
    if (token && email && state.status === 'idle') {
      handleVerification();
    }
  }, [token, email, state.status, handleVerification]);

  const getIcon = () => {
    switch (state.status) {
      case 'in_progress':
        return <Loader2 className="size-16 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="size-16 text-green-600" />;
      case 'failed':
      case 'invalid_data':
        return <AlertCircle className="size-16 text-red-600" />;
      default:
        return <Loader2 className="size-16 text-blue-600 animate-spin" />;
    }
  };

  const getTitle = () => {
    switch (state.status) {
      case 'in_progress':
        return 'Verifying Magic Link...';
      case 'success':
        return 'Login Successful!';
      case 'failed':
      case 'invalid_data':
        return 'Verification Failed';
      default:
        return 'Verifying Magic Link...';
    }
  };

  const getMessage = () => {
    switch (state.status) {
      case 'in_progress':
        return 'Please wait while we verify your magic link...';
      case 'success':
        return 'You have been successfully logged in. Redirecting to your dashboard...';
      case 'failed':
      case 'invalid_data':
        return state.message || 'The magic link is invalid or has expired.';
      default:
        return 'Please wait while we verify your magic link...';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <CardTitle className="text-2xl font-bold">
            {getTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-gray-600 text-sm">
            {getMessage()}
          </p>

          {(state.status === 'failed' || state.status === 'invalid_data') && (
            <div className="space-y-4">
              <Button
                onClick={handleVerification}
                disabled={isVerifying || !token || !email}
                className="w-full"
                variant="outline"
              >
                {isVerifying ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="size-4 animate-spin" />
                    <span>Retrying...</span>
                  </div>
                ) : (
                  'Try Again'
                )}
              </Button>
              
              <div className="text-sm text-gray-500">
                <Link href="/login" className="text-blue-600 hover:underline">
                  Return to login page
                </Link>
              </div>
            </div>
          )}

          {state.status === 'success' && (
            <div className="text-sm text-gray-500">
              If you&apos;re not redirected automatically,{' '}
              <Link href="/chat/new-chat" className="text-blue-600 hover:underline">
                click here
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Loader2 className="size-16 text-blue-600 animate-spin" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Loading...
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 text-sm">
            Please wait while we load the page...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MagicLinkPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <MagicLinkContent />
    </Suspense>
  );
} 