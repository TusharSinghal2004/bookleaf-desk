import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchAuthorBooks, createTicket } from '../../api/author';
import {
  Send,
  Paperclip,
  X,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Clock,
  HelpCircle,
} from 'lucide-react';
import {
  KNOWLEDGE_BASE_ARTICLES,
  findMatchingKnowledge,
  KnowledgeArticle,
} from '../../data/knowledgeBase';

export const NewTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedBookId = (location.state as { bookId?: string })?.bookId || '';
  const [selectedBookId, setSelectedBookId] = useState<string>(preselectedBookId);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [attachmentSize, setAttachmentSize] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedTopicArticle, setSelectedTopicArticle] = useState<KnowledgeArticle | null>(null);

  const { data: books, isLoading: booksLoading } = useQuery({
    queryKey: ['authorBooks'],
    queryFn: fetchAuthorBooks,
  });

  // Dynamic knowledge base policy matches based on user input
  const dynamicKbMatches = useMemo(() => {
    const combined = `${subject} ${description}`;
    return findMatchingKnowledge(combined);
  }, [subject, description]);

  // Article to highlight: explicitly chosen or best dynamic match
  const activeArticle = selectedTopicArticle || (dynamicKbMatches.length > 0 ? dynamicKbMatches[0] : null);

  const ticketMutation = useMutation({
    mutationFn: createTicket,
    onSuccess: (data) => {
      navigate(`/author/tickets/${data.id}`);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to submit ticket. Please try again.');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
      setAttachmentSize((file.size / 1024).toFixed(1) + ' KB');
    }
  };

  const removeAttachment = () => {
    setAttachmentName(null);
    setAttachmentSize(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (subject.trim().length < 3) {
      setErrorMsg('Subject must be at least 3 characters long.');
      return;
    }
    if (description.trim().length < 10) {
      setErrorMsg('Description must provide at least 10 characters with specific details.');
      return;
    }

    ticketMutation.mutate({
      book_id: selectedBookId ? selectedBookId : null,
      subject: subject.trim(),
      description: description.trim(),
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <div className="bg-black rounded-2xl border border-neutral-900 p-6 sm:p-8 space-y-6">
        <div className="border-b border-neutral-900 pb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Submit a Support Query
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Our author support team typically responds within 24–48 hours.
          </p>
        </div>

        {/* Quick Knowledge Base Topic Filter Chips */}
        <div className="space-y-2">
          <span className="text-[11px] font-medium text-neutral-400 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
            Check Official Knowledge Base Policies First
          </span>
          <div className="flex flex-wrap gap-1.5">
            {KNOWLEDGE_BASE_ARTICLES.map((article) => {
              const isSelected = activeArticle?.id === article.id;
              return (
                <button
                  key={article.id}
                  type="button"
                  onClick={() =>
                    setSelectedTopicArticle(isSelected ? null : article)
                  }
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/60'
                      : 'bg-black text-neutral-400 border border-neutral-900 hover:border-neutral-700 hover:text-white'
                  }`}
                >
                  {article.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Knowledge Base Assist Card */}
        {activeArticle && (
          <div className="p-4 rounded-xl bg-neutral-950 border border-emerald-500/30 space-y-2.5 text-xs animate-slide-up">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                BookLeaf Policy: {activeArticle.title}
              </span>
              <span className="text-[10px] text-neutral-400 flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-emerald-500" />
                {activeArticle.slaOrTurnaround}
              </span>
            </div>
            <p className="text-neutral-300 leading-relaxed text-xs">
              {activeArticle.summary}
            </p>
            <ul className="space-y-1 text-neutral-400 text-[11px] list-disc list-inside">
              {activeArticle.keyPoints.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 bg-black border border-rose-500/60 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Unable to submit ticket</p>
              <p className="text-[11px] mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Book Scope Dropdown */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Select Book Related to Query
            </label>
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-800 bg-black text-white focus:outline-none focus:border-emerald-500 text-xs"
              disabled={booksLoading}
            >
              <option value="" className="bg-neutral-900 text-white">General / Account Level (Not book-specific)</option>
              {books?.map((b) => (
                <option key={b.id} value={b.id} className="bg-neutral-900 text-white">
                  {b.book_id} — {b.title} ({b.status})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-neutral-500 mt-1">
              Selecting a book automatically links sales, inventory, and production data to your inquiry.
            </p>
          </div>

          {/* Subject Line */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Subject Line *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Delay in October royalty payment, or duplicate ISBN on Amazon"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-800 bg-black text-white placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500 text-xs"
            />
          </div>

          {/* Detailed Description */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-neutral-300">
                Detailed Description *
              </label>
              <span className="text-[11px] text-neutral-500">
                {description.length} chars (min 10)
              </span>
            </div>
            <textarea
              required
              rows={4}
              placeholder="Provide exact details, dates, platforms, or copies so our team can investigate immediately."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-800 bg-black text-white placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500 text-xs leading-relaxed"
            />
          </div>

          {/* Optional File Attachment UI */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Attach Supporting Image / Document (Optional)
            </label>
            {!attachmentName ? (
              <label className="flex flex-col items-center justify-center p-4 border border-dashed border-neutral-800 rounded-xl cursor-pointer hover:border-neutral-700 transition-colors">
                <Paperclip className="w-5 h-5 text-neutral-500 mb-1" />
                <span className="text-xs text-neutral-300">
                  Select file (photo of misprint, screenshot, statement)
                </span>
                <span className="text-[10px] text-neutral-500 mt-0.5">PNG, JPG, PDF up to 10MB</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*,.pdf"
                />
              </label>
            ) : (
              <div className="flex items-center justify-between p-3 bg-black border border-emerald-500/40 rounded-xl">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-xs font-medium text-white block">
                      {attachmentName}
                    </span>
                    <span className="text-[10px] text-emerald-400">{attachmentSize}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeAttachment}
                  className="p-1 hover:bg-neutral-900 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={ticketMutation.isPending}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-5 py-2 rounded-xl disabled:opacity-50 transition-colors cursor-pointer"
            >
              {ticketMutation.isPending ? (
                <>Submitting...</>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Submit Support Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
