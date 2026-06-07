'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, Trash2, AlertOctagon } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';

interface Comment {
  id: string;
  content: string;
  is_flagged: boolean;
  created_at: string;
  recipes: {
    title: string;
  };
  profiles: {
    username: string;
    full_name: string;
  };
}

export default function ModerationPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

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

  const fetchFlaggedComments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          is_flagged,
          created_at,
          recipes (
            title
          ),
          profiles (
            username,
            full_name
          )
        `)
        .eq('is_flagged', true)
        .order('created_at', { ascending: false });

      if (error) {
        setComments([]);
      } else {
        setComments(data as any || []);
      }
    } catch (err) {
      console.error('Error fetching flagged comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlaggedComments();
  }, []);

  const dismissFlag = async (id: string) => {
    setModalOpen(false);
    try {
      const { error } = await supabase
        .from('comments')
        .update({ is_flagged: false })
        .eq('id', id);

      if (error) throw error;
      setComments(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error dismissing flag:', err);
    }
  };

  const deleteComment = async (id: string) => {
    setModalOpen(false);
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setComments(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <AlertOctagon className="h-8 w-8 text-red-500" />
          Flagged Comments
        </h1>
        <p className="mt-2 text-zinc-400">
          Review community-reported comments. Approve to dismiss the flag or delete to purge.
        </p>
      </div>

      {/* Main Container */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            <span className="text-4xl mb-2">🎉</span>
            <p className="font-medium">No flagged comments to moderate</p>
            <p className="text-xs text-zinc-600 mt-1">Excellent job! Your moderation queue is empty.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {comments.map((comment) => (
              <div key={comment.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-zinc-800/10 transition-all">
                <div className="space-y-2 max-w-3xl">
                  {/* Meta details */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                    <span className="font-semibold text-zinc-200">
                      {comment.profiles?.full_name || comment.profiles?.username || 'Anonymous'}
                    </span>
                    <span>on</span>
                    <span className="text-emerald-400 font-medium italic">
                      "{comment.recipes?.title || 'Unknown Recipe'}"
                    </span>
                    <span>•</span>
                    <span className="font-mono">
                      {new Date(comment.created_at).toLocaleDateString(undefined, { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  {/* Comment Body */}
                  <p className="text-zinc-200 bg-zinc-950/40 border border-zinc-800/40 p-3.5 rounded-2xl text-sm italic">
                    "{comment.content}"
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 md:self-center">
                  <button
                    onClick={() => openConfirm(
                      'Dismiss Flag',
                      'Are you sure you want to dismiss the flag on this comment? It will be shown in the app feed again.',
                      'info',
                      () => dismissFlag(comment.id)
                    )}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-500/10 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 text-xs font-semibold cursor-pointer transition-all"
                  >
                    <ShieldCheck className="h-4.5 w-4.5" />
                    Dismiss
                  </button>

                  <button
                    onClick={() => openConfirm(
                      'Delete Comment',
                      'Are you sure you want to permanently delete this comment? This action is irreversible.',
                      'danger',
                      () => deleteComment(comment.id)
                    )}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/10 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:border-red-500/20 text-xs font-semibold cursor-pointer transition-all"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
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
