import React from 'react';
import { Link } from 'react-router-dom';
import { Book } from '../../api/author';
import { BookCover } from './BookCover';
import { CheckCircle, Clock, ArrowRight } from 'lucide-react';

interface BookCardProps {
  book: Book;
}

export const BookCard: React.FC<BookCardProps> = ({ book }) => {
  const isPublished = book.status.toLowerCase().includes('published');

  return (
    <Link
      to={`/author/books/${book.id}`}
      className="group bg-white rounded-3xl border border-slate-200/90 hover:border-emerald-300 shadow-xs hover:shadow-xl transition-all duration-300 p-5 flex flex-col justify-between overflow-hidden hover:-translate-y-1"
    >
      {/* Visual Book Cover Photo */}
      <div className="w-full mb-4 flex justify-center">
        <BookCover title={book.title} genre={book.genre} size="md" />
      </div>

      {/* Book Metadata: Name & Genre & Status */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg font-mono">
            {book.book_id}
          </span>
          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
              isPublished
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                : 'bg-amber-50 text-amber-800 border border-amber-200/60'
            }`}
          >
            {isPublished ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            {isPublished ? 'Published & Live' : 'In Production'}
          </span>
        </div>

        <div>
          <h3 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
            {book.title}
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">{book.genre}</p>
        </div>

        {/* View Details Hint */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600 group-hover:text-emerald-700">
          <span>View Details & Royalties</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
};
