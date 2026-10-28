import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { prisma } from './client';
import { Role } from '@prisma/client';

export async function ensureSeeded() {
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      console.log(`✅ Database already populated (${userCount} users found).`);
      return;
    }

    console.log('🌱 Database is empty. Auto-seeding initial dataset...');

    const possiblePaths = [
      path.join(process.cwd(), 'prisma/seed-data.json'),
      path.join(__dirname, '../../prisma/seed-data.json'),
      path.join(__dirname, '../prisma/seed-data.json'),
      path.join(__dirname, 'seed-data.json'),
    ];

    const dataPath = possiblePaths.find((p) => fs.existsSync(p));
    if (!dataPath) {
      console.warn('⚠️ seed-data.json not found in paths:', possiblePaths);
      return;
    }

    const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    const authors = rawData.authors;

    // 1. Seed Admin
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    await prisma.user.create({
      data: {
        id: '00000000-0000-4000-a000-000000000099',
        email: 'admin@bookleaf.test',
        password_hash: adminPasswordHash,
        role: Role.ADMIN,
        name: 'BookLeaf Operations',
        city: 'Delhi',
        phone: '+91-11-2345-6789',
      },
    });

    // 2. Hash author password
    const authorPasswordHash = await bcrypt.hash('BookLeaf@123', 10);

    let seededAuthorCount = 0;
    let seededBookCount = 0;

    for (let i = 0; i < authors.length; i++) {
      const rawAuthor = authors[i];
      const authorNum = String(i + 1).padStart(12, '0');
      const deterministicAuthorId = `00000000-0000-4000-a000-${authorNum}`;

      const user = await prisma.user.create({
        data: {
          id: deterministicAuthorId,
          author_code: rawAuthor.author_id,
          email: rawAuthor.email.toLowerCase().trim(),
          password_hash: authorPasswordHash,
          role: Role.AUTHOR,
          name: rawAuthor.name,
          phone: rawAuthor.phone,
          city: rawAuthor.city,
          joined_date: rawAuthor.joined_date ? new Date(rawAuthor.joined_date) : null,
        },
      });
      seededAuthorCount++;

      for (const rawBook of rawAuthor.books) {
        seededBookCount++;
        const bookNum = String(seededBookCount).padStart(12, '0');
        const deterministicBookId = `00000000-0000-4000-b000-${bookNum}`;

        await prisma.book.create({
          data: {
            id: deterministicBookId,
            book_id: rawBook.book_id,
            author_id: user.id,
            title: rawBook.title,
            isbn: rawBook.isbn,
            genre: rawBook.genre,
            publication_date: rawBook.publication_date ? new Date(rawBook.publication_date) : null,
            status: rawBook.status,
            mrp: rawBook.mrp !== null ? Number(rawBook.mrp) : null,
            royalty_per_copy: rawBook.author_royalty_per_copy !== null ? Number(rawBook.author_royalty_per_copy) : null,
            copies_sold: Number(rawBook.total_copies_sold || 0),
            royalty_earned: Number(rawBook.total_royalty_earned || 0),
            royalty_paid: Number(rawBook.royalty_paid || 0),
            royalty_pending: Number(rawBook.royalty_pending || 0),
            last_payout_date: rawBook.last_royalty_payout_date ? new Date(rawBook.last_royalty_payout_date) : null,
            print_partner: rawBook.print_partner,
            available_on: JSON.stringify(rawBook.available_on || []),
          },
        });
      }
    }

    console.log(`✅ Auto-seeded ${seededAuthorCount} authors and ${seededBookCount} books!`);
  } catch (error) {
    console.error('⚠️ Auto-seed check notice:', error);
  }
}
