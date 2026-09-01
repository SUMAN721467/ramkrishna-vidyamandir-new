import React, { useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { GraduationCap, Eye, EyeOff, Lock, Smartphone, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SCHOOL } from '../../data/site';
import { toast } from 'sonner';

export const Route = createFileRoute('/portal/login')({
  component: PortalLoginPage,
});

function PortalLoginPage() {
  const { signIn, role: activeRole } = useAuth();
  const navigate = useNavigate();

  // Form Fields
  const [identifier, setIdentifier] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('rkvm_remembered_identifier') || '';
    }
    return '';
  });
  const [password, setPassword] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('rkvm_remembered_password') || '';
    }
    return '';
  });
  const [rememberMe, setRememberMe] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('rkvm_remember_me') !== 'false';
    }
    return true;
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.error('Please enter both Mobile Number / Email and Password.');
      return;
    }

    if (rememberMe) {
      localStorage.setItem('rkvm_remember_me', 'true');
      localStorage.setItem('rkvm_remembered_identifier', identifier.trim());
      localStorage.setItem('rkvm_remembered_password', password);
    } else {
      localStorage.setItem('rkvm_remember_me', 'false');
      localStorage.removeItem('rkvm_remembered_identifier');
      localStorage.removeItem('rkvm_remembered_password');
    }

    setLoading(true);
    const res = await signIn(identifier, password);
    setLoading(false);

    if (res.success) {
      toast.success('Logged in successfully!');
      if (res.role === 'admin') navigate({ to: '/portal/admin' });
      else if (res.role === 'teacher') navigate({ to: '/portal/teacher' });
      else navigate({ to: '/portal/parent' });
    } else {
      toast.error(res.error || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background via-muted/30 to-background">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-3">
            <span className="grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lift">
              <GraduationCap className="size-8" />
            </span>
          </Link>

          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {SCHOOL.name}
          </h2>
          <p className="text-xs font-medium text-muted-foreground">
            School Management & Security Portal
          </p>
        </div>

        {/* Protection Banner Notice */}
        <div className="rounded-2xl border border-amber-300/80 bg-amber-50 dark:bg-amber-950/30 p-3.5 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
          <AlertCircle className="size-4 shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Authorized Access Only</p>
            <p className="text-[11px] leading-relaxed">
              Student and Teacher accounts are created exclusively by School Admin. Please log in using your Mobile Number or Email provided to the school administration.
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="rounded-3xl border border-border bg-card p-8 shadow-lift space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <KeyRound className="size-4 text-primary" />
              Portal Account Login
            </h3>
            <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              Admin • Teacher • Student
            </span>
          </div>

          {/* SIGN IN FORM */}
          <form className="space-y-4" onSubmit={handleLoginSubmit} autoComplete="off">
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Mobile Number / Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <Smartphone className="size-4" />
                </div>
                <input
                  type="text"
                  name="user_identifier_login"
                  id="portal-user-identifier"
                  autoComplete="off"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter Mobile Number or Email"
                  className="block w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <Lock className="size-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="user_password_login"
                  id="portal-user-password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-input bg-background pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="size-4 rounded border-input text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                />
                Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 px-4 text-sm font-bold text-primary-foreground shadow-soft hover:bg-primary-dark transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="size-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <>
                  Sign In to Portal
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center">
          <Link to="/" className="text-xs font-semibold text-primary hover:underline">
            ← Return to Ramkrishna Vidyamandir Public Website
          </Link>
        </div>
      </div>
    </div>
  );
}
