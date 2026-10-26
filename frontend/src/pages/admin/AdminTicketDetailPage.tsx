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
  AlertTriangle,
  Lock,
  MessageSquare,
  FileText,
  UserCheck,
  CheckCircle2,
  RefreshCw,
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

  // Ticket update mutation
  const updateMutation = useMutation({
    mutationFn: (updates: { status?: string; category?: string; priority?: string; assigned_to?: string | null }) =>
      updateAdminTicket(id!, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTicket', id] });
      queryClient.invalidateQueries({ queryKey: ['adminTickets'] });
    },
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: (body: string) => postAdminReply(id!, body),
    onSuccess: () => {
      setReplyBody('');
      queryClient.invalidateQueries({ queryKey: ['adminTicket', id] });
      queryClient.invalidateQueries({ queryKey: ['adminTickets'] });
    },
  });

  // Internal Note mutation
  const noteMutation = useMutation({
    mutationFn: (body: string) => postAdminNote(id!, body),
    onSuccess: () => {
      setInternalNoteBody('');
      queryClient.invalidateQueries({ queryKey: ['adminTicket', id] });
    },
  });

  // Re-classify mutation
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
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
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
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/admin/tickets')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Ticket Queue
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Assign Button */}
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

          {/* Status Dropdown */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Status:</span>
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

          {/* Priority Dropdown with manual override detection */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Priority:</span>
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

          {/* Category Dropdown */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Category:</span>
            <select
              value={ticket.category}
              onChange={(e) => updateMutation.mutate({ category: e.target.value })}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none max-w-[150px] truncate"
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

      {/* Main Grid: Left Panel (Author/Book Context) + Right Panel (Thread, AI, Notes) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Author & Book Real Context (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Author Profile Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                <User className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-tight">{ticket.author.name}</h3>
                <span className="text-[11px] font-mono text-slate-400">
                  {ticket.author.author_code || 'AUTH'} · Joined{' '}
                  {ticket.author.joined_date
                    ? new Date(ticket.author.joined_date).toLocaleDateString('en-IN', {
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'N/A'}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Email</span>
                <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                  {ticket.author.email}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Phone</span>
                <span className="font-semibold text-slate-800">{ticket.author.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">City / Location</span>
                <span className="font-semibold text-slate-800">{ticket.author.city || 'India'}</span>
              </div>
            </div>
          </div>

          {/* Book Details Context Card (Real Numbers) */}
          {ticket.book ? (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">{ticket.book.title}</h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    {ticket.book.book_id} · {ticket.book.isbn || 'Pending ISBN'}
                  </span>
                </div>
              </div>

              {/* Status and Numbers */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-400">Status</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                    {ticket.book.status}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-400">Genre</span>
                  <span className="font-semibold text-slate-800">{ticket.book.genre}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-400">Copies Sold</span>
                  <span className="font-bold text-slate-900">
                    {ticket.book.copies_sold.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-400">Royalty Pending</span>
                  <span className="font-extrabold text-amber-900 bg-amber-50 px-2 py-0.5 rounded">
                    ₹{ticket.book.royalty_pending.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-400">Last Payout</span>
                  <span className="font-medium text-slate-700">
                    {ticket.book.last_payout_date
                      ? new Date(ticket.book.last_payout_date).toLocaleDateString('en-IN', {
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'None yet'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Print Partner</span>
                  <span className="font-medium text-slate-700">
                    {ticket.book.print_partner || 'In-House (Delhi)'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 text-center text-xs text-slate-500">
              No specific book linked to this query (General / Account inquiry).
            </div>
          )}

          {/* AI Audit Logs Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              AI Activity & Token Audit
            </h4>
            {ticket.ai_logs.length > 0 ? (
              <div className="space-y-2 text-[11px] font-mono text-slate-600">
                {ticket.ai_logs.map((log) => (
                  <div key={log.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{log.operation}</span>
                      <span className={log.success ? 'text-emerald-600' : 'text-rose-600'}>
                        {log.success ? 'SUCCESS' : 'FAILED'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Model: {log.model} · Tokens: {log.prompt_tokens} in / {log.completion_tokens} out
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No AI operations executed yet.</p>
            )}
          </div>
        </div>

        {/* Right Column: AI Drafting, Query Thread, Internal Notes (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* AI Status / Manual Mode Banner */}
          {ticket.ai_status !== 'OK' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start justify-between gap-3 text-xs text-amber-900">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">AI Unavailable — Manual Mode Active</span>
                  <span className="text-amber-800">
                    {ticket.ai_rationale ||
                      'OPENAI_API_KEY is not configured or rate-limited. You can classify and draft responses manually.'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => classifyMutation.mutate()}
                disabled={classifyMutation.isPending}
                className="shrink-0 font-semibold px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-amber-900 hover:bg-amber-100/50 transition-colors"
              >
                {classifyMutation.isPending ? 'Retrying...' : 'Retry AI'}
              </button>
            </div>
          )}

          {/* Ticket Subject & Original Query */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-400">
                  ID: {ticket.id.slice(0, 8)}
                </span>
                {ticket.is_overridden && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                    Manual Override Applied
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400">
                {new Date(ticket.created_at).toLocaleString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <h2 className="text-xl font-extrabold text-slate-900">{ticket.subject}</h2>

            <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-5 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </div>

            {/* AI Classification Rationale if available */}
            {ticket.ai_rationale && (
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-950 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">AI Triage Rationale: </span>
                  <span>{ticket.ai_rationale}</span>
                </div>
              </div>
            )}
          </div>

          {/* AI-Assisted Response Generator Panel */}
          <div className="bg-gradient-to-br from-indigo-50/60 to-purple-50/60 rounded-3xl border border-indigo-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-indigo-950">
                  AI-Assisted Draft Response (KB-Informed)
                </h3>
              </div>
              <button
                type="button"
                onClick={handleGenerateDraft}
                disabled={isDraftLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isDraftLoading ? 'animate-spin' : ''}`} />
                {draftGenerated ? 'Regenerate Draft' : 'Generate AI Draft'}
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Drafts empathetic, policy-accurate responses (≤150 words) with real author numbers, explicit SLAs, and relevant KB sections.
            </p>

            <div className="space-y-3">
              <textarea
                rows={5}
                placeholder="Click 'Generate AI Draft' to produce a context-aware response based on the BookLeaf Knowledge Base, or write directly here."
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-indigo-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans"
              />

              <div className="flex items-center justify-between text-xs">
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
                  Transfer to Reply Box
                </button>
              </div>
            </div>
          </div>

          {/* Conversation Thread (Author visible) */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              Author-Facing Communication Thread ({ticket.replies.length})
            </h3>

            {ticket.replies.length > 0 ? (
              <div className="space-y-3">
                {ticket.replies.map((reply) => {
                  const isAdmin = reply.senderRole === 'ADMIN';
                  return (
                    <div
                      key={reply.id}
                      className={`rounded-2xl p-5 border text-xs sm:text-sm leading-relaxed ${
                        isAdmin
                          ? 'bg-emerald-50/40 border-emerald-200 text-slate-800 ml-4'
                          : 'bg-white border-slate-200 text-slate-900 mr-4'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          {reply.senderName}
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                              isAdmin ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {reply.senderRole}
                          </span>
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(reply.created_at).toLocaleString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap">{reply.body}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-xs text-slate-400 italic">
                No replies sent yet. Use the composer below to reply to the author.
              </div>
            )}

            {/* Admin Reply Composer */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Compose Author-Visible Reply
              </label>
              <textarea
                rows={4}
                placeholder="Write your response to the author. This will be visible on the author's ticket dashboard."
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm leading-relaxed"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => replyMutation.mutate(replyBody.trim())}
                  disabled={replyMutation.isPending || !replyBody.trim()}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm disabled:opacity-50 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  {replyMutation.isPending ? 'Sending...' : 'Send Author Reply'}
                </button>
              </div>
            </div>
          </div>

          {/* Internal Notes Panel (STRICTLY HIDDEN FROM AUTHOR) */}
          <div className="bg-amber-50/40 rounded-3xl border border-amber-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-900">
              <Lock className="w-4 h-4 text-amber-700" />
              <h3 className="text-sm font-bold">
                Internal Ops Notes (Confidential · Authors cannot see this)
              </h3>
            </div>

            {ticket.internal_notes.length > 0 ? (
              <div className="space-y-2.5">
                {ticket.internal_notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3.5 bg-white border border-amber-200/90 rounded-2xl text-xs space-y-1 shadow-xs"
                  >
                    <div className="flex justify-between items-center text-slate-500 text-[11px]">
                      <span className="font-semibold text-slate-800">{note.senderName}</span>
                      <span>
                        {new Date(note.created_at).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{note.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-amber-800/80 italic p-3 bg-white/70 rounded-xl border border-amber-100">
                No internal notes recorded yet.
              </div>
            )}

            {/* Add Internal Note */}
            <div className="space-y-2 pt-2">
              <textarea
                rows={2}
                placeholder="Log internal note (e.g., 'Escalated to Repro India regarding shipment tracking')..."
                value={internalNoteBody}
                onChange={(e) => setInternalNoteBody(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs text-slate-800"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => noteMutation.mutate(internalNoteBody.trim())}
                  disabled={noteMutation.isPending || !internalNoteBody.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {noteMutation.isPending ? 'Saving...' : 'Add Internal Note'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
