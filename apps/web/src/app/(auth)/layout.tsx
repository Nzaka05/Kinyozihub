'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <div className="min-h-screen bg-background text-textPrimary antialiased flex flex-col justify-center relative">
        <div className="absolute top-8 w-full flex justify-center">
          <span className="font-sans text-2xl font-extrabold text-primary tracking-tighter">
            KinyoziHub
          </span>
        </div>
        {children}
      </div>
    </GoogleOAuthProvider>
  );
}

