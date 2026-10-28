import React, { useState, useEffect } from 'react';
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
  Clock,
  RotateCcw,
  X,
  AlertCircle,
} from 'lucide-react';

export const AdminTicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'thread' | 'ai' | 'notes'>('thread');
  const [replyBody, setReplyBody] = useState('');
  const [internalNoteBody, setInternalNoteBody] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [draftGenerated, setDraftGenerated] = useState(false);

  // Status Action Toast Notification
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminTicket', id] });
      queryClient.invalidateQueries({ queryKey: ['adminTickets'] });

      let title = 'Ticket Updated';
      let message = 'Your changes have been saved.';

      if (variables.status === 'CLOSED') {
        title = 'Issue Closed';
        message = 'Ticket has been resolved and marked as Closed.';
      } else if (variables.status === 'IN_PROGRESS') {
        title = 'Moved to In Progress';
        message = 'Ticket is now in progress.';
      } else if (variables.status === 'OPEN') {
        title = 'Ticket Reopened';
        message = 'Ticket status has been reset to Open.';
      } else if (variables.assigned_to !== undefined) {
        title = variables.assigned_to ? 'Ticket Assigned' : 'Assignment Removed';
        message = variables.assigned_to ? 'Ticket successfully assigned to you.' : 'Ticket moved to unassigned queue.';
      }

      setNotification({
        type: 'success',
        title,
        message,
      });
    },
    onError: (err: any) => {
      setNotification({
        type: 'error',
        title: 'Action Failed',
        message: err.message || 'Could not update ticket status. Please try again.',
      });
    },
  });

  const replyMutation = useMutation({
    mutationFn: (body: string) => postAdminReply(id!, body),
    onSuccess: () => {
      setReplyBody('');
      queryClient.invalidateQueries({ queryKey: ['adminTicket', id] });
      queryClient.invalidateQueries({ queryKey: ['adminTickets'] });
      setNotification({
        type: 'success',
        title: 'Reply Sent',
        message: 'Your reply has been sent to the author.',
      });
    },
    onError: (err: any) => {
      setNotification({
        type: 'error',
        title: 'Failed to Send Reply',
        message: err.message || 'Unable to deliver message to author.',
      });
    },
  });

  const handleReplyAndClose = async () => {
    const body = replyBody.trim();
    if (!body) return;
    try {
      await replyMutation.mutateAsync(body);
      await updateMutation.mutateAsync({ status: 'CLOSED' });
      setNotification({
        type: 'success',
        title: 'Reply Sent & Closed',
        message: 'Your response was delivered and ticket was marked as Closed.',
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        title: 'Action Failed',
        message: err.message || 'Failed to complete reply and close action.',
      });
    }
  };

  const handleReplyAndInProgress = async () => {
    const body = replyBody.trim();
    if (!body) return;
    try {
      await replyMutation.mutateAsync(body);
      await updateMutation.mutateAsync({ status: 'IN_PROGRESS' });
      setNotification({
        type: 'success',
        title: 'Reply Sent & In Progress',
        message: 'Your response was delivered and ticket moved to In Progress.',
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        title: 'Action Failed',
        message: err.message || 'Failed to update ticket status.',
      });
    }
  };

  const noteMutation = useMutation({
    mutationFn: (body: string) => postAdminNote(id!, body),
    onSuccess: () => {
      setInternalNoteBody('');
      queryClient.invalidateQueries({ queryKey: ['adminTicket', id] });
      setNotification({
        type: 'success',
        title: 'Internal Note Saved',
        message: 'Note saved for operations team.',
      });
    },
  });

  const classifyMutation = useMutation({
    mutationFn: () => reclassifyTicket(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTicket', id] });
      queryClient.invalidateQueries({ queryKey: ['adminTickets'] });
      setNotification({
        type: 'success',
        title: 'AI Re-Classification Complete',
        message: 'Ticket category and priority re-evaluated.',
      });
    },
  });

  const handleGenerateDraft = async () => {
    setIsDraftLoading(true);
    try {
      const res = await generateDraft(id!);
      setDraftContent(res.draft);
      setDraftGenerated(true);
      setNotification({
        type: 'info',
        title: 'AI Draft Ready',
        message: 'Review and insert into the reply box below.',
      });
    } catch (err) {
      console.error('Draft generation failed:', err);
    } finally {
      setIsDraftLoading(false);
    }
  };

  const handleUseDraftAsReply = () => {
    if (draftContent.trim()) {
      setReplyBody(draftContent.trim());
      setActiveTab('thread');
      setNotification({
        type: 'info',
        title: 'Draft Applied',
        message: 'AI draft placed into reply box.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="p-8 text-center bg-black rounded-2xl border border-rose-500/50 text-rose-300">
        <p className="font-semibold text-white">Unable to load ticket details.</p>
        <button
          onClick={() => navigate('/admin/tickets')}
          className="mt-3 text-xs bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg cursor-pointer"
        >
          Return to Queue
        </button>
      </div>
    );
  }

  const isAssignedToMe = ticket.assigned_to === currentAdmin?.id;

  return (
    <div className="space-y-5 relative">
      {/* Toast Notification Popup */}
      {notification && (
        <div
          role="alert"
          className="fixed top-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-top-3 fade-in duration-200"
        >
          <div
            className={`p-3.5 rounded-xl border shadow-xl flex items-start gap-3 bg-black ${
              notification.type === 'success'
                ? 'border-emerald-500/80'
                : notification.type === 'error'
                ? 'border-rose-500/80'
                : 'border-indigo-500/80'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : notification.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              ) : (
                <Clock className="w-4 h-4 text-indigo-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-semibold text-white truncate">
                  {notification.title}
                </h4>
                <button
                  type="button"
                  onClick={() => setNotification(null)}
                  className="text-neutral-500 hover:text-white p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                {notification.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black p-4 rounded-2xl border border-neutral-900">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/tickets')}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-lg transition-colors cursor-pointer"
            title="Back to queue"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-neutral-500">
                #{ticket.id.slice(0, 8)}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.2 rounded ${
                  ticket.status === 'OPEN'
                    ? 'text-emerald-400 bg-emerald-950/60'
                    : ticket.status === 'IN_PROGRESS'
                    ? 'text-indigo-300 bg-indigo-950/60'
                    : ticket.status === 'RESOLVED'
                    ? 'text-teal-300 bg-teal-950/60'
                    : 'text-neutral-400 bg-neutral-900'
                }`}
              >
                {ticket.status.replace('_', ' ')}
              </span>
              {ticket.is_overridden && (
                <span className="text-[10px] text-amber-300 bg-amber-950/60 px-1.5 py-0.2 rounded">
                  Overridden
                </span>
              )}
            </div>
            <h1 className="text-base font-bold text-white mt-0.5 truncate max-w-xl">
              {ticket.subject}
            </h1>
          </div>
        </div>

        {/* Right Header Action: Assignment */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              updateMutation.mutate({
                assigned_to: isAssignedToMe ? null : currentAdmin?.id,
              })
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              isAssignedToMe
                ? 'bg-indigo-950/60 text-indigo-300 border-indigo-700/60'
                : 'bg-black text-neutral-300 border-neutral-800 hover:bg-neutral-900 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            {isAssignedToMe ? 'Assigned to You' : 'Assign to Me'}
          </button>
        </div>
      </div>

      {/* Main Grid: Left Column Context (4 cols) + Right Column Work Area (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Author, Book & Triage */}
        <div className="lg:col-span-4 space-y-4">
          {/* Author Card */}
          <div className="bg-black rounded-2xl border border-neutral-900 p-4 space-y-2.5">
            <div className="flex items-center gap-2 pb-2 border-b border-neutral-900">
              <User className="w-4 h-4 text-neutral-500" />
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-semibold text-white truncate">{ticket.author.name}</h3>
                <span className="text-[10px] font-mono text-neutral-500">
                  {ticket.author.author_code || 'AUTH'} · {ticket.author.city || 'India'}
                </span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between py-0.5">
                <span className="text-neutral-500 text-[11px]">Email</span>
                <span className="text-neutral-300 truncate max-w-[170px] text-[11px]">
                  {ticket.author.email}
                </span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-neutral-500 text-[11px]">Phone</span>
                <span className="text-neutral-300 text-[11px]">{ticket.author.phone || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Book Context Card */}
          {ticket.book ? (
            <div className="bg-black rounded-2xl border border-neutral-900 p-4 space-y-2.5">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-900">
                <BookOpen className="w-4 h-4 text-neutral-500" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-semibold text-white truncate">{ticket.book.title}</h3>
                  <span className="text-[10px] font-mono text-neutral-500">
                    {ticket.book.book_id}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-neutral-500">Status</span>
                  <span className="text-emerald-400 font-medium">{ticket.book.status}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-neutral-500">Copies Sold</span>
                  <span className="text-white font-mono">{ticket.book.copies_sold.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-neutral-500">Pending Royalty</span>
                  <span className="text-amber-400 font-mono font-medium">
                    ₹{ticket.book.royalty_pending.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-black rounded-2xl border border-neutral-900 p-3.5 text-center text-[11px] text-neutral-500 italic">
              No book attached to this inquiry
            </div>
          )}

          {/* AI Triage Card */}
          <div className="bg-black rounded-2xl border border-neutral-900 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400 flex items-center gap-1.5 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Triage Mode
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-neutral-400">
                  {ticket.ai_status === 'OK' ? 'AI Classified' : 'Manual'}
                </span>
                <button
                  type="button"
                  onClick={() => classifyMutation.mutate()}
                  disabled={classifyMutation.isPending}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer disabled:opacity-50"
                >
                  {classifyMutation.isPending ? '...' : 'Re-run'}
                </button>
              </div>
            </div>
            {ticket.ai_rationale && (
              <p className="text-[11px] text-neutral-500 leading-snug">{ticket.ai_rationale}</p>
            )}
          </div>
        </div>

        {/* Right Column: Original Query + Tabbed Area */}
        <div className="lg:col-span-8 space-y-4">
          {/* Query Summary Card */}
          <div className="bg-black rounded-2xl border border-neutral-900 p-4 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-neutral-500">
              <span className="font-medium text-neutral-400">Author Inquiry</span>
              <span className="font-mono">
                {new Date(ticket.created_at).toLocaleString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <p className="text-xs text-neutral-200 leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>

          {/* Simple Tab Switcher */}
          <div className="flex bg-black border border-neutral-900 p-1 rounded-xl gap-1">
            <button
              onClick={() => setActiveTab('thread')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'thread'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Conversation ({ticket.replies.length})
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'ai'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Draft
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'notes'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Internal Notes ({ticket.internal_notes.length})
            </button>
          </div>

          {/* TAB 1: THREAD */}
          {activeTab === 'thread' && (
            <div className="space-y-4 animate-slide-up">
              <div className="space-y-2.5">
                {ticket.replies.length > 0 ? (
                  ticket.replies.map((reply) => {
                    const isAdmin = reply.senderRole === 'ADMIN';
                    return (
                      <div
                        key={reply.id}
                        className={`rounded-xl p-3.5 border text-xs leading-relaxed ${
                          isAdmin
                            ? 'bg-neutral-950 border-neutral-800 text-white ml-3'
                            : 'bg-black border-neutral-900 text-neutral-300 mr-3'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1 text-[11px]">
                          <span className="font-semibold text-white flex items-center gap-1.5">
                            {reply.senderName}
                            <span className="text-[10px] text-neutral-500 font-normal">
                              ({reply.senderRole})
                            </span>
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono">
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
                  <div className="bg-black rounded-xl border border-neutral-900 p-6 text-center text-xs text-neutral-500">
                    No replies yet.
                  </div>
                )}
              </div>

              {/* Status Action Bar */}
              <div className="p-3 rounded-xl bg-black border border-neutral-900 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-neutral-500 text-[11px]">Status:</span>
                  <span className="text-white font-medium text-[11px]">
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {ticket.status !== 'IN_PROGRESS' && ticket.status !== 'CLOSED' && (
                    <button
                      type="button"
                      disabled={updateMutation.isPending}
                      onClick={() => updateMutation.mutate({ status: 'IN_PROGRESS' })}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-indigo-300 border border-neutral-800 transition-colors cursor-pointer"
                    >
                      <Clock className="w-3 h-3" />
                      Move to In Progress
                    </button>
                  )}

                  {ticket.status !== 'CLOSED' && (
                    <button
                      type="button"
                      disabled={updateMutation.isPending}
                      onClick={() => updateMutation.mutate({ status: 'CLOSED' })}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Close Issue
                    </button>
                  )}

                  {ticket.status === 'CLOSED' && (
                    <button
                      type="button"
                      disabled={updateMutation.isPending}
                      onClick={() => updateMutation.mutate({ status: 'IN_PROGRESS' })}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-neutral-800 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reopen Issue
                    </button>
                  )}
                </div>
              </div>

              {/* Reply Composer */}
              <div className="bg-black rounded-2xl border border-neutral-900 p-4 space-y-3">
                <textarea
                  rows={3}
                  placeholder="Type message to author..."
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-800 bg-black text-white focus:outline-none focus:border-neutral-600 text-xs placeholder-neutral-500"
                />

                <div className="flex flex-wrap items-center justify-end gap-2">
                  {ticket.status === 'OPEN' && (
                    <button
                      type="button"
                      disabled={replyMutation.isPending || updateMutation.isPending || !replyBody.trim()}
                      onClick={handleReplyAndInProgress}
                      className="inline-flex items-center gap-1 bg-neutral-900 hover:bg-neutral-800 text-indigo-300 border border-neutral-800 font-medium text-xs px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      <Clock className="w-3 h-3" />
                      Reply & In Progress
                    </button>
                  )}

                  {ticket.status !== 'CLOSED' && (
                    <button
                      type="button"
                      disabled={replyMutation.isPending || updateMutation.isPending || !replyBody.trim()}
                      onClick={handleReplyAndClose}
                      className="inline-flex items-center gap-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 font-medium text-xs px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Reply & Close
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => replyMutation.mutate(replyBody.trim())}
                    disabled={replyMutation.isPending || !replyBody.trim()}
                    className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-4 py-1.5 rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    {replyMutation.isPending ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI DRAFT */}
          {activeTab === 'ai' && (
            <div className="space-y-4 animate-slide-up">
              <div className="bg-black rounded-2xl border border-neutral-900 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Knowledge Base AI Draft
                  </h3>
                  <button
                    type="button"
                    onClick={handleGenerateDraft}
                    disabled={isDraftLoading}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isDraftLoading ? 'animate-spin' : ''}`} />
                    {draftGenerated ? 'Regenerate' : 'Generate'}
                  </button>
                </div>

                <textarea
                  rows={5}
                  placeholder="Click Generate to produce a draft reply using the BookLeaf knowledge base..."
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-800 bg-neutral-950 text-white focus:outline-none focus:border-neutral-600 text-xs placeholder-neutral-500"
                />

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-neutral-500 text-[11px]">
                    {draftContent.split(/\s+/).filter(Boolean).length} words
                  </span>
                  <button
                    type="button"
                    onClick={handleUseDraftAsReply}
                    disabled={!draftContent.trim()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Insert into Reply Box
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INTERNAL NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-4 animate-slide-up">
              <div className="bg-black rounded-2xl border border-neutral-900 p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-neutral-300">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <h3 className="text-xs font-semibold">Internal Team Notes</h3>
                </div>

                {ticket.internal_notes.length > 0 ? (
                  <div className="space-y-2">
                    {ticket.internal_notes.map((n) => (
                      <div
                        key={n.id}
                        className="p-3 bg-neutral-950 border border-neutral-900 rounded-xl text-xs space-y-1"
                      >
                        <div className="flex justify-between items-center text-[10px] text-neutral-500">
                          <span className="font-medium text-white">{n.senderName}</span>
                          <span className="font-mono">
                            {new Date(n.created_at).toLocaleString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap">{n.body}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-neutral-500 py-1">No internal notes logged.</div>
                )}

                <div className="space-y-2 pt-2 border-t border-neutral-900">
                  <textarea
                    rows={2}
                    placeholder="Add confidential note..."
                    value={internalNoteBody}
                    onChange={(e) => setInternalNoteBody(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-800 bg-neutral-950 text-white focus:outline-none focus:border-neutral-600 text-xs placeholder-neutral-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => noteMutation.mutate(internalNoteBody.trim())}
                      disabled={noteMutation.isPending || !internalNoteBody.trim()}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <FileText className="w-3 h-3" />
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
