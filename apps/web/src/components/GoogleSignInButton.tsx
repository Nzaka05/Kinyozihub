'use client';

import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Shared Google sign-in button used on both /login and /register.
 * 
 * On success from Google's popup:
 * - POSTs the ID token to /api/auth/google
 * - If existing user: calls login() and redirects to the role-based dashboard
 * - If new user: stores the googleRegistrationToken in sessionStorage
 *   and redirects to /register so they complete phone verification first
 */
export function GoogleSignInButton() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState('');

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    const idToken = credentialResponse.credential;
    if (!idToken) {
      setError('No credential received from Google.');
      return;
    }

    try {
      const { data } = await api.post('/auth/google', { idToken });

      // Backend now returns accessToken + user for all successful sign-ins
      login(data.accessToken, data.user);

      if (data.user.phone?.startsWith('google_')) {
        // New user or user hasn't provided a real phone number yet
        router.push('/onboarding/profile');
        return;
      }

      const role = data.user.role;
      if (role === 'client') {
        router.push('/client/dashboard');
      } else if (role === 'barber') {
        router.push('/barber/dashboard');
      } else if (role === 'shop_owner') {
        router.push('/shop/dashboard');
      } else {
        router.push('/login');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Google sign-in failed. Please try again.');
    }
  };

  // Expose to window for testing since headless browsers can't click the real button
  useEffect(() => {
    (window as any).__mockGoogleSuccess = () => handleSuccess({ credential: 'mock_token', clientId: 'mock_client' });
  }, [handleSuccess]);

  const handleError = () => {
    setError('Google sign-in was cancelled or failed.');
  };

  return (
    <div className="w-full">
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          theme="outline"
          size="large"
          width="350"
          text="continue_with"
        />
      </div>
      {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
    </div>
  );
}
