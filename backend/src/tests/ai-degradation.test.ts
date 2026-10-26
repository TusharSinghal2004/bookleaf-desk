import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { prisma } from '../db/client';
import { seed } from '../../prisma/seed';
import { TicketCategory, TicketPriority, TicketStatus } from '@prisma/client';

describe('AI Graceful Degradation & Full Lifecycle with OPENAI_API_KEY unset', () => {
  let authorToken: string;
  let adminToken: string;
  let ticketId: string;

  beforeAll(async () => {
    // Force OPENAI_API_KEY to be empty
    process.env.OPENAI_API_KEY = '';

    await seed();

    // Login Author (AUTH001 - Priya Sharma)
    const authorRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'priya.sharma@email.com', password: 'BookLeaf@123' });
    expect(authorRes.status).toBe(200);
    authorToken = authorRes.body.token;

    // Login Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@bookleaf.test', password: 'Admin@123' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates ticket successfully when AI key is unset (Never blocks POST /tickets)', async () => {
    const res = await request(app)
      .post('/api/author/tickets')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        subject: 'Query regarding distribution listing on Amazon',
        description: 'My book is showing unavailable on Amazon India since yesterday.',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    ticketId = res.body.id;

    // Wait 200ms for background non-blocking worker
    await new Promise((r) => setTimeout(r, 200));

    // Verify ticket persists with manual fallback markers
    const ticketInDb = await prisma.ticket.findUnique({ where: { id: ticketId } });
    expect(ticketInDb).toBeDefined();
    expect(ticketInDb?.category).toBe(TicketCategory.UNCLASSIFIED);
    expect(ticketInDb?.priority).toBe(TicketPriority.UNSET);
    expect(ticketInDb?.status).toBe(TicketStatus.OPEN);
  });

  it('admin can view ticket and receives manual fallback classification on on-demand classify call', async () => {
    const res = await request(app)
      .post(`/api/admin/tickets/${ticketId}/classify`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.category).toBe(TicketCategory.UNCLASSIFIED);
    expect(res.body.priority).toBe(TicketPriority.UNSET);
    expect(res.body.ai_status).toBe('SKIPPED');
  });

  it('admin can request draft and receives well-formatted fallback draft without 500 error', async () => {
    const res = await request(app)
      .post(`/api/admin/tickets/${ticketId}/draft`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.draft).toBeDefined();
    expect(res.body.draft).toContain('Priya Sharma');
    expect(res.body.draft.toLowerCase()).not.toContain('we apologize for the inconvenience');
  });

  it('admin can manually override category and priority via PATCH, setting is_overridden=true', async () => {
    const res = await request(app)
      .patch(`/api/admin/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        category: TicketCategory.DISTRIBUTION_AND_AVAILABILITY,
        priority: TicketPriority.HIGH,
      });

    expect(res.status).toBe(200);
    expect(res.body.category).toBe(TicketCategory.DISTRIBUTION_AND_AVAILABILITY);
    expect(res.body.priority).toBe(TicketPriority.HIGH);
    expect(res.body.is_overridden).toBe(true);
  });

  it('admin posts reply -> transitions ticket to IN_PROGRESS and makes reply visible to author', async () => {
    const replyRes = await request(app)
      .post(`/api/admin/tickets/${ticketId}/replies`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        body: 'We are investigating the stock sync with our Amazon team and will re-sync within 24–48 hours.',
      });

    expect(replyRes.status).toBe(201);
    expect(replyRes.body.senderName).toBe('BookLeaf Operations');

    // Author fetches ticket and sees the admin reply
    const authorView = await request(app)
      .get(`/api/author/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${authorToken}`);

    expect(authorView.status).toBe(200);
    expect(authorView.body.status).toBe(TicketStatus.IN_PROGRESS);
    expect(authorView.body.replies.length).toBe(1);
    expect(authorView.body.replies[0].body).toContain('24–48 hours');
  });

  it('admin logs internal note -> note is visible to admin but strictly hidden from author view', async () => {
    // 1. Admin adds note
    const noteRes = await request(app)
      .post(`/api/admin/tickets/${ticketId}/notes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ body: 'Checked Amazon ASIN sync queue — job queued for retry.' });

    expect(noteRes.status).toBe(201);

    // 2. Author views ticket -> internal notes is NOT in the response
    const authorView = await request(app)
      .get(`/api/author/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${authorToken}`);

    expect(authorView.status).toBe(200);
    expect((authorView.body as any).internal_notes).toBeUndefined();

    // 3. Admin views ticket -> internal note IS present
    const adminView = await request(app)
      .get(`/api/admin/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminView.status).toBe(200);
    expect(adminView.body.internal_notes.length).toBe(1);
    expect(adminView.body.internal_notes[0].body).toContain('ASIN sync queue');
  });

  it('author can send follow-up reply while ticket is IN_PROGRESS', async () => {
    const res = await request(app)
      .post(`/api/author/tickets/${ticketId}/replies`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ body: 'Thank you for checking on the Amazon listing.' });

    expect(res.status).toBe(201);
    expect(res.body.senderName).toBe('Priya Sharma');
  });

  it('admin resolves ticket, and subsequent author replies are rejected with 409 Conflict', async () => {
    // 1. Admin marks ticket RESOLVED
    const resolveRes = await request(app)
      .patch(`/api/admin/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: TicketStatus.RESOLVED });

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.status).toBe(TicketStatus.RESOLVED);

    // 2. Author attempts follow-up
    const rejectedReply = await request(app)
      .post(`/api/author/tickets/${ticketId}/replies`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ body: 'Can you check one more thing?' });

    expect(rejectedReply.status).toBe(409);
    expect(rejectedReply.body.message).toBe('This ticket is closed. Please open a new ticket.');
  });
});
