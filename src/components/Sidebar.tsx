'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { getXPProgress } from '@/lib/xp';
import {
  LayoutDashboard,
  CalendarCheck,
  Inbox,
  PlusCircle,
  BookOpen,
  Calendar,
  BarChart3,
  GraduationCap,
  Settings,
  Menu,
  X,
  Flame,
  Moon,
  Sun,
  Search,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<{ name: string; xp: number; currentStreak: number } | null>(null);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (err) {
      console.error('Error loading sidebar profile:', err);
    }
  };

  useEffect(() => {
    fetchProfile();
    // Refetch profile on focus to capture changes made in other pages
    window.addEventListener('focus', fetchProfile);
    return () => window.removeEventListener('focus', fetchProfile);
  }, [pathname]);

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Due Today', href: '/revisions', icon: CalendarCheck },
    { name: 'Revision Inbox', href: '/inbox', icon: Inbox },
    { name: 'Add Topic', href: '/add-topic', icon: PlusCircle },
    { name: 'Study Tracker', href: '/sessions', icon: BookOpen },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Placement Readiness', href: '/readiness', icon: GraduationCap },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const xpProgress = profile ? getXPProgress(profile.xp) : { level: 1, percentage: 0, xpInLevel: 0, neededXP: 500 };

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border text-foreground sticky top-0 z-40 glass-panel">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
            R
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent">
            Revise147
          </span>
        </div>
        <div className="flex items-center gap-3">
          {profile && profile.currentStreak > 0 && (
            <div className="flex items-center gap-1 text-orange-500 font-bold bg-orange-500/10 px-2 py-0.5 rounded-full text-sm animate-pulse">
              <Flame size={16} fill="currentColor" />
              <span>{profile.currentStreak}d</span>
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-md hover:bg-secondary border border-border"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-card/90 backdrop-blur-md text-foreground flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:sticky md:h-screen`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-border/50 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/40">
              R
            </div>
            <div>
              <span className="font-black text-xl tracking-tight bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent">
                Revise147
              </span>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Placement Brain</p>
            </div>
          </Link>
          <button className="md:hidden" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Level & Streak Indicator */}
        {profile && (
          <div className="p-4 mx-4 my-3 rounded-2xl bg-secondary/50 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Level {xpProgress.level}</span>
              <span className="text-xs font-bold text-indigo-500">{xpProgress.xpInLevel} / {xpProgress.neededXP} XP</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-border rounded-full h-2 overflow-hidden mb-3">
              <div
                className="bg-gradient-to-r from-indigo-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${xpProgress.percentage}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-sm font-semibold">
                <Flame size={18} className="text-orange-500" fill={profile.currentStreak > 0 ? "currentColor" : "none"} />
                <span>Streak: <strong className="text-orange-500">{profile.currentStreak} Days</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-4 py-3 overflow-y-auto space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center font-bold text-xs uppercase text-indigo-500 border border-border">
              {profile?.name ? profile.name.charAt(0) : 'A'}
            </div>
            <span className="text-xs font-semibold truncate max-w-[120px]">{profile?.name || 'Aspirant'}</span>
          </div>
          
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/50"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
}
