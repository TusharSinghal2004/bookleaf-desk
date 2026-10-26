import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAuthorBooks, fetchAuthorRoyalties } from '../../api/author';
import { BookCard } from '../../components/author/BookCard';
import { BookOpen, IndianRupee, Layers, AlertCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MyBooksPage: React.FC = () => {
  const {
    data: books,
    isLoading: booksLoading,
    error: booksError,
    refetch: refetchBooks,
  } = useQuery({
    queryKey: ['authorBooks'],
    queryFn: fetchAuthorBooks,
  });

  const {
    data: royalties,
    isLoading: royaltiesLoading,
  } = useQuery({
    queryKey: ['authorRoyalties'],
    queryFn: fetchAuthorRoyalties,
  });

  if (booksLoading || royaltiesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (booksError) {
    return (
      <div className="p-8 text-center bg-rose-50 rounded-2xl border border-rose-200 text-rose-800">
        <p className="font-semibold">Unable to load your book portfolio.</p>
        <button
          onClick={() => refetchBooks()}
          className="mt-3 text-xs bg-rose-600 text-white px-3 py-1.5 rounded-lg font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  const publishedCount = books?.filter((b) => b.status.toLowerCase().includes('published')).length || 0;
  const inProductionCount = books?.filter((b) => !b.status.toLowerCase().includes('published')).length || 0;

  return (
    <div className="space-y-8">
      {/* Portfolio Header & Overall Royalties Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Published Titles
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track your book production status, catalog metadata, sales volume, and quarterly royalties.
          </p>
        </div>

        <Link
          to="/author/tickets/new"
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
        >
          Have a Query? Open Ticket
        </Link>
      </div>

      {/* Royalties & Catalog Summary Stats */}
      {royalties && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Total Royalty Earned
              </span>
              <span className="text-xl font-bold text-slate-900">
                ₹{royalties.totalEarned.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Royalty Paid Out
              </span>
              <span className="text-xl font-bold text-slate-900">
                ₹{royalties.totalPaid.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Pending Payout
              </span>
              <span className="text-xl font-bold text-amber-900">
                ₹{royalties.totalPending.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Book Catalog
              </span>
              <span className="text-xl font-bold text-slate-900">
                {publishedCount} <span className="text-xs font-normal text-slate-500">Live</span> / {inProductionCount} <span className="text-xs font-normal text-slate-500">Pipeline</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Rollover notice banner if cumulative pending is < ₹1,000 */}
      {royalties?.isRollover && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            <p className="font-semibold">Quarterly Royalty Payout Notice (KB Policy)</p>
            <p className="mt-0.5 text-xs text-amber-800">
              {royalties.rolloverNotice} BookLeaf processes bank transfers quarterly within 45 days for balances meeting or exceeding ₹1,000.
            </p>
          </div>
        </div>
      )}

      {/* Book Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            Your Books ({books?.length || 0})
          </h2>
          <button
            onClick={() => refetchBooks()}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {books && books.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            No books found in your author account.
          </div>
        )}
      </div>
    </div>
  );
};
