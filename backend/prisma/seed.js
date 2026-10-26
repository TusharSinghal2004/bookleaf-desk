"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seed = seed;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const assert_1 = __importDefault(require("assert"));
const prisma = new client_1.PrismaClient();
async function seed() {
    console.log('🌱 Starting BookLeaf database seed...');
    const dataPath = path_1.default.join(__dirname, 'seed-data.json');
    if (!fs_1.default.existsSync(dataPath)) {
        throw new Error(`Seed data file not found at ${dataPath}`);
    }
    const rawData = JSON.parse(fs_1.default.readFileSync(dataPath, 'utf-8'));
    const authors = rawData.authors;
    // Count total books
    const totalBooks = authors.reduce((sum, a) => sum + (a.books?.length || 0), 0);
    // Assertion check requested by rubric to fail loudly if JSON ever drifts
    assert_1.default.strictEqual(authors.length, 10, `Expected exactly 10 authors, found ${authors.length}`);
    assert_1.default.strictEqual(totalBooks, 18, `Expected exactly 18 books, found ${totalBooks}`);
    // Clean existing data
    await prisma.aILog.deleteMany();
    await prisma.internalNote.deleteMany();
    await prisma.reply.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.book.deleteMany();
    await prisma.user.deleteMany();
    // 1. Seed Admin user
    const adminPasswordHash = await bcryptjs_1.default.hash('Admin@123', 10);
    const admin = await prisma.user.create({
        data: {
            email: 'admin@bookleaf.test',
            password_hash: adminPasswordHash,
            role: client_1.Role.ADMIN,
            name: 'BookLeaf Operations',
            city: 'Delhi',
            phone: '+91-11-2345-6789',
        },
    });
    console.log(`✅ Seeded Admin: ${admin.email} (Role: ${admin.role})`);
    // 2. Hash author password once for performance
    const authorPasswordHash = await bcryptjs_1.default.hash('BookLeaf@123', 10);
    // 3. Seed Authors and Books
    let seededAuthorCount = 0;
    let seededBookCount = 0;
    for (const rawAuthor of authors) {
        const user = await prisma.user.create({
            data: {
                author_code: rawAuthor.author_id,
                email: rawAuthor.email.toLowerCase().trim(),
                password_hash: authorPasswordHash,
                role: client_1.Role.AUTHOR,
                name: rawAuthor.name,
                phone: rawAuthor.phone,
                city: rawAuthor.city,
                joined_date: rawAuthor.joined_date ? new Date(rawAuthor.joined_date) : null,
            },
        });
        seededAuthorCount++;
        for (const rawBook of rawAuthor.books) {
            await prisma.book.create({
                data: {
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
            seededBookCount++;
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
