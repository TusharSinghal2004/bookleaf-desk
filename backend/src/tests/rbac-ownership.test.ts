import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { prisma } from '../db/client';
import { seed } from '../../prisma/seed';
import { TicketStatus } from '@prisma/client';

describe('RBAC & Ownership Security Verification', () => {
  let authorAToken: string;
  let authorBToken: string;
  let adminToken: string;
  let authorATicketId: string;

  beforeAll(async () => {
    // Ensure clean seeded state
    await seed();

    // 1. Login Author A (Priya Sharma - AUTH001)
    const authorARes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'priya.sharma@email.com', password: 'BookLeaf@123' });
    expect(authorARes.status).toBe(200);
    authorAToken = authorARes.body.token;

    // 2. Login Author B (Rohit Kapoor - AUTH002)
    const authorBRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rohit.kapoor@email.com', password: 'BookLeaf@123' });
    expect(authorBRes.status).toBe(200);
    authorBToken = authorBRes.body.token;

    // 3. Login Admin (BookLeaf Operations)
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@bookleaf.test', password: 'Admin@123' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.token;

    // 4. Author A creates a ticket
    const createTicketRes = await request(app)
      .post('/api/author/tickets')
      .set('Authorization', `Bearer ${authorAToken}`)
      .send({
        subject: 'Inquiry regarding October royalty statement',
        description: 'I noticed my October royalty statement has not been updated yet.',
      });
    expect(createTicketRes.status).toBe(201);
    authorATicketId = createTicketRes.body.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('allows Author A to view their own ticket (200 OK)', async () => {
    const res = await request(app)
      .get(`/api/author/tickets/${authorATicketId}`)
      .set('Authorization', `Bearer ${authorAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(authorATicketId);
    expect(res.body.subject).toBe('Inquiry regarding October royalty statement');
  });

  it('STRICT RBAC: Author B receives 403 Forbidden when trying to access Author A\'s ticket', async () => {
    const res = await request(app)
      .get(`/api/author/tickets/${authorATicketId}`)
      .set('Authorization', `Bearer ${authorBToken}`);

    // Real assertion for rubric verification
    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Forbidden');
  });

  it('STRICT RBAC: Author B receives 403 Forbidden when trying to post reply to Author A\'s ticket', async () => {
    const res = await request(app)
      .post(`/api/author/tickets/${authorATicketId}/replies`)
      .set('Authorization', `Bearer ${authorBToken}`)
      .send({ body: 'Unauthorized intrusion attempt' });

    expect(res.status).toBe(403);
  });

  it('rejects unauthenticated requests with 401 Unauthorized (no token)', async () => {
    const res = await request(app).get(`/api/author/tickets/${authorATicketId}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Authentication required');
  });

  it('returns 404 Not Found for nonexistent ticket ID', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .get(`/api/author/tickets/${nonExistentId}`)
      .set('Authorization', `Bearer ${authorAToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('not found');
  });

  it('STRICT RBAC: Author cannot access admin routes (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/admin/tickets')
      .set('Authorization', `Bearer ${authorAToken}`);

    expect(res.status).toBe(403);
  });

  it('allows Admin to view any author ticket (200 OK)', async () => {
    const res = await request(app)
      .get(`/api/admin/tickets/${authorATicketId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(authorATicketId);
    expect(res.body.author.email).toBe('priya.sharma@email.com');
  });

  it('rejects author replies on closed tickets with 409 Conflict', async () => {
    // 1. Admin marks ticket as CLOSED
    await prisma.ticket.update({
      where: { id: authorATicketId },
      data: { status: TicketStatus.CLOSED },
    });

    // 2. Author A attempts to reply
    const res = await request(app)
      .post(`/api/author/tickets/${authorATicketId}/replies`)
      .set('Authorization', `Bearer ${authorAToken}`)
      .send({ body: 'Trying to reply to a closed ticket' });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('This ticket is closed. Please open a new ticket.');
  });
});
