import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAdminTicketById,
  updateAdminTicket,
  postAdminReply,
  postAdminNote,
  reclassifyTicket,
  generateDraft,
} from '../../api/admin';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  User,
  BookOpen,
  Send,
  Sparkles,
  Lock,
  MessageSquare,
  FileText,
  UserCheck,
  CheckCircle2,
  RefreshCw,
  Coins,
} from 'lucide-react';

const CATEGORIES = [
  'ROYALTY_AND_PAYMENTS',
  'ISBN_AND_METADATA_ISSUES',
  'PRINTING_AND_QUALITY',
  'DISTRIBUTION_AND_AVAILABILITY',
  'BOOK_STATUS_AND_PRODUCTION_UPDATES',
  'GENERAL_INQUIRY',
  'UNCLASSIFIED',
];

const PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNSET'];
const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export const AdminTicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentAdmin } = useAuth();

  // Tab State: 'thread' | 'ai' | 'notes'
  const [activeTab, setActiveTab] = useState<'thread' | 'ai' | 'notes'>('thread');

  const [replyBody, setReplyBody] = useState('');
  const [internalNoteBody, setInternalNoteBody] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [draftGenerated, setDraftGenerated] = useState(false);

  const {
    data: ticket,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['adminTicket', id],
    queryFn: () => fetchAdminTicketById(id!),
    enabled: Boolean(id),
  });

  const updateMutation = useMutation({
    mutationFn: (updates: { status?: string; category?: string; priority?: string; assigned_to?: string | null }) =>
      updateAdminTicket(id!, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTicket', id] });
      queryClient.invalidateQueries({ queryKey: ['adminTickets'] });
    },
  });

  const replyMutation = useMutation({
    mutationFn: (body: string) => postAdminReply(id!, body),
    onSuccess: () => {
      setReplyBody('');
      queryClient.invalidateQueries({ queryKey: ['adminTicket', id] });
      queryClient.invalidateQueries({ queryKey: ['adminTickets'] });
    },
  });

  const noteMutation = useMutation({
    mutationFn: (body: string) => postAdminNote(id!, body),
    onSuccess: () => {
      setInternalNoteBody('');
      queryClient.invalidateQueries({ queryKey: ['adminTicket', id] });
    },
  });

  const classifyMutation = useMutation({
    mutationFn: () => reclassifyTicket(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTicket', id] });
      queryClient.invalidateQueries({ queryKey: ['adminTickets'] });
    },
  });

  const handleGenerateDraft = async () => {
    setIsDraftLoading(true);
    try {
      const res = await generateDraft(id!);
      setDraftContent(res.draft);
      setDraftGenerated(true);
    } catch (err) {
      console.error('Draft generation failed:', err);
    } finally {
      setIsDraftLoading(false);
    }
  };

  const handleUseDraftAsReply = () => {
    if (draftContent.trim()) {
      setReplyBody(draftContent.trim());
      setActiveTab('thread'); // Switch immediately to reply thread
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="p-8 text-center bg-rose-50 rounded-2xl border border-rose-200 text-rose-800">
        <p className="font-semibold">Unable to load ticket details.</p>
        <button
          onClick={() => navigate('/admin/tickets')}
          className="mt-3 text-xs bg-rose-600 text-white px-3 py-1.5 rounded-lg"
        >
          Return to Queue
        </button>
      </div>
    );
  }

  const isAssignedToMe = ticket.assigned_to === currentAdmin?.id;

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/tickets')}
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title="Back to queue"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-400">
                Ticket #{ticket.id.slice(0, 8)}
              </span>
              {ticket.is_overridden && (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                  Overridden
                </span>
              )}
            </div>
            <h1 className="text-lg font-bold text-slate-900 truncate max-w-xl">{ticket.subject}</h1>
          </div>
        </div>

        {/* Status, Priority, Assign controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() =>
              updateMutation.mutate({
                assigned_to: isAssignedToMe ? null : currentAdmin?.id,
              })
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isAssignedToMe
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            {isAssignedToMe ? 'Assigned to You' : 'Assign to Me'}
          </button>

          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Status:</span>
            <select
              value={ticket.status}
              onChange={(e) => updateMutation.mutate({ status: e.target.value })}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Priority:</span>
            <select
              value={ticket.priority}
              onChange={(e) => updateMutation.mutate({ priority: e.target.value })}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Category:</span>
            <select
              value={ticket.category}
              onChange={(e) => updateMutation.mutate({ category: e.target.value })}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none max-w-[130px] truncate"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column Context (4 cols) + Right Column Tabbed Work Area (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Author & Book Context */}
        <div className="lg:col-span-4 space-y-5">
          {/* Author Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                <User className="w-4 h-4 text-slate-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900 truncate">{ticket.author.name}</h3>
                <span className="text-[10px] font-mono text-slate-400">
                  {ticket.author.author_code || 'AUTH'} · {ticket.author.city || 'India'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Email</span>
                <span className="font-medium text-slate-800 truncate max-w-[170px]">
                  {ticket.author.email}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Phone</span>
                <span className="font-medium text-slate-800">{ticket.author.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Joined</span>
                <span className="font-medium text-slate-800">
                  {ticket.author.joined_date
                    ? new Date(ticket.author.joined_date).toLocaleDateString('en-IN', {
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Book Context Card */}
          {ticket.book ? (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 space-y-3">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{ticket.book.title}</h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    {ticket.book.book_id} · {ticket.book.isbn || 'Pending ISBN'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-400">Status</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                    {ticket.book.status}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Copies Sold</span>
                  <span className="font-bold text-slate-800">
                    {ticket.book.copies_sold.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Pending Royalty</span>
                  <span className="font-extrabold text-amber-900 bg-amber-50 px-2 py-0.5 rounded">
                    ₹{ticket.book.royalty_pending.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Print Partner</span>
                  <span className="font-medium text-slate-700">
                    {ticket.book.print_partner || 'In-House (Delhi)'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-3xl border border-slate-200 p-5 text-center text-xs text-slate-400 italic">
              General Account Inquiry (No book attached)
            </div>
          )}

          {/* AI Status / Manual Mode Info Box */}
          <div className="bg-slate-50 rounded-3xl border border-slate-200 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                AI Triage Status
              </span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    ticket.ai_status === 'OK'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {ticket.ai_status === 'OK' ? 'AI Auto-Triaged' : 'Manual Mode'}
                </span>
                <button
                  type="button"
                  onClick={() => classifyMutation.mutate()}
                  disabled={classifyMutation.isPending}
                  className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 underline disabled:opacity-50"
                  title="Re-run AI auto-classification"
                >
                  {classifyMutation.isPending ? '...' : 'Re-run'}
                </button>
              </div>
            </div>
            {ticket.ai_rationale && (
              <p className="text-[11px] text-slate-600 leading-snug">{ticket.ai_rationale}</p>
            )}
          </div>
        </div>

        {/* Right Column: Tabbed Work Area (Conversation vs AI Draft vs Internal Notes) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Query Summary Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                Original Query from Author
              </span>
              <span>
                {new Date(ticket.created_at).toLocaleString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
              {ticket.description}
            </p>
          </div>

          {/* Clean Segmented Tab Control */}
          <div className="flex bg-slate-100/90 p-1.5 rounded-2xl gap-1">
            <button
              onClick={() => setActiveTab('thread')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'thread'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              Conversation Thread ({ticket.replies.length})
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'ai'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              AI Assistant & Draft
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'notes'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="w-4 h-4 text-amber-600" />
              Internal Notes ({ticket.internal_notes.length})
            </button>
          </div>

          {/* TAB 1: CONVERSATION THREAD */}
          {activeTab === 'thread' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="space-y-3">
                {ticket.replies.length > 0 ? (
                  ticket.replies.map((reply) => {
                    const isAdmin = reply.senderRole === 'ADMIN';
                    return (
                      <div
                        key={reply.id}
                        className={`rounded-2xl p-4 border text-xs sm:text-sm leading-relaxed ${
                          isAdmin
                            ? 'bg-emerald-50/50 border-emerald-200 text-slate-900 ml-4'
                            : 'bg-white border-slate-200 text-slate-800 mr-4'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="font-bold flex items-center gap-1.5">
                            {reply.senderName}
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                                isAdmin ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {reply.senderRole}
                            </span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(reply.created_at).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap">{reply.body}</p>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400 italic">
                    No replies yet. Use the composer below or generate an AI response in the AI tab.
                  </div>
                )}
              </div>

              {/* Reply Composer */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Send Reply to Author
                </label>
                <textarea
                  rows={3}
                  placeholder="Type message to author..."
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => replyMutation.mutate(replyBody.trim())}
                    disabled={replyMutation.isPending || !replyBody.trim()}
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-xs disabled:opacity-50 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {replyMutation.isPending ? 'Sending...' : 'Send Author Reply'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI ASSISTANT & DRAFTING */}
          {activeTab === 'ai' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-gradient-to-br from-indigo-50/70 to-purple-50/70 rounded-3xl border border-indigo-200 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-sm font-bold text-indigo-950">
                      KB-Informed AI Response Generator
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateDraft}
                    disabled={isDraftLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isDraftLoading ? 'animate-spin' : ''}`} />
                    {draftGenerated ? 'Regenerate Draft' : 'Generate AI Draft'}
                  </button>
                </div>

                <p className="text-xs text-slate-600">
                  Selectively injects policy rules, author figures, and explicit SLAs (≤150 words).
                </p>

                <textarea
                  rows={6}
                  placeholder="Click 'Generate AI Draft' to produce an empathetic, context-aware reply using the BookLeaf Knowledge Base."
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-indigo-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans"
                />

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400 font-mono text-[11px]">
                    {draftContent.split(/\s+/).filter(Boolean).length} words
                  </span>
                  <button
                    type="button"
                    onClick={handleUseDraftAsReply}
                    disabled={!draftContent.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-40"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Apply Draft to Reply Box
                  </button>
                </div>
              </div>

              {/* AI Token Audit History */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-slate-500" />
                  Token Audit & Cost Log
                </h4>
                {ticket.ai_logs.length > 0 ? (
                  <div className="space-y-1.5 text-xs font-mono text-slate-600">
                    {ticket.ai_logs.map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between"
                      >
                        <span className="font-bold text-slate-800">{log.operation}</span>
                        <span className="text-[11px] text-slate-500">
                          {log.model} · {log.prompt_tokens} in / {log.completion_tokens} out
                        </span>
                        <span className={log.success ? 'text-emerald-600 font-bold' : 'text-rose-600'}>
                          {log.success ? 'OK' : 'FAIL'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No AI calls logged yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: INTERNAL NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-amber-50/50 rounded-3xl border border-amber-200/80 p-5 space-y-3">
                <div className="flex items-center gap-2 text-amber-900">
                  <Lock className="w-4 h-4 text-amber-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    Confidential Operations Notes
                  </h3>
                </div>
                <p className="text-xs text-amber-800">
                  Internal discussion between ops team members. Authors cannot view these notes under any circumstances.
                </p>

                {ticket.internal_notes.length > 0 ? (
                  <div className="space-y-2 pt-2">
                    {ticket.internal_notes.map((n) => (
                      <div
                        key={n.id}
                        className="p-3 bg-white border border-amber-200 rounded-2xl text-xs space-y-1"
                      >
                        <div className="flex justify-between items-center text-slate-400 text-[10px]">
                          <span className="font-bold text-slate-800">{n.senderName}</span>
                          <span>
                            {new Date(n.created_at).toLocaleString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{n.body}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-amber-700 italic py-2">No internal notes logged.</div>
                )}

                {/* Add Internal Note */}
                <div className="space-y-2 pt-2 border-t border-amber-200/60">
                  <textarea
                    rows={2}
                    placeholder="Add confidential note..."
                    value={internalNoteBody}
                    onChange={(e) => setInternalNoteBody(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => noteMutation.mutate(internalNoteBody.trim())}
                      disabled={noteMutation.isPending || !internalNoteBody.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Save Note
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
