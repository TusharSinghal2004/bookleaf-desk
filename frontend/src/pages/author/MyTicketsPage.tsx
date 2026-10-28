import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchAuthorTickets } from '../../api/author';
import {
  LifeBuoy,
  PlusCircle,
  Clock,
  MessageSquare,
  ChevronRight,
  RefreshCw,
  BookOpen,
  BookMarked,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { KNOWLEDGE_BASE_ARTICLES } from '../../data/knowledgeBase';

const STATUS_FILTERS = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export const MyTicketsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [expandedKbId, setExpandedKbId] = useState<string | null>(null);

  const {
    data: tickets,
    isLoading,
    isRefetching,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['authorTickets', user?.id, activeFilter],
    queryFn: () => fetchAuthorTickets(activeFilter === 'ALL' ? undefined : activeFilter),
    refetchInterval: 10000,
    enabled: Boolean(user?.id),
  });

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
        return 'text-emerald-400 bg-emerald-950/60 border border-emerald-500/40';
      case 'IN_PROGRESS':
        return 'text-indigo-300 bg-indigo-950/60 border border-indigo-500/40';
      case 'RESOLVED':
        return 'text-teal-300 bg-teal-950/60 border border-teal-500/40';
      case 'CLOSED':
        return 'text-neutral-500 bg-neutral-900 border border-neutral-800';
      default:
        return 'text-neutral-400 bg-neutral-900 border border-neutral-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Polling Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-emerald-400" />
            Support Queries & Tickets
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-neutral-400">
              Track resolution progress and communications with the BookLeaf team.
            </p>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-500 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live · {secondsAgo}s ago
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2 bg-black border border-neutral-800 hover:bg-neutral-900 text-neutral-300 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/author/tickets/new"
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
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
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === f
                ? 'bg-neutral-900 text-white border border-neutral-700'
                : 'bg-black text-neutral-400 border border-neutral-900 hover:text-white'
            }`}
          >
            {f === 'ALL' ? 'All Tickets' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Ticket List */}
      {isLoading ? (
        <div className="bg-black rounded-2xl border border-neutral-800 p-12 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : tickets && tickets.length > 0 ? (
        <div className="bg-black rounded-2xl border border-neutral-900 overflow-hidden divide-y divide-neutral-900 animate-fade-in">
          {tickets.map((t) => (
            <Link
              key={t.id}
              to={`/author/tickets/${t.id}`}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black hover:bg-neutral-950/80 transition-colors group cursor-pointer"
            >
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${getStatusBadge(
                      t.status
                    )}`}
                  >
                    {t.status.replace('_', ' ')}
                  </span>
                  {t.book && (
                    <span className="text-[11px] text-neutral-400 font-medium flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-neutral-500" />
                      {t.book.title}
                    </span>
                  )}
                  <span className="text-[11px] text-neutral-600 font-mono">
                    #{t.id.slice(0, 8)}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors truncate">
                  {t.subject}
                </h3>

                <p className="text-xs text-neutral-400 line-clamp-1">{t.description}</p>

                {t.lastReply && (
                  <div className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">
                      <span className="text-neutral-300 font-medium">{t.lastReply.senderName}:</span>{' '}
                      {t.lastReply.body}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-neutral-500 shrink-0 self-end sm:self-center">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3" />
                    {new Date(t.created_at).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="text-[10px] text-neutral-600">
                    {t.replyCount} {t.replyCount === 1 ? 'reply' : 'replies'}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-white transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-black rounded-2xl border border-neutral-900 p-10 text-center space-y-2">
          <LifeBuoy className="w-6 h-6 text-neutral-600 mx-auto" />
          <h3 className="text-sm font-semibold text-white">No support tickets found</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {activeFilter === 'ALL'
              ? 'You have not submitted any support tickets yet. Click "New Query" if you need assistance.'
              : `No tickets currently match the "${activeFilter.replace('_', ' ')}" status.`}
          </p>
        </div>
      )}

      {/* Author Knowledge Base & Guidelines Section */}
      <div className="bg-black rounded-2xl border border-neutral-900 p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
          <div className="flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">
              Author Knowledge Base & Policy Guidelines
            </h2>
          </div>
          <span className="text-[11px] text-neutral-500">Official Operational Policies</span>
        </div>

        <p className="text-xs text-neutral-400">
          Read BookLeaf's official policy rules below for immediate answers regarding royalties, turnaround times, reprint guarantees, and distribution SLAs.
        </p>

        <div className="space-y-2 pt-1">
          {KNOWLEDGE_BASE_ARTICLES.map((article) => {
            const isExpanded = expandedKbId === article.id;
            return (
              <div
                key={article.id}
                className="rounded-xl border border-neutral-900 bg-neutral-950/60 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedKbId(isExpanded ? null : article.id)}
                  className="w-full p-3 flex items-center justify-between text-left text-xs hover:bg-neutral-900/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-white truncate">{article.title}</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono shrink-0">
                      SLA: {article.slaOrTurnaround.split(';')[0]}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-neutral-500 transition-transform ${
                      isExpanded ? 'rotate-180 text-emerald-400' : ''
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="p-3.5 pt-0 text-xs border-t border-neutral-900/80 space-y-2 mt-1">
                    <p className="text-neutral-300 leading-relaxed text-xs">
                      {article.summary}
                    </p>
                    <ul className="space-y-1 text-neutral-400 text-[11px] list-disc list-inside">
                      {article.keyPoints.map((point, idx) => (
                        <li key={idx}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
