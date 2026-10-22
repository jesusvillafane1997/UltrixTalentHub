'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { loginUser, registerUser } from '@/actions/auth';
import { UserRole } from '@/types/database';
import {
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  AlertCircle,
  User,
  Shield,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('hr_manager');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await loginUser(loginEmail, loginPassword);
      if (!res.success || !res.user) {
        setError(res.error || 'Failed to authenticate user.');
        setIsSubmitting(false);
        return;
      }

      login(res.user);
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during login.');
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = regEmail.trim().toLowerCase();
    if (!cleanEmail.endsWith('@ultrix.digital')) {
      setError(
        'Corporate constraint: Email must end in @ultrix.digital (e.g. yourname@ultrix.digital). To allow all email domains (e.g. @gmail.com), run "ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_check;" in your Supabase SQL editor.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await registerUser({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
      });

      if (!res.success || !res.user) {
        setError(res.error || 'Failed to create user account.');
        setIsSubmitting(false);
        return;
      }

      login(res.user);
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during registration.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 text-slate-950 font-black text-2xl shadow-xl shadow-cyan-500/20 ring-1 ring-white/20 mb-1">
            <span>U</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Ultrix Talent Hub
          </h1>
          <p className="text-xs font-mono text-slate-400">
            Internal Staff Augmentation &amp; Recruiting ATS
          </p>
        </div>

        {/* Main Card with Tabs */}
        <div className="metallic-surface rounded-2xl p-6 border border-white/[0.12] shadow-2xl space-y-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#121622] border border-white/[0.08]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={cn(
                'py-2 text-xs font-bold rounded-lg transition-all text-center cursor-pointer',
                mode === 'login'
                  ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={cn(
                'py-2 text-xs font-bold rounded-lg transition-all text-center cursor-pointer',
                mode === 'register'
                  ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="david@ultrix.digital"
                  required
                  className="w-full h-10 px-3.5 rounded-xl bg-[#131620] border border-white/[0.12] focus:border-cyan-400 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 transition-all font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Password</span>
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-10 px-3.5 rounded-xl bg-[#131620] border border-white/[0.12] focus:border-cyan-400 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 transition-all font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 mt-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Authenticating...' : 'Log In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  className="text-xs text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Don't have an account? <strong className="text-cyan-300">Create one</strong>
                </button>
              </div>
            </form>
          )}

          {/* Register / User Creation Form */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Elena Rostova"
                  required
                  className="w-full h-10 px-3.5 rounded-xl bg-[#131620] border border-white/[0.12] focus:border-cyan-400 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Email Address</span>
                  </label>
                  <span className="text-[10px] font-mono text-cyan-400">@ultrix.digital</span>
                </div>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@ultrix.digital"
                  required
                  className="w-full h-10 px-3.5 rounded-xl bg-[#131620] border border-white/[0.12] focus:border-cyan-400 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 transition-all font-mono"
                />
                <p className="text-[10px] text-slate-400 font-mono">
                  Corporate staff domain: <span className="text-cyan-300 font-bold">@ultrix.digital</span>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Password</span>
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#131620] border border-white/[0.12] focus:border-cyan-400 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 transition-all font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  <span>Role Assignment</span>
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as UserRole)}
                  className="w-full h-10 px-3 rounded-xl bg-[#131620] border border-white/[0.12] focus:border-cyan-400 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 transition-all cursor-pointer"
                >
                  <option value="hr_manager">HR Manager (Full workforce &amp; candidate data)</option>
                  <option value="recruiter">Recruiter (ATS pipelines &amp; talent pool)</option>
                  <option value="account_manager">Account Manager (Clients &amp; placed talent)</option>
                  <option value="viewer">Viewer (Read-only observer)</option>
                  <option value="admin">Admin (Ops Lead / full access)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 mt-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Creating User...' : 'Create Account & Log In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="text-xs text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Already have an account? <strong className="text-cyan-300">Log In</strong>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security Telemetry Footer */}
        <div className="flex items-center justify-center gap-4 text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            <span>Supabase DB: Connected</span>
          </div>
          <span>&bull;</span>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Role-Based Security</span>
          </div>
        </div>
      </div>
    </div>
  );
}
