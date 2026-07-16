'use client';

import Link from "next/link";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export default function LoginPage() {
  return (
    <main className="w-full max-w-[400px] flex flex-col items-center mx-auto p-4 md:p-8">
      <div className="w-full text-center mb-8 mt-12">
        <h1 className="text-2xl font-semibold text-textPrimary mb-2">
          Welcome back
        </h1>
        <p className="text-sm text-textPrimary/70">
          Log in to your account to continue
        </p>
      </div>

      <div className="w-full space-y-4">
        <GoogleSignInButton />
      </div>

      <footer className="mt-8 text-center pb-8">
        <p className="text-sm text-textPrimary">
          Don't have an account? 
          <Link href="/register" className="text-primary font-bold ml-1 hover:underline">
            Sign up
          </Link>
        </p>
      </footer>
    </main>
  );
}

