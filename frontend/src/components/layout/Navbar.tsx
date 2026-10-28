import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, LifeBuoy, PlusCircle, LogOut, ChevronDown, UserCheck, LayoutDashboard } from 'lucide-react';

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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuickSwitch = async (email: string, targetRole: string) => {
    try {
      const password = targetRole === 'ADMIN' ? 'Admin@123' : 'BookLeaf@123';
      await login(email, password);
      setIsProfileOpen(false);
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
    <nav className="bg-black border-b border-neutral-900 sticky top-0 z-40 shadow-xl w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 w-full">
          {/* 1. LEFT: Logo */}
          <div className="flex items-center flex-1 justify-start">
            <Link to={isAdmin ? '/admin/tickets' : '/author/books'} className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-tight tracking-tight text-white flex items-center">
                  BookLeaf <span className="text-emerald-400 font-semibold text-xs tracking-normal uppercase ml-1 px-1.5 py-0.5 bg-black rounded border border-emerald-800/80">Portal</span>
                </span>
                <span className="text-[11px] text-neutral-400 font-medium hidden sm:inline">Author Support & Operations</span>
              </div>
            </Link>
          </div>

          {/* 2. CENTRE: Navigation Menu Items */}
          {user && (
            <div className="hidden md:flex items-center justify-center space-x-2 flex-1">
              {user.role === 'AUTHOR' ? (
                <>
                  <Link
                    to="/author/books"
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      isActive('/author/books')
                        ? 'bg-black text-emerald-400 border border-emerald-600/60 shadow-xs'
                        : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
                    }`}
                  >
                    My Books
                  </Link>
                  <Link
                    to="/author/tickets"
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                      isActive('/author/tickets')
                        ? 'bg-black text-emerald-400 border border-emerald-600/60 shadow-xs'
                        : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
                    }`}
                  >
                    <LifeBuoy className="w-4 h-4" />
                    My Tickets
                  </Link>
                  <Link
                    to="/author/tickets/new"
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                      isActive('/author/tickets/new')
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-emerald-400 bg-black hover:bg-neutral-900 border border-emerald-800/80'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    New Ticket
                  </Link>
                </>
              ) : (
                <Link
                  to="/admin/tickets"
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                    isActive('/admin/tickets')
                      ? 'bg-black text-indigo-400 border border-indigo-600/60 shadow-xs'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Admin Dashboard
                </Link>
              )}
            </div>
          )}

          {/* 3. RIGHT: Profile Button & Details Dropdown */}
          <div className="flex items-center justify-end flex-1 gap-3">
            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-black hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all group cursor-pointer"
                  aria-expanded={isProfileOpen}
                  title="Open user profile and options"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-semibold text-white leading-tight group-hover:text-emerald-400 transition-colors">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      {user.role}
                    </div>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180 text-emerald-400' : ''}`} />
                </button>

                {/* Profile Details Dropdown Card */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-black rounded-2xl shadow-2xl border border-neutral-800 p-4 z-50 animate-scale-in">
                    {/* User Profile Header */}
                    <div className="flex items-center gap-3 pb-3 border-b border-neutral-800">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-lg flex items-center justify-center shadow-md">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-white truncate">{user.name}</div>
                        <div className="text-xs text-neutral-400 truncate">{user.email}</div>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mt-1 inline-block ${
                            user.role === 'ADMIN'
                              ? 'bg-black text-indigo-400 border border-indigo-600/60'
                              : 'bg-black text-emerald-400 border border-emerald-600/60'
                          }`}
                        >
                          {user.role}
                        </span>
                      </div>
                    </div>

                    {/* Profile Metadata */}
                    <div className="py-2.5 space-y-1.5 text-xs border-b border-neutral-900">
                      {user.authorCode && (
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500">Author Code:</span>
                          <span className="font-mono text-white bg-neutral-900 px-2 py-0.5 rounded text-[11px]">
                            {user.authorCode}
                          </span>
                        </div>
                      )}
                      {user.city && (
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500">Location:</span>
                          <span className="text-neutral-300">{user.city}</span>
                        </div>
                      )}
                      {user.phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500">Phone:</span>
                          <span className="text-neutral-300">{user.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Switch Demo Persona (Admin Only) */}
                    {isAdmin && (
                      <div className="py-2.5 border-b border-neutral-800">
                        <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-emerald-400" />
                          <span>Switch Demo Persona</span>
                        </div>
                        <div className="space-y-1">
                          {TEST_ACCOUNTS.map((acc) => (
                            <button
                              key={acc.email}
                              onClick={() => handleQuickSwitch(acc.email, acc.role)}
                              className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex flex-col transition-colors ${
                                user.email === acc.email
                                  ? 'bg-neutral-900 font-semibold text-emerald-400 border border-neutral-700'
                                  : 'text-neutral-300 hover:bg-neutral-900'
                              }`}
                            >
                              <span>{acc.label}</span>
                              <span className="text-[10px] text-neutral-500">{acc.email}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Logout Button */}
                    <div className="pt-3">
                      <button
                        onClick={() => {
                          logout();
                          navigate('/login');
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-rose-950/60 text-neutral-300 hover:text-rose-300 border border-neutral-800 hover:border-rose-800/80 text-xs font-semibold transition-all group cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                        <span>Sign Out of Portal</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 px-4 py-2 bg-neutral-900 rounded-xl border border-neutral-800"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
