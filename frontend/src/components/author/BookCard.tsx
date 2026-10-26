import React from 'react';
import { Book } from '../../api/author';
import { CheckCircle, Clock, Store, AlertCircle, Sparkles } from 'lucide-react';

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

interface BookCardProps {
  book: Book;
}

export const BookCard: React.FC<BookCardProps> = ({ book }) => {
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
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg">
                {book.book_id}
              </span>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100/80">
                {book.genre}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 truncate" title={book.title}>
              {book.title}
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              ISBN: <span className="text-slate-600 font-medium">{book.isbn || 'Pending Allocation'}</span>
            </p>
          </div>

          <span
            className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
              isPublished
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                : 'bg-amber-50 text-amber-800 border border-amber-200/70'
            }`}
          >
            {isPublished ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
            {book.status}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
        {isPublished ? (
          <>
            {/* Sales & Royalty Numbers */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Copies Sold
                </span>
                <span className="text-base font-extrabold text-slate-800">
                  {book.copies_sold.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  MRP / Price
                </span>
                <span className="text-base font-extrabold text-slate-800">₹{book.mrp ?? 0}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Earned
                </span>
                <span className="text-base font-extrabold text-emerald-600">
                  ₹{book.royalty_earned.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Pending Payout
                </span>
                <span className="text-base font-extrabold text-slate-900">
                  ₹{book.royalty_pending.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Sub-threshold Rollover notice */}
            {isRollover && (
              <div className="bg-amber-50/80 border border-amber-200/70 rounded-xl p-2.5 flex items-start gap-2 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-snug">
                  ₹{book.royalty_pending.toLocaleString('en-IN')} is below the ₹1,000 threshold and rolls over to next quarter per KB policy.
                </span>
              </div>
            )}

            {/* Platform distribution tags */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
                <Store className="w-3 h-3" />
                Available Channels
              </span>
              <div className="flex flex-wrap gap-1.5">
                {book.available_on.length > 0 ? (
                  book.available_on.map((p) => (
                    <span
                      key={p}
                      className="text-[11px] bg-slate-100 font-medium text-slate-700 px-2.5 py-0.5 rounded-lg"
                    >
                      {p}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">Distribution setup in progress</span>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Production Timeline Stepper for In-Production Books (e.g. BK013, BK015) */
          <div className="space-y-4">
            <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Production in Progress</span>
                <span className="text-amber-800 text-[11px]">
                  BookLeaf operations is preparing your files. Authors are notified at each milestone.
                </span>
              </div>
            </div>

            {/* Stage Progress Stepper */}
            <div className="space-y-1.5">
              {PRODUCTION_STAGES.slice(0, 5).map((stage, idx) => {
                const isDone = idx < activeStageIdx;
                const isCurrent = idx === activeStageIdx;
                return (
                  <div
                    key={stage}
                    className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs transition-colors ${
                      isCurrent
                        ? 'bg-amber-100/70 text-amber-950 font-bold border border-amber-200'
                        : isDone
                        ? 'text-emerald-800 bg-emerald-50/50'
                        : 'text-slate-400'
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isCurrent
                          ? 'bg-amber-500 ring-4 ring-amber-200'
                          : isDone
                          ? 'bg-emerald-500'
                          : 'bg-slate-300'
                      }`}
                    />
                    <span>{stage}</span>
                    {isCurrent && (
                      <span className="ml-auto text-[10px] font-extrabold uppercase text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-md">
                        Active
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>
          {isPublished && book.publication_date
            ? `Live since: ${new Date(book.publication_date).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
              })}`
            : 'Pre-Publication Pipeline'}
        </span>
        {book.print_partner && (
          <span className="font-medium text-slate-600">Print: {book.print_partner}</span>
        )}
      </div>
    </div>
  );
};
