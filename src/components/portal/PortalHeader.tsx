import React from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { GraduationCap, LogOut, Shield, UserCheck, Users, Home, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SCHOOL } from '../../data/site';
import { isSupabaseConfigured } from '../../lib/supabase';
import { toast } from 'sonner';

interface PortalHeaderProps {
  title: string;
}

export function PortalHeader({ title }: PortalHeaderProps) {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
    navigate({ to: '/portal/login' });
  };

  const roleBadgeColor =
    role === 'admin'
      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200'
      : role === 'teacher'
      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200'
      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200';

  const RoleIcon = role === 'admin' ? Shield : role === 'teacher' ? UserCheck : Users;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-card/90 backdrop-blur-md shadow-soft">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Left: Brand logo & Page title */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
            <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
              <GraduationCap className="size-5" />
            </span>
            <div className="hidden sm:block">
              <span className="block text-sm font-bold tracking-tight text-primary">
                {SCHOOL.shortName} Portal
              </span>
              <span className="block text-[10px] font-medium text-muted-foreground">
                School Management System
              </span>
            </div>
          </Link>

          <div className="h-6 w-px bg-border/80 mx-1 hidden sm:block" />

          <div>
            <h1 className="text-base font-bold text-foreground sm:text-lg leading-tight">
              {title}
            </h1>
          </div>
        </div>

        {/* Right: User Profile, Role Badge, Return to Public site & Logout */}
        <div className="flex items-center gap-3">
          {!isSupabaseConfigured && (
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-amber-300/80 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              <Info className="size-3.5 text-amber-600" />
              Demo Mode Active
            </span>
          )}

          {profile && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="size-9 rounded-full object-cover border border-primary/20 shadow-xs"
                  />
                ) : (
                  <div className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary font-bold text-sm border border-primary/20">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-foreground line-clamp-1">
                    {profile.full_name}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.2 text-[10px] font-medium uppercase tracking-wider ${roleBadgeColor}`}
                  >
                    <RoleIcon className="size-3" />
                    {role === 'parent' ? 'STUDENT' : role?.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="h-6 w-px bg-border/80" />

              <Link
                to="/"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Return to Public Website"
              >
                <Home className="size-4" />
                <span className="hidden md:inline">Main Website</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
                title="Log Out"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
