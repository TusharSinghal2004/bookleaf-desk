import { prisma } from '../db/client';
import { mapBookToApi, AppError } from '../utils/helpers';

export async function getAuthorBooks(authorUserId: string) {
  const books = await prisma.book.findMany({
    where: { author_id: authorUserId },
    orderBy: { publication_date: 'desc' },
  });

  return books.map(mapBookToApi);
}

export async function getBookById(bookId: string, authorUserId?: string) {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
  });

  if (!book) {
    throw new AppError('Book not found', 404);
  }

  // If authorUserId is provided, enforce ownership check
  if (authorUserId && book.author_id !== authorUserId) {
    throw new AppError('Access denied: You do not own this book', 403);
  }

  return mapBookToApi(book);
}
