'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  LayoutDashboard, 
  MessageSquareWarning, 
  ChefHat, 
  BookOpen, 
  Send, 
  LogOut, 
  User, 
  Menu, 
  X 
} from 'lucide-react';

import ConfirmModal from './ConfirmModal';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

const sidebarItems: SidebarItem[] = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Recipes', href: '/recipes', icon: BookOpen },
  { name: 'Flagged Comments', href: '/moderation', icon: MessageSquareWarning },
  { name: 'Creators', href: '/creators', icon: ChefHat },
  { name: 'Manual Push', href: '/push', icon: Send },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userUsername, setUserUsername] = useState<string | null>(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Only show full loader if we haven't fetched profile yet
      if (userName === null && pathname !== '/login') {
        setLoading(true);
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        if (pathname !== '/login') {
          router.replace('/login');
        } else {
          setLoading(false);
        }
        return;
      }

      // If we already have the profile data, don't refetch on every tab switch
      if (userName !== null) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, full_name, username')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        await supabase.auth.signOut();
        if (pathname !== '/login') {
          router.replace('/login');
        } else {
          setLoading(false);
        }
        return;
      }

      setIsAdmin(true);
      setUserName(profile.full_name || profile.username || 'Admin');
      setUserUsername(profile.username || null);
      setLoading(false);

      if (pathname === '/login') {
        router.replace('/');
      }
    };

    checkAuth();
  }, [pathname, router, userName]);

  const handleSignOut = async () => {
    setShowSignOutConfirm(false);
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
          <p className="text-zinc-400 text-sm font-medium">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  // Bypass layout for login page
  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-zinc-950 text-white font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-zinc-900 border-r border-zinc-800/80">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo Section */}
          <div className="flex items-center h-16 px-6 border-b border-zinc-800/80">
            
            <span className="font-bold text-lg tracking-wide bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              ChowBase Admin
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            {sidebarItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    active 
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
                      : 'border border-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${active ? 'text-emerald-400' : 'text-zinc-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Section & Logout */}
          <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/20">
            <div className="flex items-center px-4 py-3 mb-3 bg-zinc-950/40 rounded-xl border border-zinc-800/50">
              <User className="h-5 w-5 text-emerald-500 mr-3" />
              <div className="truncate">
                <p className="text-sm font-semibold text-zinc-200 truncate">{userName}</p>
                <p className="text-xs text-zinc-500">@{userUsername || 'admin'}</p>
              </div>
            </div>
            <button
              onClick={() => setShowSignOutConfirm(true)}
              className="flex w-full items-center px-4 py-3 rounded-xl text-sm font-medium border border-red-500/10 text-red-400 hover:bg-red-500/5 hover:border-red-500/20 transition-all cursor-pointer"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Sidebar - Mobile Header & Menu */}
      <div className="md:hidden flex flex-col w-full">
        <header className="flex items-center justify-between h-16 px-6 bg-zinc-900 border-b border-zinc-800/80 sticky top-0 z-30">
          <div className="flex items-center">
            <span className="text-2xl mr-2">🍳</span>
            <span className="font-bold text-lg tracking-wide text-white">ChowBase Admin</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </header>

        {/* Mobile Navigation Drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-20 flex md:hidden">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setSidebarOpen(false)}
            />
            {/* Sidebar drawer content */}
            <div className="relative flex flex-col flex-1 w-full max-w-xs bg-zinc-900 border-r border-zinc-800/80">
              <div className="flex items-center h-16 px-6 border-b border-zinc-800/80">
              
                <span className="font-bold text-lg tracking-wide">ChowBase Admin</span>
              </div>
              <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                {sidebarItems.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        active 
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                          : 'border border-transparent text-zinc-400 hover:bg-zinc-800/50'
                      }`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/20">
                <div className="flex items-center px-4 py-3 mb-3 bg-zinc-950/40 rounded-xl border border-zinc-800/50">
                  <User className="h-5 w-5 text-emerald-500 mr-3" />
                  <div className="truncate">
                    <p className="text-sm font-semibold text-zinc-200 truncate">{userName}</p>
                    <p className="text-xs text-zinc-500">@{userUsername || 'admin'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSignOutConfirm(true)}
                  className="flex w-full items-center px-4 py-3 rounded-xl text-sm font-medium border border-red-500/10 text-red-400 hover:bg-red-500/5 transition-all cursor-pointer"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Confirm Sign Out Modal */}
      <ConfirmModal
        isOpen={showSignOutConfirm}
        title="Sign Out"
        message="Are you sure you want to log out of the ChowBase Admin Dashboard?"
        confirmText="Sign Out"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleSignOut}
        onCancel={() => setShowSignOutConfirm(false)}
      />
    </div>
  );
}
