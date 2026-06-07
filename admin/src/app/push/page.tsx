'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, CheckCircle2, AlertTriangle, Users, UserCheck } from 'lucide-react';

interface TargetProfile {
  id: string;
  username: string;
  full_name: string;
  expo_push_token: string;
}

export default function PushSenderPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'single'>('all');
  const [selectedUser, setSelectedUser] = useState('');
  const [users, setUsers] = useState<TargetProfile[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch users with push notifications enabled
  useEffect(() => {
    const fetchPushUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, expo_push_token')
          .eq('push_enabled', true)
          .not('expo_push_token', 'is', null);

        if (error) throw error;
        setUsers(data || []);
      } catch (err) {
        console.error('Error fetching push users:', err);
      }
    };

    fetchPushUsers();
  }, []);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!title || !body) {
      setError('Please fill in both title and body fields.');
      setLoading(false);
      return;
    }

    if (targetType === 'single' && !selectedUser) {
      setError('Please select a recipient user.');
      setLoading(false);
      return;
    }

    const payload = {
      type: 'MANUAL',
      target: targetType === 'all' ? 'all' : selectedUser,
      title,
      body,
    };

    try {
      // Invoke the supabase edge function 'send-push'
      const { data, error: funcError } = await supabase.functions.invoke('send-push', {
        body: payload,
      });

      if (funcError) throw funcError;

      setSuccess(true);
      setTitle('');
      setBody('');
    } catch (err: any) {
      console.error('Push notification send error:', err);
      setError(err.message || 'Failed to dispatch push notification. Make sure the Edge function is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Send className="h-8 w-8 text-emerald-400" />
          Send Push Notifications
        </h1>
        <p className="mt-2 text-zinc-400">
          Compose and dispatch real-time native push notifications directly to user devices.
        </p>
      </div>

      {/* Glassmorphic Panel */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
        <form onSubmit={handleSendNotification} className="space-y-6">
          {success && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <span>Notification successfully dispatched to the server queue!</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Target type selection */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-zinc-300">
              Recipient Audience
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => { setTargetType('all'); setError(null); }}
                className={`flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                  targetType === 'all'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                    : 'bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Users className="h-5 w-5" />
                All Users ({users.length})
              </button>
              <button
                type="button"
                onClick={() => { setTargetType('single'); setError(null); }}
                className={`flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                  targetType === 'single'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                    : 'bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <UserCheck className="h-5 w-5" />
                Specific User
              </button>
            </div>
          </div>

          {/* User selector dropdown (if single chosen) */}
          {targetType === 'single' && (
            <div className="space-y-2 animate-fadeIn">
              <label htmlFor="user-select" className="block text-sm font-medium text-zinc-400">
                Select Recipient
              </label>
              <select
                id="user-select"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm transition-all"
              >
                <option value="">-- Choose a user with active push tokens --</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || 'No Name'} (@{user.username || 'unknown'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notification Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-zinc-400">
              Notification Title
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Try a new recipe today! 👨‍🍳"
              className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white placeholder-zinc-650 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm transition-all"
            />
          </div>

          {/* Notification Body */}
          <div className="space-y-2">
            <label htmlFor="body" className="block text-sm font-medium text-zinc-400">
              Message Body
            </label>
            <textarea
              id="body"
              required
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="e.g. Bode just uploaded Jollof Rice. Open ChowBase and check it out!"
              className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white placeholder-zinc-650 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm transition-all resize-none"
            />
          </div>

          {/* Dispatch Button */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                Dispatched Send Query...
              </>
            ) : (
              <>
                <Send className="h-4.5 w-4.5" />
                Dispatch Push Notification
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
