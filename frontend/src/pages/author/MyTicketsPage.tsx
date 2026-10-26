import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchAuthorTickets } from '../../api/author';
import { LifeBuoy, PlusCircle, Clock, MessageSquare, ChevronRight, RefreshCw, BookOpen } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

const STATUS_FILTERS = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export const MyTicketsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [secondsAgo, setSecondsAgo] = useState(0);

  const {
    data: tickets,
    isLoading,
    isRefetching,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['authorTickets', user?.id, activeFilter],
    queryFn: () => fetchAuthorTickets(activeFilter === 'ALL' ? undefined : activeFilter),
    refetchInterval: 10000, // Near real-time 10s polling as requested
    enabled: Boolean(user?.id),
  });

  // Keep track of seconds since last polling update
  useEffect(() => {
    setSecondsAgo(0);
    const interval = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [dataUpdatedAt]);

  const getStatusBadge = (status: string) => {
    switch (status) {
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

  return (
    <div className="space-y-6">
      {/* Header with 10s Polling Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <LifeBuoy className="w-7 h-7 text-emerald-600" />
            Support Queries & Tickets
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-slate-500">
              Track resolution progress and communications with the BookLeaf team.
            </p>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live (10s polling) · updated {secondsAgo}s ago
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors disabled:opacity-50"
            title="Refresh now"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/author/tickets/new"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            New Query
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilter === f
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f === 'ALL' ? 'All Tickets' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Ticket List */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : tickets && tickets.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
          {tickets.map((t) => (
            <Link
              key={t.id}
              to={`/author/tickets/${t.id}`}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors group"
            >
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getStatusBadge(
                      t.status
                    )}`}
                  >
                    {t.status.replace('_', ' ')}
                  </span>
                  {t.category && t.category !== 'UNCLASSIFIED' && (
                    <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {t.category.replace(/_/g, ' ')}
                    </span>
                  )}
                  {t.book && (
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-slate-400" />
                      {t.book.book_id}: {t.book.title}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                  {t.subject}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-1">{t.description}</p>

                {t.lastReply && (
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs text-slate-700 mt-2 flex items-start gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="truncate">
                      <span className="font-semibold text-slate-900">{t.lastReply.senderName}:</span>{' '}
                      {t.lastReply.body}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400 shrink-0 self-end sm:self-center">
                <div className="text-right">
                  <div className="flex items-center gap-1 font-medium text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(t.created_at).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {t.replyCount} {t.replyCount === 1 ? 'reply' : 'replies'}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No support tickets found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeFilter === 'ALL'
              ? 'You have not submitted any support tickets yet. Click "New Query" if you need assistance.'
              : `No tickets currently match the "${activeFilter.replace('_', ' ')}" status.`}
          </p>
        </div>
      )}
    </div>
  );
};
