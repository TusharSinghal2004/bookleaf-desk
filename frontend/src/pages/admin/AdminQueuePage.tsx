import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchAdminTickets } from '../../api/admin';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen,
  Sparkles,
  RefreshCw,
  Search,
  User,
  Calendar,
  MessageSquare,
  ArrowRight,
  LayoutList,
  Table as TableIcon,
  LayoutDashboard,
} from 'lucide-react';

const CATEGORIES = [
  'ALL',
  'ROYALTY_AND_PAYMENTS',
  'ISBN_AND_METADATA_ISSUES',
  'PRINTING_AND_QUALITY',
  'DISTRIBUTION_AND_AVAILABILITY',
  'BOOK_STATUS_AND_PRODUCTION_UPDATES',
  'GENERAL_INQUIRY',
  'UNCLASSIFIED',
];

const PRIORITIES = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNSET'];
const STATUSES = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export const AdminQueuePage: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [priority, setPriority] = useState('ALL');
  const [assignmentFilter, setAssignmentFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const {
    data: tickets,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['adminTickets', status, category, priority, assignmentFilter],
    queryFn: () =>
      fetchAdminTickets({
        status: status === 'ALL' ? undefined : status,
        category: category === 'ALL' ? undefined : category,
        priority: priority === 'ALL' ? undefined : priority,
        assigned_to:
          assignmentFilter === 'ME'
            ? user?.id
            : assignmentFilter === 'UNASSIGNED'
            ? 'unassigned'
            : undefined,
      }),
    refetchInterval: 15000,
  });

  const renderPriorityBadge = (p: string) => {
    switch (p) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-950/70 text-rose-300 border border-rose-500/50">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Critical
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-950/70 text-amber-300 border border-amber-500/50">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            High
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-950/50 text-blue-300 border border-blue-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Medium
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-neutral-900 text-neutral-400 border border-neutral-800">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
            Low
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-neutral-500">
            Unset
          </span>
        );
    }
  };

  const renderStatusBadge = (s: string) => {
    switch (s) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40">
            Open
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold text-indigo-300 bg-indigo-950/60 border border-indigo-500/40">
            In Progress
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold text-teal-300 bg-teal-950/60 border border-teal-500/40">
            Resolved
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-neutral-500 bg-neutral-900 border border-neutral-800">
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-neutral-400">
            {s.replace('_', ' ')}
          </span>
        );
    }
  };

  const filteredTickets = tickets?.filter((t) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.subject.toLowerCase().includes(term) ||
      t.author.name.toLowerCase().includes(term) ||
      t.author.email.toLowerCase().includes(term) ||
      (t.book && t.book.title.toLowerCase().includes(term)) ||
      (t.author.author_code && t.author.author_code.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Queue Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <LayoutDashboard className="w-6 h-6 text-indigo-400" />
            Admin Dashboard
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Support queue prioritized by urgency and status.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-black border border-neutral-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-neutral-900 text-white border border-neutral-700'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-neutral-900 text-white border border-neutral-700'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Table
            </button>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black border border-neutral-800 hover:bg-neutral-900 text-neutral-300 hover:text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Compact Unified Filter Toolbar */}
      <div className="bg-black rounded-2xl border border-neutral-800 p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by author, subject, book, or author code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-800 text-xs bg-black text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
            />
          </div>

          {/* Assignment Pills */}
          <div className="flex items-center bg-black p-1 rounded-xl border border-neutral-800 shrink-0">
            {(['ALL', 'ME', 'UNASSIGNED'] as const).map((mode) => {
              const label =
                mode === 'ALL'
                  ? 'All'
                  : mode === 'ME'
                  ? 'My Tickets'
                  : 'Unassigned';
              return (
                <button
                  key={mode}
                  onClick={() => setAssignmentFilter(mode)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    assignmentFilter === mode
                      ? 'bg-neutral-900 text-white border border-neutral-700'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters Row: Status, Priority, Category */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-neutral-900">
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-800 text-xs bg-black text-neutral-200 focus:outline-none focus:border-neutral-600"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s} className="bg-black text-white">
                  {s === 'ALL' ? 'Status: All' : `Status: ${s.replace('_', ' ')}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-800 text-xs bg-black text-neutral-200 focus:outline-none focus:border-neutral-600"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p} className="bg-black text-white">
                  {p === 'ALL' ? 'Priority: All' : `Priority: ${p}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-800 text-xs bg-black text-neutral-200 focus:outline-none focus:border-neutral-600"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-black text-white">
                  {c === 'ALL' ? 'Category: All' : `Category: ${c.replace(/_/g, ' ')}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ticket List / Table Container */}
      {isLoading ? (
        <div className="bg-black rounded-2xl border border-neutral-800 p-12 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : filteredTickets && filteredTickets.length > 0 ? (
        viewMode === 'cards' ? (
          /* ========================================================= */
          /* CLEAN CARD VIEW                                           */
          /* ========================================================= */
          <div className="space-y-3 animate-fade-in">
            {filteredTickets.map((t) => {
              const isCritical = t.priority === 'CRITICAL';

              return (
                <Link
                  key={t.id}
                  to={`/admin/tickets/${t.id}`}
                  className={`p-4 rounded-xl bg-black border hover:border-neutral-700 transition-colors block space-y-2.5 group cursor-pointer ${
                    isCritical
                      ? 'border-rose-500/60'
                      : 'border-neutral-900'
                  }`}
                >
                  {/* Top Meta Line */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      {renderPriorityBadge(t.priority)}
                      {renderStatusBadge(t.status)}
                      <span className="text-neutral-500 font-mono text-[11px]">
                        #{t.id.slice(0, 8)}
                      </span>
                      {t.ai_status === 'OK' && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400/80">
                          <Sparkles className="w-3 h-3" />
                          AI
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(t.created_at).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Subject & Preview */}
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">
                      {t.subject}
                    </h3>
                    <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">
                      {t.description}
                    </p>
                  </div>

                  {/* Bottom Context Line */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-900/80 text-xs text-neutral-400">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5 text-neutral-300">
                        <User className="w-3.5 h-3.5 text-neutral-500" />
                        <span>{t.author.name}</span>
                        {t.author.author_code && (
                          <span className="text-[10px] font-mono text-neutral-500">
                            ({t.author.author_code})
                          </span>
                        )}
                      </div>

                      {t.book && (
                        <div className="flex items-center gap-1 text-neutral-400">
                          <BookOpen className="w-3.5 h-3.5 text-neutral-600" />
                          <span className="truncate max-w-[200px]">{t.book.title}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-neutral-500 text-[11px]">
                        <MessageSquare className="w-3 h-3" />
                        <span>{t.replyCount}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {t.assignee ? (
                        <span className="text-[11px] text-neutral-400">
                          Assignee: <span className="text-white">{t.assignee.name}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-400/80">Unassigned</span>
                      )}

                      <ArrowRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* ========================================================= */
          /* STRUCTURED TABLE VIEW                                     */
          /* ========================================================= */
          <div className="bg-black rounded-2xl border border-neutral-800 overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-300 border-collapse">
                <thead className="bg-neutral-950 border-b border-neutral-800 text-[11px] font-medium text-neutral-400">
                  <tr>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 min-w-[260px]">Subject</th>
                    <th className="py-3 px-4">Author</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Assignee</th>
                    <th className="py-3 px-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {filteredTickets.map((t) => {
                    const isCritical = t.priority === 'CRITICAL';
                    return (
                      <tr
                        key={t.id}
                        className={`hover:bg-neutral-950/80 transition-colors ${
                          isCritical ? 'bg-rose-950/10' : ''
                        }`}
                      >
                        <td className="py-3 px-4 whitespace-nowrap">
                          {renderPriorityBadge(t.priority)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {renderStatusBadge(t.status)}
                        </td>
                        <td className="py-3 px-4 min-w-[260px]">
                          <Link
                            to={`/admin/tickets/${t.id}`}
                            className="font-medium text-white hover:text-indigo-400 transition-colors block text-xs"
                          >
                            {t.subject}
                          </Link>
                          {t.book && (
                            <span className="text-[11px] text-neutral-500 truncate block mt-0.5">
                              {t.book.title}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="text-white font-medium">{t.author.name}</div>
                          <div className="text-[10px] text-neutral-500 font-mono">
                            {t.author.author_code || ''}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-neutral-400">
                          {t.category.replace(/_/g, ' ')}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {t.assignee ? (
                            <span className="text-white text-xs">{t.assignee.name}</span>
                          ) : (
                            <span className="text-amber-400/80 text-[11px]">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-right font-mono text-neutral-500 text-[11px]">
                          {new Date(t.created_at).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="bg-black rounded-2xl border border-neutral-800 p-12 text-center text-xs text-neutral-400">
          No tickets found matching the selected filters.
        </div>
      )}
    </div>
  );
};
