import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  KeyRound,
  Mail,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

const PRESET_DEMOS = [
  {
    role: 'ADMIN' as const,
    name: 'Operations Admin',
    email: 'admin@bookleaf.test',
    pass: 'Admin@123',
  },
  {
    role: 'AUTHOR' as const,
    name: 'Priya Sharma',
    email: 'priya.sharma@email.com',
    pass: 'BookLeaf@123',
  },
  {
    role: 'AUTHOR' as const,
    name: 'Sneha Kulkarni',
    email: 'sneha.kulkarni@email.com',
    pass: 'BookLeaf@123',
  },
  {
    role: 'AUTHOR' as const,
    name: 'Kavita Deshmukh',
    email: 'kavita.deshmukh@email.com',
    pass: 'BookLeaf@123',
  },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('priya.sharma@email.com');
  const [password, setPassword] = useState('BookLeaf@123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email.trim(), password);
      const rawUser = localStorage.getItem('bookleaf_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u.role === 'ADMIN') {
          navigate('/admin/tickets');
        } else {
          navigate('/author/books');
        }
      } else {
        navigate('/author/books');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setError(null);
    setLoading(true);

    try {
      await login(presetEmail, presetPass);
      const rawUser = localStorage.getItem('bookleaf_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u.role === 'ADMIN') {
          navigate('/admin/tickets');
        } else {
          navigate('/author/books');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login with selected account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-lg mx-auto space-y-8 animate-slide-up">
        {/* Brand */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-600 text-white mb-1">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            BookLeaf
          </h1>
          <p className="text-sm text-neutral-400">
            Author support & operations portal
          </p>
        </div>

        {error && (
          <div className="p-3 border border-rose-500/50 rounded-xl flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Login Personas */}
        <div className="space-y-3">
          <p className="text-xs text-neutral-500 text-center">Sign in as a demo persona</p>
          <div className="grid grid-cols-2 gap-3">
            {PRESET_DEMOS.map((demo) => (
              <button
                key={demo.email}
                onClick={() => handleQuickLogin(demo.email, demo.pass)}
                disabled={loading}
                className="flex items-center justify-between gap-3 p-4 rounded-xl border border-neutral-800 hover:border-emerald-500/60 transition-all group cursor-pointer text-left"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors truncate">
                    {demo.name}
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    {demo.role === 'ADMIN' ? 'Admin' : 'Author'}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-emerald-400 shrink-0 transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-neutral-800" />
          <button
            onClick={() => setShowManual(!showManual)}
            className="text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
          >
            {showManual ? 'Hide' : 'Or sign in with email'}
          </button>
          <div className="flex-1 h-px bg-neutral-800" />
        </div>

        {/* Manual Login (collapsible) */}
        {showManual && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-800 text-sm bg-black text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-800 text-sm bg-black text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm py-3 rounded-xl disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <p className="text-center text-[11px] text-neutral-600">
          Demo credentials: authors use <span className="text-neutral-400 font-mono">BookLeaf@123</span> · admin uses <span className="text-neutral-400 font-mono">Admin@123</span>
        </p>
      </div>
    </div>
  );
};
