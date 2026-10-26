import { Router } from 'express';
import {
  getBooks,
  getRoyalties,
  getTickets,
  createTicket,
  getTicket,
  addReply,
  createTicketSchema,
  addReplySchema,
} from '../controllers/authorController';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { Role } from '@prisma/client';

const router = Router();

// Protect all author routes with authentication and AUTHOR role
router.use(authenticate, requireRole(Role.AUTHOR));

router.get('/books', getBooks);
router.get('/royalties', getRoyalties);
router.get('/tickets', getTickets);
router.post('/tickets', validate({ body: createTicketSchema }), createTicket);
router.get('/tickets/:id', getTicket);
router.post('/tickets/:id/replies', validate({ body: addReplySchema }), addReply);

export default router;
