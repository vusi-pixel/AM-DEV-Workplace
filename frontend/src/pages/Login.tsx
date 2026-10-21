import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layers, ShieldCheck, UserCheck, ArrowRight, Lock, Mail, Sparkles, Building2, Laptop } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setError(null);
    setLoading(true);
    try {
      await login(quickEmail, quickPass);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 shadow-xl shadow-blue-500/25 ring-1 ring-white/25 mb-4">
          <Layers className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          AM DEV <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">PRO</span>
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Enterprise Corporate Operations & Workplace Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-900/90 border border-slate-800/90 py-8 px-6 sm:px-10 shadow-2xl rounded-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@amdev.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-semibold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Workplace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 mb-3 text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                1-Click Demo Accounts
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@amdev.com', 'Admin123!')}
                className="p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between text-left group transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-rose-400" />
                  <div>
                    <span className="font-medium text-slate-200">System Admin</span>
                    <span className="text-[10px] text-slate-400 block">admin@amdev.com</span>
                  </div>
                </div>
                <span className="text-[10px] text-blue-400 group-hover:translate-x-0.5 transition-transform">Login →</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('hr@amdev.com', 'Admin123!')}
                className="p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between text-left group transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="font-medium text-slate-200">HR Manager</span>
                    <span className="text-[10px] text-slate-400 block">hr@amdev.com</span>
                  </div>
                </div>
                <span className="text-[10px] text-blue-400 group-hover:translate-x-0.5 transition-transform">Login →</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('hybrid.emp@amdev.com', 'Admin123!')}
                className="p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between text-left group transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Laptop className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="font-medium text-slate-200">Hybrid Software Engineer</span>
                    <span className="text-[10px] text-slate-400 block">hybrid.emp@amdev.com</span>
                  </div>
                </div>
                <span className="text-[10px] text-blue-400 group-hover:translate-x-0.5 transition-transform">Login →</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('employee@amdev.com', 'Admin123!')}
                className="p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between text-left group transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-purple-400" />
                  <div>
                    <span className="font-medium text-slate-200">On-Site Developer</span>
                    <span className="text-[10px] text-slate-400 block">employee@amdev.com</span>
                  </div>
                </div>
                <span className="text-[10px] text-blue-400 group-hover:translate-x-0.5 transition-transform">Login →</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
