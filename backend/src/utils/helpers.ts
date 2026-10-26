import { Book } from '@prisma/client';

/**
 * Safely parses a stringified JSON array of platform names.
 * Returns an empty array if input is null, undefined, empty, or malformed.
 */
export function parsePlatforms(str: string | null | undefined): string[] {
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Domain mapper for Book to API response shape.
 * Guarantees available_on is serialized as a string array, and handles nulls cleanly.
 */
export function mapBookToApi(book: Book) {
  return {
    id: book.id,
    book_id: book.book_id,
    author_id: book.author_id,
    title: book.title,
    isbn: book.isbn,
    genre: book.genre,
    publication_date: book.publication_date ? book.publication_date.toISOString() : null,
    status: book.status,
    mrp: book.mrp,
    royalty_per_copy: book.royalty_per_copy,
    copies_sold: book.copies_sold,
    royalty_earned: book.royalty_earned,
    royalty_paid: book.royalty_paid,
    royalty_pending: book.royalty_pending,
    last_payout_date: book.last_payout_date ? book.last_payout_date.toISOString() : null,
    print_partner: book.print_partner,
    available_on: parsePlatforms(book.available_on),
  };
}

/**
 * Custom application error class mapped to HTTP status codes
 */
export class AppError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(message: string, statusCode: number = 400, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
