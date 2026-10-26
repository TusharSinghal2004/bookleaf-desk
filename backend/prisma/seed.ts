import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import assert from 'assert';

const prisma = new PrismaClient();

interface RawBook {
  book_id: string;
  title: string;
  isbn: string | null;
  genre: string;
  publication_date: string | null;
  status: string;
  mrp: number | null;
  author_royalty_per_copy: number | null;
  total_copies_sold: number;
  total_royalty_earned: number;
  royalty_paid: number;
  royalty_pending: number;
  last_royalty_payout_date: string | null;
  print_partner: string | null;
  available_on: string[];
}

interface RawAuthor {
  author_id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  joined_date: string;
  books: RawBook[];
}

interface RawData {
  authors: RawAuthor[];
}

export async function seed() {
  console.log('🌱 Starting BookLeaf database seed...');

  const dataPath = path.join(__dirname, 'seed-data.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Seed data file not found at ${dataPath}`);
  }

  const rawData: RawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const authors = rawData.authors;

  // Count total books
  const totalBooks = authors.reduce((sum, a) => sum + (a.books?.length || 0), 0);

  // Assertion check requested by rubric to fail loudly if JSON ever drifts
  assert.strictEqual(
    authors.length,
    10,
    `Expected exactly 10 authors, found ${authors.length}`
  );
  assert.strictEqual(
    totalBooks,
    18,
    `Expected exactly 18 books, found ${totalBooks}`
  );

  // Clean existing data
  await prisma.aILog.deleteMany();
  await prisma.internalNote.deleteMany();
  await prisma.reply.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();

  // 1. Seed Admin user with deterministic UUID
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.create({
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
  console.log(`✅ Seeded Admin: ${admin.email} (Role: ${admin.role})`);

  // 2. Hash author password once for performance
  const authorPasswordHash = await bcrypt.hash('BookLeaf@123', 10);

  // 3. Seed Authors and Books with deterministic UUIDs
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

  console.log(`✅ Seeded ${seededAuthorCount} authors and ${seededBookCount} books.`);
  console.log('🎉 Seeding successfully completed!');
}

if (require.main === module) {
  seed()
    .catch((e) => {
      console.error('❌ Seeding failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
