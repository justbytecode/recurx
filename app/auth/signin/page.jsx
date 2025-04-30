'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignInPage() {
  const [error, setError] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/auth/role-select';

  const handleSignIn = async () => {
    try {
      const result = await signIn('google', {
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError(result.error);
        console.error('Sign-in failed:', result.error);
      } else if (result?.url) {
        router.push(result.url);
      }
    } catch (err) {
      setError('An unexpected error occurred during sign-in');
      console.error('Sign-in error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Card className="w-full max-w-md bg-gray-900 text-white border-none rounded-lg">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <Button onClick={handleSignIn} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600">
            Sign in with Google
          </Button>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}