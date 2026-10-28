import React, { useState, useEffect, useMemo } from 'react';
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
  BookMarked,
} from 'lucide-react';
import { getKnowledgeByCategory, findMatchingKnowledge } from '../../data/knowledgeBase';

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
    refetchInterval: 10000,
  });

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

  // Find relevant knowledge base policy
  const relevantPolicy = useMemo(() => {
    if (!ticket) return null;
    const byCategory = getKnowledgeByCategory(ticket.category);
    if (byCategory) return byCategory;
    const matches = findMatchingKnowledge(`${ticket.subject} ${ticket.description}`);
    return matches.length > 0 ? matches[0] : null;
  }, [ticket]);

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
      <div className="max-w-2xl mx-auto p-8 bg-black border border-rose-500/50 rounded-2xl text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
        <h2 className="text-base font-bold text-white">Unable to load ticket</h2>
        <p className="text-xs text-rose-300">
          {(error as any)?.message || 'The requested ticket could not be found or you do not have permission.'}
        </p>
        <button
          onClick={() => navigate('/author/tickets')}
          className="mt-2 text-xs bg-rose-600 hover:bg-rose-500 text-white font-semibold px-4 py-2 rounded-xl cursor-pointer"
        >
          Return to My Tickets
        </button>
      </div>
    );
  }

  const isClosed = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Top back button & live refresh indicator */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/author/tickets')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Ticket List
        </button>

        <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-500 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live · updated {secondsAgo}s ago
        </span>
      </div>

      {/* Ticket Header Card */}
      <div className="bg-black rounded-2xl border border-neutral-900 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-900 pb-3.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs text-neutral-500">
                #{ticket.id.slice(0, 8)}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  ticket.status === 'OPEN'
                    ? 'text-emerald-400 bg-emerald-950/60'
                    : ticket.status === 'IN_PROGRESS'
                    ? 'text-indigo-300 bg-indigo-950/60'
                    : ticket.status === 'RESOLVED'
                    ? 'text-teal-300 bg-teal-950/60'
                    : 'text-neutral-500 bg-neutral-900'
                }`}
              >
                {ticket.status.replace('_', ' ')}
              </span>
              {ticket.category && ticket.category !== 'UNCLASSIFIED' && (
                <span className="text-[11px] text-neutral-400">
                  {ticket.category.replace(/_/g, ' ')}
                </span>
              )}
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {ticket.subject}
            </h1>
          </div>

          <div className="text-xs text-neutral-500 sm:text-right shrink-0">
            <div className="flex items-center sm:justify-end gap-1 text-[11px]">
              <Clock className="w-3 h-3 text-neutral-500" />
              <span>
                Opened {new Date(ticket.created_at).toLocaleDateString('en-IN', {
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
          <div className="bg-neutral-950/80 border border-neutral-900 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] font-mono text-neutral-500 block">
                  {ticket.book.book_id} · {ticket.book.isbn || 'Pending ISBN'}
                </span>
                <span className="text-xs font-semibold text-white">{ticket.book.title}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-neutral-500 text-[11px]">Status:</span>
              <span className="text-neutral-300 font-medium text-[11px]">
                {ticket.book.status}
              </span>
            </div>
          </div>
        )}

        {/* Original Query Message */}
        <div>
          <span className="text-[11px] font-medium text-neutral-500 block mb-1">
            Author Inquiry
          </span>
          <div className="bg-neutral-950/60 border border-neutral-900 rounded-xl p-4 text-xs text-neutral-200 leading-relaxed whitespace-pre-wrap">
            {ticket.description}
          </div>
        </div>

        {/* Relevant Knowledge Base Policy Section */}
        {relevantPolicy && (
          <div className="p-3.5 rounded-xl bg-neutral-950/90 border border-emerald-500/30 space-y-2 text-xs animate-slide-up">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5 text-xs">
                <BookMarked className="w-3.5 h-3.5 text-emerald-400" />
                BookLeaf Policy: {relevantPolicy.title}
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">
                SLA: {relevantPolicy.slaOrTurnaround}
              </span>
            </div>
            <p className="text-neutral-300 text-[11px] leading-relaxed">
              {relevantPolicy.summary}
            </p>
            <ul className="space-y-0.5 text-neutral-400 text-[10px] list-disc list-inside">
              {relevantPolicy.keyPoints.slice(0, 3).map((pt, i) => (
                <li key={i}>{pt}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Responses Thread */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-white flex items-center gap-1.5">
          <LifeBuoy className="w-4 h-4 text-emerald-400" />
          Responses & Communication History ({ticket.replies.length})
        </h2>

        {ticket.replies.length === 0 ? (
          <div className="bg-black rounded-2xl border border-neutral-900 p-8 text-center space-y-1.5">
            <Clock className="w-6 h-6 text-neutral-600 mx-auto" />
            <p className="text-xs font-semibold text-neutral-300">Awaiting Support Team Response</p>
            <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
              Our operations desk has received your ticket. Typical response turnaround is 24–48 business hours.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {ticket.replies.map((reply) => {
              const isAdmin = reply.senderRole === 'ADMIN';
              return (
                <div
                  key={reply.id}
                  className={`rounded-xl p-4 border text-xs leading-relaxed ${
                    isAdmin
                      ? 'bg-neutral-950 border-emerald-500/30 text-white ml-2 sm:ml-4'
                      : 'bg-black border-neutral-900 text-neutral-300 mr-2 sm:mr-4'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-1.5">
                      {isAdmin ? (
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <User className="w-4 h-4 text-neutral-500" />
                      )}
                      <span className="font-semibold text-white">{reply.senderName}</span>
                      <span className="text-[10px] text-neutral-500">
                        ({reply.senderRole})
                      </span>
                    </div>

                    <span className="text-[10px] text-neutral-500 font-mono">
                      {new Date(reply.created_at).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="whitespace-pre-wrap pl-5 text-neutral-200">
                    {reply.body}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Follow-up Reply Box */}
      <div className="bg-black rounded-2xl border border-neutral-900 p-5 space-y-3">
        <h3 className="text-xs font-semibold text-white">Send Follow-up Message</h3>

        {errorMsg && (
          <div className="p-2.5 bg-black border border-rose-500/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isClosed ? (
          <div className="bg-neutral-950/60 border border-neutral-900 rounded-xl p-4 text-center space-y-1 text-neutral-400">
            <div className="flex items-center justify-center gap-1.5 font-medium text-white text-xs">
              <Lock className="w-3.5 h-3.5 text-neutral-400" />
              This ticket is resolved and closed.
            </div>
            <p className="text-[11px] text-neutral-500">
              Please open a new ticket from your dashboard if you require additional assistance.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendReply} className="space-y-3">
            <textarea
              rows={3}
              required
              placeholder="Type your follow-up reply or additional details here..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-800 bg-black text-white placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500 text-xs leading-relaxed"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={replyMutation.isPending || !replyText.trim()}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-4 py-2 rounded-xl disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {replyMutation.isPending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
