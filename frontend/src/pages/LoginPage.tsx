import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, KeyRound, Mail, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

const PRESET_DEMOS = [
  {
    role: 'ADMIN',
    title: 'Operations Admin',
    desc: 'Triage queue, AI draft, internal notes',
    email: 'admin@bookleaf.test',
    pass: 'Admin@123',
    badge: 'Operations HQ',
  },
  {
    role: 'AUTHOR',
    title: 'Priya Sharma (AUTH001)',
    desc: '2 published books · ₹3,570 pending payout',
    email: 'priya.sharma@email.com',
    pass: 'BookLeaf@123',
    badge: 'Published Author',
  },
  {
    role: 'AUTHOR',
    title: 'Sneha Kulkarni (AUTH007)',
    desc: 'BK013 in Cover Design production stage',
    email: 'sneha.kulkarni@email.com',
    pass: 'BookLeaf@123',
    badge: 'Pipeline Book',
  },
  {
    role: 'AUTHOR',
    title: 'Kavita Deshmukh (AUTH009)',
    desc: 'BK016 has ₹850 rollover (< ₹1,000 threshold)',
    email: 'kavita.deshmukh@email.com',
    pass: 'BookLeaf@123',
    badge: 'Rollover Notice',
  },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('priya.sharma@email.com');
  const [password, setPassword] = useState('BookLeaf@123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'demo' | 'manual'>('demo');

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
    <div className="min-h-[88vh] flex items-center justify-center py-10 px-4 sm:px-6">
      <div className="max-w-xl w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white mx-auto shadow-md shadow-emerald-500/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            BookLeaf Portal
          </h1>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Author support, royalty tracking, and operations communication platform.
          </p>
        </div>

        {/* Clean Container Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg shadow-slate-100 p-6 sm:p-8 space-y-6">
          {/* Segmented Control: 1-Click Demo vs Manual Sign In */}
          <div className="flex bg-slate-100/80 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('demo')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'demo'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              1-Click Demo Personas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'manual'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Custom Email Sign In
            </button>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'demo' ? (
            /* 1-Click Demo Persona Grid (Instant Access) */
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-500 mb-2">
                Click any role to log in immediately and test the system:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRESET_DEMOS.map((demo) => {
                  const isAdmin = demo.role === 'ADMIN';
                  return (
                    <button
                      key={demo.email}
                      type="button"
                      disabled={loading}
                      onClick={() => handleQuickLogin(demo.email, demo.pass)}
                      className={`text-left p-4 rounded-2xl border transition-all hover:scale-[1.01] flex flex-col justify-between group ${
                        isAdmin
                          ? 'bg-indigo-50/50 hover:bg-indigo-50 border-indigo-200/80 hover:border-indigo-300'
                          : 'bg-emerald-50/40 hover:bg-emerald-50 border-emerald-200/80 hover:border-emerald-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {demo.title}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              isAdmin
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {demo.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">{demo.desc}</p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200/50 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                        <span className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                          {demo.email}
                        </span>
                        <span className="flex items-center gap-1 text-emerald-600 group-hover:translate-x-0.5 transition-transform text-xs">
                          Enter <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Manual Email / Password Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter author or admin email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm py-3 rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
              >
                {loading ? 'Authenticating...' : 'Sign In to Portal'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="text-center text-[11px] text-slate-400 pt-1 border-t border-slate-100">
            Seeded for evaluation: all authors use <span className="font-mono text-slate-600">BookLeaf@123</span> · admin uses <span className="font-mono text-slate-600">Admin@123</span>
          </div>
        </div>
      </div>
    </div>
  );
};
