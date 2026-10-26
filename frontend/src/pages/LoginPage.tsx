import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, KeyRound, Mail, AlertCircle, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('priya.sharma@email.com');
  const [password, setPassword] = useState('BookLeaf@123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email.trim(), password);
      // Auth context sets user; redirect according to role
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

  const setTestCredentials = (testEmail: string, testPass: string) => {
    setEmail(testEmail);
    setPassword(testPass);
    setError(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Branding Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-500/30 mb-4">
            <BookOpen className="w-7 h-7" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            BookLeaf Portal
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to access author dashboard or operations support queue
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/40 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

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
                  placeholder="author@email.com or admin@bookleaf.test"
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
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick-Fill Buttons for Evaluation */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
              Evaluator Quick-Fill Credentials
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setTestCredentials('admin@bookleaf.test', 'Admin@123')}
                className="p-2 text-left rounded-xl bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-200/80 text-indigo-900 transition-colors"
              >
                <div className="font-bold flex items-center gap-1 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  Admin
                </div>
                <div className="text-[10px] text-indigo-700 truncate">admin@bookleaf.test</div>
              </button>

              <button
                type="button"
                onClick={() => setTestCredentials('priya.sharma@email.com', 'BookLeaf@123')}
                className="p-2 text-left rounded-xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/80 text-emerald-900 transition-colors"
              >
                <div className="font-bold flex items-center gap-1 text-[11px]">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Author 1
                </div>
                <div className="text-[10px] text-emerald-700 truncate">priya.sharma@email.com</div>
              </button>

              <button
                type="button"
                onClick={() => setTestCredentials('sneha.kulkarni@email.com', 'BookLeaf@123')}
                className="p-2 text-left rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition-colors"
              >
                <div className="font-bold text-[11px]">Author 7 (BK013)</div>
                <div className="text-[10px] text-slate-500 truncate">sneha.kulkarni@email.com</div>
              </button>

              <button
                type="button"
                onClick={() => setTestCredentials('kavita.deshmukh@email.com', 'BookLeaf@123')}
                className="p-2 text-left rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition-colors"
              >
                <div className="font-bold text-[11px]">Author 9 (BK015)</div>
                <div className="text-[10px] text-slate-500 truncate">kavita.deshmukh@email.com</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
