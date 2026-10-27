import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layers, ArrowRight, Lock, Mail } from 'lucide-react';

const BG_IMAGES = ['/login_bg1.jpg', '/login_bg2.jpg'];
const SLIDE_DURATION = 10000;  // 10s on each image
const FADE_DURATION  = 2500;   // 2.5s smooth crossfade

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Slideshow state
  const [currentBg, setCurrentBg] = useState(0);
  const [nextBg, setNextBg] = useState(1);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      // Begin fade-out of current image
      setFading(true);

      // After fade completes, swap images and fade back in
      const swapTimer = setTimeout(() => {
        setCurrentBg((prev) => (prev + 1) % BG_IMAGES.length);
        setNextBg((prev) => (prev + 1) % BG_IMAGES.length);
        setFading(false);
      }, FADE_DURATION);

      return () => clearTimeout(swapTimer);
    }, SLIDE_DURATION);

    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="min-h-screen flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden">

      {/* Next image — always visible beneath */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${BG_IMAGES[nextBg]})`,
          zIndex: 0,
        }}
      />

      {/* Current image — fades out slowly on top */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${BG_IMAGES[currentBg]})`,
          opacity: fading ? 0 : 1,
          transition: `opacity ${FADE_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          zIndex: 1,
        }}
      />

      {/* Dark overlay for readability */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"
        style={{ zIndex: 2 }}
      />

      {/* Logo / Heading */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative" style={{ zIndex: 3 }}>
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 shadow-xl shadow-blue-500/25 ring-1 ring-white/25 mb-4">
          <Layers className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          AM DEV <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">PRO</span>
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Modular Enterprise Workplace: Worker, HR, Finance &amp; Front Desk Portals
        </p>
      </div>

      {/* Login Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative px-4" style={{ zIndex: 3 }}>
        <div className="bg-slate-900/80 border border-slate-800/90 py-7 px-6 sm:px-10 shadow-2xl rounded-2xl backdrop-blur-xl">

          {new URLSearchParams(window.location.search).get('signed_out') === 'clock_out' && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Shift ended &amp; clocked out. You have been automatically signed out.</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
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
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to AM DEV Workplace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};