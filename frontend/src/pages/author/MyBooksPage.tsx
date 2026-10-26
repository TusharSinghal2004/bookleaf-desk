import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAuthorBooks, fetchAuthorRoyalties } from '../../api/author';
import { BookCard } from '../../components/author/BookCard';
import { BookOpen, IndianRupee, AlertCircle, RefreshCw, PlusCircle, CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MyBooksPage: React.FC = () => {
  const [filterTab, setFilterTab] = useState<'ALL' | 'PUBLISHED' | 'PRODUCTION'>('ALL');

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
      <div className="flex items-center justify-center min-h-[50vh]">
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

  const publishedBooks = books?.filter((b) => b.status.toLowerCase().includes('published')) || [];
  const inProductionBooks = books?.filter((b) => !b.status.toLowerCase().includes('published')) || [];

  const displayedBooks =
    filterTab === 'PUBLISHED'
      ? publishedBooks
      : filterTab === 'PRODUCTION'
      ? inProductionBooks
      : books || [];

  return (
    <div className="space-y-8">
      {/* Portfolio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Author Catalog & Royalties
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Overview of your publications, live distribution channels, and quarterly royalty earnings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetchBooks()}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/author/tickets/new"
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Open Support Query
          </Link>
        </div>
      </div>

      {/* Financial Overview Banner (Clean & Spacious) */}
      {royalties && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-emerald-600" />
              Royalty Balance Overview
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Calculated Quarterly (80/20 Net Profit)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-1">
            <div>
              <span className="text-xs font-medium text-slate-400 block">Total Royalty Earned</span>
              <span className="text-2xl font-black text-slate-900 mt-0.5 block">
                ₹{royalties.totalEarned.toLocaleString('en-IN')}
              </span>
            </div>

            <div>
              <span className="text-xs font-medium text-slate-400 block">Total Payouts Disbursed</span>
              <span className="text-2xl font-black text-emerald-600 mt-0.5 block">
                ₹{royalties.totalPaid.toLocaleString('en-IN')}
              </span>
            </div>

            <div>
              <span className="text-xs font-medium text-slate-400 block">Pending Next Quarter</span>
              <span className="text-2xl font-black text-amber-900 mt-0.5 block">
                ₹{royalties.totalPending.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Rollover Notification */}
          {royalties.isRollover && (
            <div className="mt-3 p-3 bg-amber-50/90 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong className="font-semibold">Quarterly Rollover Notice: </strong>
                {royalties.rolloverNotice}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Segmented Filter Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterTab === 'ALL'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All Books ({books?.length || 0})
          </button>
          <button
            onClick={() => setFilterTab('PUBLISHED')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterTab === 'PUBLISHED'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Live & Published ({publishedBooks.length})
          </button>
          <button
            onClick={() => setFilterTab('PRODUCTION')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterTab === 'PRODUCTION'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            In Production ({inProductionBooks.length})
          </button>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Showing {displayedBooks.length} title{displayedBooks.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Book Grid */}
      {displayedBooks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
          <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">No books found in this view.</p>
          <p className="text-xs text-slate-400">Try switching to the "All Books" tab.</p>
        </div>
      )}
    </div>
  );
};
