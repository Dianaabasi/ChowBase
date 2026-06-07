'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ChefHat, Shield, Search } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';

interface Profile {
  id: string;
  username: string;
  full_name: string;
  is_verified: boolean;
  is_admin: boolean;
  created_at: string;
}

export default function CreatorsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void;
  }>({
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {},
  });

  const openConfirm = (
    title: string, 
    message: string, 
    type: 'danger' | 'warning' | 'info' | 'success', 
    onConfirm: () => void
  ) => {
    setModalConfig({ title, message, type, onConfirm });
    setModalOpen(true);
  };

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, is_verified, is_admin, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error('Error fetching profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const toggleVerified = async (id: string, currentVal: boolean) => {
    setModalOpen(false);
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, is_verified: !currentVal } : p));
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: !currentVal })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error(err);
      // Revert if error
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, is_verified: currentVal } : p));
    }
  };

  const toggleAdmin = async (id: string, currentVal: boolean) => {
    setModalOpen(false);
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, is_admin: !currentVal } : p));
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentVal })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error(err);
      // Revert if error
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, is_admin: currentVal } : p));
    }
  };

  const filteredProfiles = profiles.filter(p =>
    (p.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.username || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Creators & Users</h1>
          <p className="mt-2 text-zinc-400">
            Grant Chef verifications or edit administrative privileges.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search users by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 pl-10 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm transition-all"
          />
          <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-zinc-500" />
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            <span className="text-4xl mb-2">👥</span>
            <p>No creators or users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">Joined Date</th>
                  <th className="px-6 py-4 text-center">Verified Chef</th>
                  <th className="px-6 py-4 text-center">Administrator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-sm text-zinc-300">
                {filteredProfiles.map((profile) => {
                  const displayName = profile.full_name || profile.username || 'Anonymous User';
                  return (
                    <tr key={profile.id} className="hover:bg-zinc-800/20 transition-all">
                      <td className="px-6 py-4 font-semibold text-white">
                        {displayName}
                      </td>
                      <td className="px-6 py-4 font-mono text-zinc-400">
                        @{profile.username || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-zinc-500 font-mono text-xs">
                        {new Date(profile.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => openConfirm(
                            profile.is_verified ? 'Revoke Verification' : 'Verify Chef',
                            `Are you sure you want to ${profile.is_verified ? 'revoke' : 'grant'} verified chef status for "${displayName}"?`,
                            profile.is_verified ? 'warning' : 'success',
                            () => toggleVerified(profile.id, profile.is_verified)
                          )}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
                            profile.is_verified
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                          }`}
                        >
                          <ChefHat className="h-4 w-4" />
                          {profile.is_verified ? 'Verified' : 'Verify'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => openConfirm(
                            profile.is_admin ? 'Revoke Admin' : 'Grant Admin privileges',
                            `Are you sure you want to ${profile.is_admin ? 'REVOKE' : 'GRANT'} administrator status for "${displayName}"?`,
                            profile.is_admin ? 'danger' : 'warning',
                            () => toggleAdmin(profile.id, profile.is_admin)
                          )}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
                            profile.is_admin
                              ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20'
                              : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                          }`}
                        >
                          <Shield className="h-4 w-4" />
                          {profile.is_admin ? 'Admin' : 'Make Admin'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={modalOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
}
