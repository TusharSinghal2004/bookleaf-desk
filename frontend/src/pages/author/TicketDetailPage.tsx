import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAuthorTicketById, postAuthorReply } from '../../api/author';
import {
  ArrowLeft,
  LifeBuoy,
  BookOpen,
  Send,
  AlertCircle,
  Clock,
  ShieldCheck,
  User,
  Lock,
} from 'lucide-react';

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [replyText, setReplyText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  const {
    data: ticket,
    isLoading,
    error,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['authorTicket', id],
    queryFn: () => fetchAuthorTicketById(id!),
    enabled: Boolean(id),
    refetchInterval: 10000, // 10s near real-time polling
  });

  // Track seconds since last update
  useEffect(() => {
    setSecondsAgo(0);
    const interval = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [dataUpdatedAt]);

  const replyMutation = useMutation({
    mutationFn: (body: string) => postAuthorReply(id!, body),
    onSuccess: () => {
      setReplyText('');
      setErrorMsg(null);
      queryClient.invalidateQueries({ queryKey: ['authorTicket', id] });
      queryClient.invalidateQueries({ queryKey: ['authorTickets'] });
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to send reply');
    },
  });

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    replyMutation.mutate(replyText.trim());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
        <h2 className="text-base font-bold text-rose-900">Unable to load ticket</h2>
        <p className="text-xs text-rose-700">
          {(error as any)?.message || 'The requested ticket could not be found or you do not have permission.'}
        </p>
        <button
          onClick={() => navigate('/author/tickets')}
          className="mt-2 text-xs bg-rose-600 text-white font-semibold px-4 py-2 rounded-xl"
        >
          Return to My Tickets
        </button>
      </div>
    );
  }

  const isClosed = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top back button & live refresh indicator */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/author/tickets')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Ticket List
        </button>

        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Updated {secondsAgo}s ago
        </span>
      </div>

      {/* Ticket Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-semibold text-slate-500">
                Ticket #{ticket.id.slice(0, 8)}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                  ticket.status === 'OPEN'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : ticket.status === 'IN_PROGRESS'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {ticket.status.replace('_', ' ')}
              </span>
              {ticket.category && ticket.category !== 'UNCLASSIFIED' && (
                <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {ticket.category.replace(/_/g, ' ')}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {ticket.subject}
            </h1>
          </div>

          <div className="text-xs text-slate-400 sm:text-right shrink-0">
            <div className="flex items-center sm:justify-end gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Opened on {new Date(ticket.created_at).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Associated Book Context if applicable */}
        {ticket.book && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-mono text-slate-500 block">
                  {ticket.book.book_id} · {ticket.book.isbn || 'Pending ISBN'}
                </span>
                <span className="text-sm font-bold text-slate-900">{ticket.book.title}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-medium">Status:</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                {ticket.book.status}
              </span>
            </div>
          </div>
        )}

        {/* Original Query Message */}
        <div className="pt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Original Author Query
          </span>
          <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-5 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
            {ticket.description}
          </div>
        </div>
      </div>

      {/* Responses Thread */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <LifeBuoy className="w-4 h-4 text-emerald-600" />
          Responses & Communication History ({ticket.replies.length})
        </h2>

        {ticket.replies.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-2">
            <Clock className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Awaiting Support Team Response</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Our operations team has received your ticket and is reviewing your details. Expected turnaround is 24-48 business hours.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {ticket.replies.map((reply) => {
              const isAdmin = reply.senderRole === 'ADMIN';
              return (
                <div
                  key={reply.id}
                  className={`rounded-3xl p-6 border transition-all ${
                    isAdmin
                      ? 'bg-emerald-50/40 border-emerald-200/90 shadow-sm ml-0 sm:ml-4'
                      : 'bg-white border-slate-200/90 shadow-sm mr-0 sm:mr-4'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          isAdmin
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900">{reply.senderName}</span>
                        <span
                          className={`text-[10px] ml-1.5 px-1.5 py-0.2 rounded font-semibold uppercase ${
                            isAdmin
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {reply.senderRole}
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] text-slate-400">
                      {new Date(reply.created_at).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap pl-9">
                    {reply.body}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Follow-up Reply Box */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Send Follow-up Message</h3>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isClosed ? (
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 text-center space-y-1.5 text-slate-600">
            <div className="flex items-center justify-center gap-2 font-bold text-slate-700 text-sm">
              <Lock className="w-4 h-4" />
              This ticket is closed.
            </div>
            <p className="text-xs text-slate-500">
              Please open a new ticket from your dashboard if you require additional assistance.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendReply} className="space-y-4">
            <textarea
              rows={3}
              required
              placeholder="Type your follow-up reply or additional information here..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm leading-relaxed"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={replyMutation.isPending || !replyText.trim()}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-sm disabled:opacity-50 transition-all"
              >
                <Send className="w-4 h-4" />
                {replyMutation.isPending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
