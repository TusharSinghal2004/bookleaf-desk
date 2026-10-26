import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchAuthorBooks, createTicket } from '../../api/author';
import { Send, Paperclip, X, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const NewTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [attachmentSize, setAttachmentSize] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: books, isLoading: booksLoading } = useQuery({
    queryKey: ['authorBooks'],
    queryFn: fetchAuthorBooks,
  });

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
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
        <div className="border-b border-slate-100 pb-5 mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Submit a Support Query
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Reach out to BookLeaf author support. Our team responds within 24-48 hours.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-sm text-rose-800">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Unable to submit ticket</p>
              <p className="text-xs mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Book Scope Dropdown */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Select Book Related to Query
            </label>
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
              disabled={booksLoading}
            >
              <option value="">General / Account Level (Not book-specific)</option>
              {books?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.book_id} — {b.title} ({b.status})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Select specific title to provide immediate context for fast resolution.
            </p>
          </div>

          {/* Subject Line */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Subject Line *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Delay in October royalty payment, or ISBN duplicate on Amazon"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          {/* Detailed Description */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Detailed Description *
              </label>
              <span className="text-[11px] text-slate-400">
                {description.length} chars (min 10)
              </span>
            </div>
            <textarea
              required
              rows={5}
              placeholder="Provide exact details, dates, platform names, or order numbers so our team can investigate immediately."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm leading-relaxed"
            />
          </div>

          {/* Optional File Attachment UI */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Attach Supporting Image / Document (Optional)
            </label>
            {!attachmentName ? (
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                <Paperclip className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-semibold text-slate-700">
                  Click to select file (misprint photo, invoice, screenshot)
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, PDF up to 10MB</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*,.pdf"
                />
              </label>
            ) : (
              <div className="flex items-center justify-between p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="text-xs font-semibold text-emerald-950 block">
                      {attachmentName}
                    </span>
                    <span className="text-[10px] text-emerald-700">{attachmentSize}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeAttachment}
                  className="p-1 hover:bg-emerald-200/50 rounded-lg text-emerald-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={ticketMutation.isPending}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
            >
              {ticketMutation.isPending ? (
                <>Submitting...</>
              ) : (
                <>
                  <Send className="w-4 h-4" />
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
