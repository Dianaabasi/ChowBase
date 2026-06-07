'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Star, Trash2, ShieldAlert, CheckCircle, Search, Flame } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';

interface Recipe {
  id: string;
  title: string;
  kcal: number;
  healthy_score: number;
  is_featured: boolean;
  status: string;
  created_at: string;
  profiles: {
    username: string;
    full_name: string;
  };
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
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

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          id,
          title,
          kcal,
          healthy_score,
          is_featured,
          status,
          created_at,
          profiles!recipes_author_id_fkey (
            username,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecipes(data as any || []);
    } catch (err) {
      console.error('Error fetching recipes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const toggleFeatured = async (id: string, currentVal: boolean) => {
    setModalOpen(false);
    // Optimistic UI update
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, is_featured: !currentVal } : r));

    try {
      const { error } = await supabase
        .from('recipes')
        .update({ is_featured: !currentVal })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error(err);
      // Revert if error
      setRecipes(prev => prev.map(r => r.id === id ? { ...r, is_featured: currentVal } : r));
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    setModalOpen(false);
    const nextStatus = currentStatus === 'published' ? 'flagged' : 'published';
    // Optimistic UI update
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, status: nextStatus } : r));

    try {
      const { error } = await supabase
        .from('recipes')
        .update({ status: nextStatus })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error(err);
      // Revert if error
      setRecipes(prev => prev.map(r => r.id === id ? { ...r, status: currentStatus } : r));
    }
  };

  const deleteRecipe = async (id: string) => {
    setModalOpen(false);
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setRecipes(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Error deleting recipe:', err);
      alert('Failed to delete recipe. Make sure you have permission.');
    }
  };

  const filteredRecipes = recipes.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    (r.profiles?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.profiles?.username || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Recipe Catalog</h1>
          <p className="mt-2 text-zinc-400">
            Moderate community submissions, feature recipes, or purge content.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search recipes or authors..."
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
        ) : filteredRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            <span className="text-4xl mb-2">🍽️</span>
            <p>No recipes found matching your criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  <th className="px-6 py-4">Recipe</th>
                  <th className="px-6 py-4">Author</th>
                  <th className="px-6 py-4">Healthy Score</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-sm text-zinc-300">
                {filteredRecipes.map((recipe) => (
                  <tr key={recipe.id} className="hover:bg-zinc-800/20 transition-all">
                    <td className="px-6 py-4 font-semibold text-white">
                      <div className="flex flex-col">
                        <span>{recipe.title}</span>
                        <span className="text-xs text-zinc-500 font-mono mt-0.5">{recipe.kcal} kcal</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {recipe.profiles?.full_name || recipe.profiles?.username || 'Unknown Author'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Flame className="h-4 w-4 text-emerald-400" />
                        <span className="font-semibold text-emerald-400">{recipe.healthy_score}/10</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                        recipe.status === 'published'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}>
                        {recipe.status === 'published' ? 'Published' : 'Hidden / Flagged'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* Featured button */}
                        <button
                          onClick={() => openConfirm(
                            recipe.is_featured ? 'Remove Feature' : 'Feature Recipe',
                            `Are you sure you want to ${recipe.is_featured ? 'remove' : 'add'} "${recipe.title}" ${recipe.is_featured ? 'from' : 'to'} featured recipes?`,
                            'info',
                            () => toggleFeatured(recipe.id, recipe.is_featured)
                          )}
                          className={`p-2 rounded-lg border transition-all cursor-pointer ${
                            recipe.is_featured
                              ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.1)]'
                              : 'bg-zinc-950/40 border-zinc-800 text-zinc-500 hover:text-yellow-500'
                          }`}
                          title={recipe.is_featured ? 'Remove from Featured' : 'Feature Recipe'}
                        >
                          <Star className="h-4.5 w-4.5" fill={recipe.is_featured ? 'currentColor' : 'none'} />
                        </button>

                        {/* Hide / Show button */}
                        <button
                          onClick={() => openConfirm(
                            recipe.status === 'published' ? 'Hide Recipe' : 'Publish Recipe',
                            `Are you sure you want to ${recipe.status === 'published' ? 'hide' : 'publish'} "${recipe.title}"?`,
                            recipe.status === 'published' ? 'warning' : 'success',
                            () => toggleStatus(recipe.id, recipe.status)
                          )}
                          className={`p-2 rounded-lg border transition-all cursor-pointer ${
                            recipe.status === 'published'
                              ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                          title={recipe.status === 'published' ? 'Hide Recipe' : 'Show Recipe'}
                        >
                          {recipe.status === 'published' ? <ShieldAlert className="h-4.5 w-4.5" /> : <CheckCircle className="h-4.5 w-4.5" />}
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => openConfirm(
                            'Delete Recipe',
                            `Are you sure you want to permanently delete "${recipe.title}"? This action is irreversible.`,
                            'danger',
                            () => deleteRecipe(recipe.id)
                          )}
                          className="p-2 rounded-lg border bg-zinc-950/40 border-zinc-800 text-zinc-500 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all cursor-pointer"
                          title="Delete Recipe"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
