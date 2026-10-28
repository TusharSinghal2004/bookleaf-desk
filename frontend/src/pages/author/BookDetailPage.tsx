import React, { useState } from 'react';
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
  BookOpen,
  Tag,
  TrendingUp,
  BookMarked,
  ChevronDown,
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
  const [isPolicyExpanded, setIsPolicyExpanded] = useState(true);

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
      <div className="flex items-center justify-center min-h-[60vh] w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="w-full max-w-2xl mx-auto p-8 bg-black border border-rose-500/50 rounded-2xl text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h2 className="text-base font-bold text-white">Book Not Found</h2>
        <p className="text-xs text-rose-300">
          {(error as any)?.message || 'The requested book details could not be loaded.'}
        </p>
        <button
          onClick={() => navigate('/author/books')}
          className="mt-2 text-xs bg-rose-600 hover:bg-rose-500 text-white font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
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
    <div className="w-full space-y-6">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/author/books')}
          className="inline-flex items-center gap-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Books
        </button>

        <span className="text-xs font-mono text-neutral-500">
          Book ID: {book.book_id}
        </span>
      </div>

      {/* Main Full-Width Content: NO Outer Bounding Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
        {/* Left Column: Book Cover & Action (lg:col-span-4 or col-span-3) */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col items-center lg:items-start space-y-4">
          <div className="w-full max-w-[260px] mx-auto lg:mx-0">
            <BookCover title={book.title} genre={book.genre} size="lg" className="w-full" />
          </div>

          <div className="w-full max-w-[260px] mx-auto lg:mx-0 space-y-2 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2">
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${
                  isPublished
                    ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-500/40'
                    : 'text-amber-400 bg-amber-950/60 border border-amber-500/40'
                }`}
              >
                {isPublished ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                {book.status}
              </span>
            </div>

            <Link
              to={`/author/tickets/new`}
              state={{ bookId: book.id }}
              className="w-full inline-flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white text-xs font-medium py-2.5 px-4 rounded-xl transition-colors"
            >
              <LifeBuoy className="w-4 h-4 text-emerald-400" />
              Need Help With This Book?
            </Link>
          </div>
        </div>

        {/* Right Column: Full Details, Metrics & Continuous Sections (lg:col-span-8 or col-span-9) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* Header Area */}
          <div className="border-b border-neutral-900 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-emerald-400">
                {book.genre}
              </span>
              <span className="text-neutral-600">·</span>
              <span className="text-xs font-mono text-neutral-500 flex items-center gap-1">
                <Barcode className="w-3.5 h-3.5 text-neutral-600" />
                {book.isbn || 'ISBN Pending'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
              {book.title}
            </h1>
          </div>

          {/* If Published: Sales & Royalties Detailed View */}
          {isPublished ? (
            <div className="space-y-6">
              {/* Financial Metrics Row */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-emerald-400" />
                    Sales & Royalty Statement
                  </span>
                  <span className="text-[11px] text-neutral-500">Live Author Payout Data</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-900">
                    <span className="text-xs text-neutral-400 block">Total Royalty Earned</span>
                    <span className="text-2xl sm:text-3xl font-bold text-white mt-1 block font-mono">
                      ₹{book.royalty_earned.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-900">
                    <span className="text-xs text-neutral-400 block">Royalty Paid Out</span>
                    <span className="text-2xl sm:text-3xl font-bold text-emerald-400 mt-1 block font-mono">
                      ₹{book.royalty_paid.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-900">
                    <span className="text-xs text-neutral-400 block">Pending Payout</span>
                    <span className="text-2xl sm:text-3xl font-bold text-amber-400 mt-1 block font-mono">
                      ₹{book.royalty_pending.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Unit Economics & Circulation Table */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Unit Economics & Circulation
                </span>
                <div className="rounded-xl border border-neutral-900 divide-y divide-neutral-900 overflow-hidden text-xs">
                  <div className="flex items-center justify-between p-3.5 hover:bg-neutral-950/50 transition-colors">
                    <span className="text-neutral-400 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-neutral-500" />
                      Total Copies Sold
                    </span>
                    <span className="font-semibold text-white font-mono text-sm">
                      {book.copies_sold.toLocaleString('en-IN')} copies
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 hover:bg-neutral-950/50 transition-colors">
                    <span className="text-neutral-400 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-neutral-500" />
                      Retail Price (MRP)
                    </span>
                    <span className="font-semibold text-white font-mono text-sm">
                      ₹{book.mrp ?? 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 hover:bg-neutral-950/50 transition-colors">
                    <span className="text-neutral-400 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-neutral-500" />
                      Author Royalty Per Copy
                    </span>
                    <span className="font-semibold text-emerald-400 font-mono text-sm">
                      ₹{book.royalty_per_copy ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rollover notice if below threshold */}
              {isRollover && (
                <div className="border border-amber-500/40 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-300 bg-amber-950/20">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-amber-200">Quarterly Rollover Notice</span>
                    <p className="mt-0.5 text-amber-300/90 leading-relaxed text-xs">
                      ₹{book.royalty_pending.toLocaleString('en-IN')} pending is below the ₹1,000 threshold and will roll over to the next quarter per BookLeaf Knowledge Base policy.
                    </p>
                  </div>
                </div>
              )}

              {/* Distribution & Print Partner Details */}
              <div className="rounded-xl border border-neutral-900 p-4 space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-neutral-400 flex items-center gap-2">
                    <Store className="w-4 h-4 text-neutral-500" />
                    Available Distribution Channels
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {book.available_on.length > 0 ? (
                      book.available_on.map((channel) => (
                        <span
                          key={channel}
                          className="text-xs font-medium bg-neutral-900 border border-neutral-800 text-neutral-200 px-2.5 py-1 rounded-lg"
                        >
                          {channel}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-neutral-500 italic">Distribution setup active</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2.5 border-t border-neutral-900">
                  <span className="text-neutral-400 flex items-center gap-2">
                    <Printer className="w-4 h-4 text-neutral-500" />
                    Publishing & Fulfillment Partner
                  </span>
                  <span className="text-neutral-300 font-medium flex items-center gap-2">
                    <span>{book.print_partner || 'In-House Facility (Delhi)'}</span>
                    {book.publication_date && (
                      <span className="text-neutral-500 text-[11px] flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        Live Since {new Date(book.publication_date).toLocaleDateString('en-IN', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* If In Production: Clean Milestone Progression */
            <div className="space-y-6">
              <div className="border border-amber-500/30 rounded-xl p-4 space-y-1 text-xs text-amber-200 bg-amber-950/20">
                <div className="flex items-center gap-2 font-semibold text-amber-300 text-sm">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Currently in Publication Pipeline
                </div>
                <p className="text-amber-200/90 text-xs leading-relaxed">
                  This book is actively in preparation with the editorial and design teams. Milestones update automatically.
                </p>
              </div>

              <div className="space-y-2.5">
                <h3 className="text-xs font-semibold text-neutral-400">
                  Production Timeline Progression
                </h3>

                <div className="border border-neutral-900 rounded-xl divide-y divide-neutral-900 overflow-hidden">
                  {PRODUCTION_STAGES.map((stage, idx) => {
                    const isDone = idx < activeStageIdx;
                    const isCurrent = idx === activeStageIdx;
                    return (
                      <div
                        key={stage}
                        className={`flex items-center justify-between px-4 py-3 text-xs transition-colors ${
                          isCurrent ? 'bg-neutral-950' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              isCurrent
                                ? 'bg-amber-400 ring-4 ring-amber-400/20'
                                : isDone
                                ? 'bg-emerald-400'
                                : 'bg-neutral-800'
                            }`}
                          />
                          <span
                            className={`${
                              isCurrent
                                ? 'text-white font-semibold'
                                : isDone
                                ? 'text-neutral-300'
                                : 'text-neutral-600'
                            }`}
                          >
                            {stage}
                          </span>
                        </div>

                        {isCurrent && (
                          <span className="text-[10px] font-semibold text-amber-300 bg-amber-950/60 border border-amber-500/50 px-2 py-0.5 rounded">
                            Current Step
                          </span>
                        )}
                        {isDone && (
                          <span className="text-[10px] font-medium text-emerald-400">
                            Completed
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Author Knowledge Base & Policy Guidelines (Full Width Section) */}
          <div className="rounded-xl border border-neutral-900 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsPolicyExpanded(!isPolicyExpanded)}
              className="w-full p-4 flex items-center justify-between text-left text-xs hover:bg-neutral-950 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <BookMarked className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-white text-sm">
                  BookLeaf Author Policy Guidelines
                </span>
                <span className="text-xs text-neutral-500 font-mono hidden sm:inline">
                  (Official Knowledge Base)
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-neutral-500 transition-transform ${
                  isPolicyExpanded ? 'rotate-180 text-emerald-400' : ''
                }`}
              />
            </button>

            {isPolicyExpanded && (
              <div className="p-4 pt-1 text-xs border-t border-neutral-900 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-neutral-950/60 border border-neutral-900 space-y-1.5">
                  <span className="font-semibold text-emerald-400 block text-xs">
                    80/20 Royalty Split
                  </span>
                  <p className="text-neutral-400 text-[11px] leading-relaxed">
                    80% of net profit per copy is paid to the author. Calculated quarterly and paid within 45 days. Minimum payout threshold is ₹1,000 (balances below roll over).
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-neutral-950/60 border border-neutral-900 space-y-1.5">
                  <span className="font-semibold text-emerald-400 block text-xs">
                    Print Quality & Free Reprints
                  </span>
                  <p className="text-neutral-400 text-[11px] leading-relaxed">
                    Standard fulfillment turnaround is 5–7 business days. In the event of a physical misprint or defective copy, BookLeaf provides an expedited free reprint upon photo verification.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-neutral-950/60 border border-neutral-900 space-y-1.5">
                  <span className="font-semibold text-emerald-400 block text-xs">
                    Marketplace Distribution Sync
                  </span>
                  <p className="text-neutral-400 text-[11px] leading-relaxed">
                    Distributed across Amazon India, Flipkart, BookLeaf Store, and Amazon US/UK. Out-of-stock listings are re-synced with marketplace teams within 24–48 hours.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
