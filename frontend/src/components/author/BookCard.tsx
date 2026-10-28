import React from 'react';
import { Link } from 'react-router-dom';
import { Book } from '../../api/author';
import { BookCover } from './BookCover';
import { ArrowRight } from 'lucide-react';

interface BookCardProps {
  book: Book;
}

export const BookCard: React.FC<BookCardProps> = ({ book }) => {
  const isPublished = book.status.toLowerCase().includes('published');

  return (
    <Link
      to={`/author/books/${book.id}`}
      className="group bg-black rounded-2xl border border-neutral-900 hover:border-neutral-700 transition-colors p-5 flex flex-col justify-between"
    >
      {/* Visual Book Cover Photo */}
      <div className="w-full mb-4 flex justify-center">
        <BookCover title={book.title} genre={book.genre} size="md" />
      </div>

      {/* Book Metadata: Name & Genre & Status */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-neutral-500 font-mono text-xs">
            {book.book_id}
          </span>
          <span
            className={`text-xs font-medium flex items-center gap-1.5 ${
              isPublished ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isPublished ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            {isPublished ? 'Published' : 'In Production'}
          </span>
        </div>

        <div>
          <h3 className="text-base font-semibold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
            {book.title}
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">{book.genre}</p>
        </div>

        {/* View Details Hint */}
        <div className="pt-3 border-t border-neutral-900 flex items-center justify-between text-xs text-neutral-400 group-hover:text-white transition-colors">
          <span>View details</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
};
