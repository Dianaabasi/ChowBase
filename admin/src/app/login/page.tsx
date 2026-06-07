'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in as admin
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (profile?.is_admin) {
          router.replace('/');
        }
      }
    };
    checkUser();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.user) {
        // Query the profile to verify is_admin
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', data.user.id)
          .single();

        if (profileError || !profile?.is_admin) {
          // Sign out if not an admin
          await supabase.auth.signOut();
          throw new Error('Access Denied: You are not configured as an administrator.');
        }

        router.replace('/');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 py-12 lg:px-8">
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-emerald-700/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md z-10">
        <div className="flex flex-col items-center justify-center mb-10 text-center">
          <img 
            src="/logo.svg" 
            alt="ChowBase Logo" 
            className="w-64 h-64 object-contain drop-shadow-[0_0_15px_rgba(16,185,129,0.25)]"
          />
          <h1 className="text-3xl font-bold tracking-tight text-white font-sans">
            ChowBase <span className="text-emerald-400">Admin</span>
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Sign in to moderate and manage the platform
          </p>
        </div>

        {/* Glassmorphic Card */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-8 shadow-2xl">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                Email Address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white placeholder-zinc-500 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm transition-all"
                  placeholder="admin@chowbase.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                Password
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white placeholder-zinc-500 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
