import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchAuthorBookById } from '../../api/author';
import { BookCover } from '../../components/author/BookCover';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Store,
  AlertCircle,
  IndianRupee,
  LifeBuoy,
  Printer,
  Calendar,
  Sparkles,
  Barcode,
} from 'lucide-react';

const PRODUCTION_STAGES = [
  'Manuscript Received',
  'Cover Design',
  'Typesetting',
  'Proofreading',
  'ISBN Assignment',
  'Printing',
  'Distribution Setup',
  'Published & Live',
];

export const BookDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: book,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['authorBook', id],
    queryFn: () => fetchAuthorBookById(id!),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
        <h2 className="text-base font-bold text-rose-900">Book Not Found</h2>
        <p className="text-xs text-rose-700">
          {(error as any)?.message || 'The requested book details could not be loaded.'}
        </p>
        <button
          onClick={() => navigate('/author/books')}
          className="mt-2 text-xs bg-rose-600 text-white font-semibold px-4 py-2 rounded-xl"
        >
          Return to My Books
        </button>
      </div>
    );
  }

  const isPublished = book.status.toLowerCase().includes('published');
  const isRollover = book.royalty_pending > 0 && book.royalty_pending < 1000;

  const getCurrentStageIndex = () => {
    const statusLower = book.status.toLowerCase();
    if (statusLower.includes('cover design')) return 1;
    if (statusLower.includes('typesetting')) return 2;
    if (statusLower.includes('proofreading')) return 3;
    if (statusLower.includes('isbn')) return 4;
    if (statusLower.includes('printing')) return 5;
    if (statusLower.includes('distribution')) return 6;
    if (isPublished) return 7;
    return 0;
  };

  const activeStageIdx = getCurrentStageIndex();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Back Navigation */}
      <button
        onClick={() => navigate('/author/books')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to All Books
      </button>

      {/* Main Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Column: Book Cover & Action Button (4 cols) */}
          <div className="md:col-span-4 flex flex-col items-center space-y-5">
            <div className="w-full max-w-[240px] drop-shadow-xl">
              <BookCover title={book.title} genre={book.genre} size="lg" className="mx-auto" />
            </div>

            <div className="w-full space-y-2 text-center">
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
                  isPublished
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {isPublished ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                {book.status}
              </span>
              <p className="text-[11px] text-slate-400 font-mono">Book ID: {book.book_id}</p>
            </div>

            {/* Quick Support Action */}
            <Link
              to={`/author/tickets/new`}
              state={{ bookId: book.id }}
              className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-3 px-4 rounded-2xl shadow-xs transition-all"
            >
              <LifeBuoy className="w-4 h-4 text-emerald-400" />
              Need Help With This Book?
            </Link>
          </div>

          {/* Right Column: Full Details, Metrics & Channels (8 cols) */}
          <div className="md:col-span-8 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100">
                  {book.genre}
                </span>
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Barcode className="w-3.5 h-3.5" />
                  {book.isbn || 'ISBN Pending'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                {book.title}
              </h1>
            </div>

            {/* If Published: Sales & Royalties Detailed Grid */}
            {isPublished ? (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <IndianRupee className="w-4 h-4 text-emerald-600" />
                    Sales & Royalty Breakdown
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Copies Sold
                      </span>
                      <span className="text-lg font-black text-slate-900 mt-0.5 block">
                        {book.copies_sold.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Retail Price (MRP)
                      </span>
                      <span className="text-lg font-black text-slate-900 mt-0.5 block">
                        ₹{book.mrp ?? 0}
                      </span>
                    </div>

                    <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Author Royalty / Copy
                      </span>
                      <span className="text-lg font-black text-slate-900 mt-0.5 block">
                        ₹{book.royalty_per_copy ?? 0}
                      </span>
                    </div>

                    <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Total Royalty Earned
                      </span>
                      <span className="text-lg font-black text-emerald-600 mt-0.5 block">
                        ₹{book.royalty_earned.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Royalty Paid Out
                      </span>
                      <span className="text-lg font-black text-slate-900 mt-0.5 block">
                        ₹{book.royalty_paid.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200/70">
                      <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                        Pending Payout
                      </span>
                      <span className="text-lg font-black text-amber-900 mt-0.5 block">
                        ₹{book.royalty_pending.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub-threshold Rollover notice */}
                {isRollover && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Quarterly Rollover Notice</span>
                      <p className="mt-0.5 text-amber-800">
                        ₹{book.royalty_pending.toLocaleString('en-IN')} pending is below the ₹1,000 threshold and will roll over to the next quarter per BookLeaf Knowledge Base policy.
                      </p>
                    </div>
                  </div>
                )}

                {/* Distribution & Production Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-slate-500" />
                      Available Distribution Channels
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {book.available_on.length > 0 ? (
                        book.available_on.map((channel) => (
                          <span
                            key={channel}
                            className="text-xs font-semibold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg"
                          >
                            {channel}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">Distribution setup active</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Printer className="w-4 h-4 text-slate-500" />
                      Publishing & Fulfillment Partner
                    </span>
                    <p className="text-xs text-slate-800 font-medium">
                      {book.print_partner || 'In-House Fulfillment Facility (Delhi)'}
                    </p>
                    {book.publication_date && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Live Since:{' '}
                        {new Date(book.publication_date).toLocaleDateString('en-IN', {
                          month: 'short',
                          year: 'numeric',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* If In Production: Clean Milestone Stepper */
              <div className="space-y-6">
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 space-y-1.5 text-xs text-amber-900">
                  <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    Currently in Publication Pipeline
                  </div>
                  <p className="text-amber-800">
                    This book is actively in preparation with the BookLeaf design and editorial teams. Milestones are updated automatically.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Production Timeline Progression
                  </h3>

                  <div className="space-y-2">
                    {PRODUCTION_STAGES.map((stage, idx) => {
                      const isDone = idx < activeStageIdx;
                      const isCurrent = idx === activeStageIdx;
                      return (
                        <div
                          key={stage}
                          className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs transition-all ${
                            isCurrent
                              ? 'bg-amber-100/80 text-amber-950 font-bold border border-amber-300'
                              : isDone
                              ? 'text-emerald-800 bg-emerald-50/60 font-semibold'
                              : 'text-slate-400 bg-slate-50/60'
                          }`}
                        >
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${
                              isCurrent
                                ? 'bg-amber-500 ring-4 ring-amber-200'
                                : isDone
                                ? 'bg-emerald-500'
                                : 'bg-slate-300'
                            }`}
                          />
                          <span className="text-sm">{stage}</span>
                          {isCurrent && (
                            <span className="ml-auto text-[10px] font-extrabold uppercase text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-md">
                              Current Milestone
                            </span>
                          )}
                          {isDone && (
                            <span className="ml-auto text-[10px] font-bold text-emerald-700">
                              Completed
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500">
                  * Sales volume, royalties, pricing, and live marketplace distribution links will appear automatically once publication is live.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
