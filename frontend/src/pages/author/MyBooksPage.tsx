import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAuthorBooks, fetchAuthorRoyalties } from '../../api/author';
import { BookCard } from '../../components/author/BookCard';
import { BookOpen, IndianRupee, AlertCircle, RefreshCw, PlusCircle, CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const MyBooksPage: React.FC = () => {
  const { user } = useAuth();
  const [filterTab, setFilterTab] = useState<'ALL' | 'PUBLISHED' | 'PRODUCTION'>('ALL');

  const {
    data: books,
    isLoading: booksLoading,
    error: booksError,
    refetch: refetchBooks,
  } = useQuery({
    queryKey: ['authorBooks', user?.id],
    queryFn: fetchAuthorBooks,
    enabled: Boolean(user?.id),
  });

  const {
    data: royalties,
    isLoading: royaltiesLoading,
  } = useQuery({
    queryKey: ['authorRoyalties', user?.id],
    queryFn: fetchAuthorRoyalties,
    enabled: Boolean(user?.id),
  });

  if (booksLoading || royaltiesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (booksError) {
    return (
      <div className="p-8 text-center border border-rose-500/50 rounded-2xl text-rose-300">
        <p className="font-semibold text-white">Unable to load your book portfolio.</p>
        <button
          onClick={() => refetchBooks()}
          className="mt-3 text-xs bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg font-medium cursor-pointer"
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">My Books & Royalties</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Your publications, earnings, and distribution overview.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetchBooks()}
            className="p-2 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/author/tickets/new"
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            New Support Query
          </Link>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Royalty Summary */}
        <div className="lg:col-span-4 lg:sticky lg:top-24">
          {royalties && (
            <div className="rounded-2xl border border-neutral-800 p-6 space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-300">
                <IndianRupee className="w-4 h-4 text-emerald-400" />
                Royalty Summary
              </div>

              {/* Clean list instead of boxed cards */}
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-neutral-500">Total Earned</div>
                  <div className="text-2xl font-bold text-white mt-0.5">
                    ₹{royalties.totalEarned.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="h-px bg-neutral-900" />
                <div>
                  <div className="text-xs text-neutral-500">Paid Out</div>
                  <div className="text-2xl font-bold text-emerald-400 mt-0.5">
                    ₹{royalties.totalPaid.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="h-px bg-neutral-900" />
                <div>
                  <div className="text-xs text-neutral-500">Pending Next Quarter</div>
                  <div className="text-2xl font-bold text-amber-400 mt-0.5">
                    ₹{royalties.totalPending.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Rollover notice */}
              {royalties.isRollover && (
                <>
                  <div className="h-px bg-neutral-900" />
                  <div className="flex items-start gap-2 text-xs text-amber-300">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{royalties.rolloverNotice}</span>
                  </div>
                </>
              )}

              <div className="text-[11px] text-neutral-600 pt-2 border-t border-neutral-900 text-center">
                Min payout ₹1,000 · Quarterly cycle
              </div>
            </div>
          )}
        </div>

        {/* Right: Books */}
        <div className="lg:col-span-8 space-y-5">
          {/* Filter tabs */}
          <div className="flex items-center gap-2">
            {[
              { key: 'ALL' as const, label: `All (${books?.length || 0})` },
              { key: 'PUBLISHED' as const, label: `Published (${publishedBooks.length})`, icon: CheckCircle2 },
              { key: 'PRODUCTION' as const, label: `In Production (${inProductionBooks.length})`, icon: Clock },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterTab === tab.key
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Book Grid */}
          {displayedBooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
              {displayedBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-neutral-800 p-12 text-center text-neutral-400 space-y-2">
              <BookOpen className="w-8 h-8 mx-auto text-neutral-600" />
              <p className="text-sm font-semibold text-white">No books in this view.</p>
              <p className="text-xs">Try the "All" tab.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
