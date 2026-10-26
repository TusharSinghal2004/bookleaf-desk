import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchAdminTickets } from '../../api/admin';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  BookOpen,
  Sparkles,
  RefreshCw,
  Search,
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

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold ring-1 ring-rose-400/40';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
      case 'MEDIUM':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'LOW':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-400 border-slate-200';
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'OPEN':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'IN_PROGRESS':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'RESOLVED':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'CLOSED':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-indigo-600" />
            Support Operations Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Prioritized by urgency (Critical first) and age (oldest unresolved first).
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh Queue
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 space-y-4">
        {/* Top Search & Assignment Pills */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Filter by author name, book title, or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setAssignmentFilter('ALL')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                assignmentFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setAssignmentFilter('ME')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                assignmentFilter === 'ME' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Assigned to Me
            </button>
            <button
              onClick={() => setAssignmentFilter('UNASSIGNED')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                assignmentFilter === 'UNASSIGNED' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Unassigned
            </button>
          </div>
        </div>

        {/* Dropdown Filters with clear labels */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Status Filter
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-800"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === 'ALL' ? 'All Statuses' : s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Priority Filter
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-800"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p === 'ALL' ? 'All Priorities' : p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Category Filter
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-800"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'ALL' ? 'All Categories' : c.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ticket Table */}
      {isLoading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredTickets && filteredTickets.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 px-5">Priority</th>
                  <th className="py-3.5 px-5">Subject & Context</th>
                  <th className="py-3.5 px-5">Author</th>
                  <th className="py-3.5 px-5">Category</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Assignee</th>
                  <th className="py-3.5 px-5 text-right">Age</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map((t) => {
                  const isCritical = t.priority === 'CRITICAL';
                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-50/90 transition-colors ${
                        isCritical ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] ${getPriorityBadge(
                            t.priority
                          )}`}
                        >
                          {isCritical && <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />}
                          {t.priority}
                        </span>
                      </td>

                      <td className="py-4 px-5 min-w-[240px]">
                        <Link
                          to={`/admin/tickets/${t.id}`}
                          className="font-bold text-slate-900 hover:text-indigo-600 transition-colors block text-sm leading-snug"
                        >
                          {t.subject}
                        </Link>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          {t.book ? (
                            <span className="flex items-center gap-1 text-slate-600 font-medium">
                              <BookOpen className="w-3 h-3 text-slate-400" />
                              {t.book.title}
                            </span>
                          ) : (
                            <span className="italic">General Inquiry</span>
                          )}
                          <span>·</span>
                          <span>{t.replyCount} {t.replyCount === 1 ? 'reply' : 'replies'}</span>
                          {t.internalNoteCount > 0 && (
                            <span className="text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded font-semibold text-[10px]">
                              {t.internalNoteCount} note{t.internalNoteCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="font-bold text-slate-800">{t.author.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {t.author.author_code || ''} {t.author.city ? `(${t.author.city})` : ''}
                        </div>
                      </td>

                      <td className="py-4 px-5 whitespace-nowrap space-y-1">
                        <div className="font-medium text-slate-700">
                          {t.category.replace(/_/g, ' ')}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {t.ai_status === 'OK' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              <Sparkles className="w-2.5 h-2.5" />
                              AI Triaged
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                              Manual
                            </span>
                          )}
                          {t.is_overridden && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              Overridden
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-5 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getStatusBadge(
                            t.status
                          )}`}
                        >
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-4 px-5 whitespace-nowrap">
                        {t.assignee ? (
                          <div className="flex items-center gap-1.5 font-medium text-slate-800">
                            <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                              {t.assignee.name.charAt(0)}
                            </div>
                            <span className="truncate max-w-[120px]">{t.assignee.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                        )}
                      </td>

                      <td className="py-4 px-5 whitespace-nowrap text-right font-mono text-slate-400 text-xs">
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
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
          No tickets found matching the selected filters.
        </div>
      )}
    </div>
  );
};
