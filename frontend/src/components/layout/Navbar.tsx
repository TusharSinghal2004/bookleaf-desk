import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, LifeBuoy, PlusCircle, Shield, LogOut, ChevronDown, UserCheck } from 'lucide-react';

const TEST_ACCOUNTS = [
  { label: 'Admin (Operations)', email: 'admin@bookleaf.test', role: 'ADMIN' },
  { label: 'Priya Sharma (AUTH001 - Published)', email: 'priya.sharma@email.com', role: 'AUTHOR' },
  { label: 'Sneha Kulkarni (AUTH007 - Has BK013 In Production)', email: 'sneha.kulkarni@email.com', role: 'AUTHOR' },
  { label: 'Kavita Deshmukh (AUTH009 - Has BK015 & <₹1k Rollover)', email: 'kavita.deshmukh@email.com', role: 'AUTHOR' },
  { label: 'Ananya Reddy (AUTH003 - Zero Payout Yet)', email: 'ananya.reddy@email.com', role: 'AUTHOR' },
];

export const Navbar: React.FC = () => {
  const { user, logout, login, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  const handleQuickSwitch = async (email: string, targetRole: string) => {
    try {
      const password = targetRole === 'ADMIN' ? 'Admin@123' : 'BookLeaf@123';
      await login(email, password);
      setIsSwitcherOpen(false);
      if (targetRole === 'ADMIN') {
        navigate('/admin/tickets');
      } else {
        navigate('/author/books');
      }
    } catch (err) {
      console.error('Quick switch failed:', err);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-8">
            <Link to={isAdmin ? '/admin/tickets' : '/author/books'} className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-tight tracking-tight text-slate-900">
                  BookLeaf <span className="text-emerald-600 font-semibold text-xs tracking-normal uppercase ml-1 px-1.5 py-0.5 bg-emerald-50 rounded border border-emerald-200">Portal</span>
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Author Support & Operations</span>
              </div>
            </Link>

            {user && (
              <div className="hidden md:flex items-center space-x-1">
                {user.role === 'AUTHOR' ? (
                  <>
                    <Link
                      to="/author/books"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive('/author/books')
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      My Books
                    </Link>
                    <Link
                      to="/author/tickets"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        isActive('/author/tickets')
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <LifeBuoy className="w-4 h-4" />
                      My Tickets
                    </Link>
                    <Link
                      to="/author/tickets/new"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        isActive('/author/tickets/new')
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                    >
                      <PlusCircle className="w-4 h-4" />
                      New Ticket
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/admin/tickets"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      isActive('/admin/tickets')
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    Support Queue
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* User Controls & Demo Switcher */}
          {user ? (
            <div className="flex items-center gap-3">
              {/* Quick Persona Switcher for Evaluators */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-all"
                  title="Switch accounts for testing"
                >
                  <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Switch Demo User</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isSwitcherOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1">
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Switch Test Account
                    </div>
                    {TEST_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.email}
                        onClick={() => handleQuickSwitch(acc.email, acc.role)}
                        className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-slate-50 transition-colors ${
                          user.email === acc.email ? 'bg-emerald-50/70 font-semibold text-emerald-900' : 'text-slate-700'
                        }`}
                      >
                        <span>{acc.label}</span>
                        <span className="text-[10px] text-slate-400">{acc.email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Current User Badge */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</div>
                  <div className="text-[10px] text-slate-500">{user.email}</div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    user.role === 'ADMIN'
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {user.role}
                </span>
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center">
              <Link
                to="/login"
                className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 px-3 py-1.5"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
