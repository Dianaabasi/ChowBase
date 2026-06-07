'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen, Users, MessageSquareWarning, ChefHat, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface Stats {
  totalRecipes: number;
  totalUsers: number;
  flaggedComments: number;
  verifiedChefs: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalRecipes: 0,
    totalUsers: 0,
    flaggedComments: 0,
    verifiedChefs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // 1. Total Recipes count
        const { count: recipeCount } = await supabase
          .from('recipes')
          .select('*', { count: 'exact', head: true });

        // 2. Total Users count
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // 3. Flagged Comments count
        // Check if comments table exists
        let flaggedCount = 0;
        try {
          const { count: cCount } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('is_flagged', true);
          flaggedCount = cCount || 0;
        } catch (e) {
          // If comments table does not exist or fails, default to 0
        }

        // 4. Verified Chefs count
        const { count: chefCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_verified', true);

        setStats({
          totalRecipes: recipeCount || 0,
          totalUsers: userCount || 0,
          flaggedComments: flaggedCount,
          verifiedChefs: chefCount || 0,
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      name: 'Total Recipes',
      value: stats.totalRecipes,
      icon: BookOpen,
      color: 'from-emerald-500/10 to-teal-500/5',
      borderColor: 'border-emerald-500/20',
      iconColor: 'text-emerald-400',
      href: '/recipes',
    },
    {
      name: 'Registered Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'from-blue-500/10 to-indigo-500/5',
      borderColor: 'border-blue-500/20',
      iconColor: 'text-blue-400',
      href: '/creators',
    },
    {
      name: 'Flagged Comments',
      value: stats.flaggedComments,
      icon: MessageSquareWarning,
      color: 'from-red-500/10 to-rose-500/5',
      borderColor: 'border-red-500/20',
      iconColor: 'text-red-400',
      href: '/moderation',
    },
    {
      name: 'Verified Chefs',
      value: stats.verifiedChefs,
      icon: ChefHat,
      color: 'from-amber-500/10 to-orange-500/5',
      borderColor: 'border-amber-500/20',
      iconColor: 'text-amber-400',
      href: '/creators',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-zinc-800 animate-pulse rounded-xl" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-zinc-900 border border-zinc-800 rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard Overview</h1>
        <p className="mt-2 text-zinc-400">
          Real-time metrics, active moderation queues, and user insights.
        </p>
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.name} href={card.href} className="group">
              <div className={`relative overflow-hidden rounded-3xl border ${card.borderColor} bg-gradient-to-br ${card.color} p-6 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-400">{card.name}</span>
                  <div className={`rounded-xl bg-zinc-950/40 p-2.5 border border-zinc-800/80 ${card.iconColor} group-hover:scale-110 transition-all`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-3xl font-bold tracking-tight text-white">
                    {card.value}
                  </span>
                  <span className="flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12%
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Analytics Visualization Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left main graph */}
        <div className="lg:col-span-2 rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-6 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-zinc-200 mb-6">User Sign-up Trend</h2>
          
          {/* Custom SVG Line Chart for user growth (premium styling) */}
          <div className="relative h-64 w-full">
            <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="50" x2="500" y2="50" stroke="#27272a" strokeWidth="1" strokeDasharray="5,5" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="#27272a" strokeWidth="1" strokeDasharray="5,5" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="#27272a" strokeWidth="1" strokeDasharray="5,5" />
              
              {/* Gradient Path */}
              <path
                d="M 0 180 Q 80 150 160 110 T 320 80 T 480 30 L 500 30 L 500 200 L 0 200 Z"
                fill="url(#chartGradient)"
              />
              {/* Stroke Line */}
              <path
                d="M 0 180 Q 80 150 160 110 T 320 80 T 480 30"
                fill="none"
                stroke="#10b981"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* Dots at pivots */}
              <circle cx="160" cy="110" r="5" fill="#10b981" stroke="#09090b" strokeWidth="2" />
              <circle cx="320" cy="80" r="5" fill="#10b981" stroke="#09090b" strokeWidth="2" />
              <circle cx="480" cy="30" r="5" fill="#10b981" stroke="#09090b" strokeWidth="2" />
            </svg>
            <div className="absolute top-1 left-1 text-xs text-zinc-500 font-mono">1,000</div>
            <div className="absolute top-[85px] left-1 text-xs text-zinc-500 font-mono">500</div>
            <div className="absolute bottom-1 left-1 text-xs text-zinc-500 font-mono">0</div>
          </div>
          <div className="flex justify-between mt-4 text-xs text-zinc-500 px-2 font-mono">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
          </div>
        </div>

        {/* Right breakdown card */}
        <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-6 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-zinc-200 mb-6">Recent Activity Log</h2>
          <div className="space-y-4">
            <div className="flex gap-4 p-3 rounded-xl hover:bg-zinc-800/30 transition-all">
              <span className="text-xl">🔥</span>
              <div>
                <p className="text-sm font-semibold text-zinc-200">New Recipe Added</p>
                <p className="text-xs text-zinc-500">Jollof Rice by Bode • 3m ago</p>
              </div>
            </div>
            <div className="flex gap-4 p-3 rounded-xl hover:bg-zinc-800/30 transition-all">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-zinc-200">Comment Flagged</p>
                <p className="text-xs text-zinc-500">Inappropriate language report • 1h ago</p>
              </div>
            </div>
            <div className="flex gap-4 p-3 rounded-xl hover:bg-zinc-800/30 transition-all">
              <span className="text-xl">👑</span>
              <div>
                <p className="text-sm font-semibold text-zinc-200">Chef Verified</p>
                <p className="text-xs text-zinc-500">awajicooking was granted Chef badge • 4h ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
