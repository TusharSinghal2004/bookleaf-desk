import { Router } from 'express';
import {
  getTickets,
  getTicket,
  updateTicket,
  addReply,
  addNote,
  classifyTicket,
  draftResponse,
  updateTicketSchema,
  replyOrNoteSchema,
} from '../controllers/adminController';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { Role } from '@prisma/client';

const router = Router();

// Protect all admin routes with authentication and ADMIN role
router.use(authenticate, requireRole(Role.ADMIN));

router.get('/tickets', getTickets);
router.get('/tickets/:id', getTicket);
router.patch('/tickets/:id', validate({ body: updateTicketSchema }), updateTicket);
router.post('/tickets/:id/replies', validate({ body: replyOrNoteSchema }), addReply);
router.post('/tickets/:id/notes', validate({ body: replyOrNoteSchema }), addNote);
router.post('/tickets/:id/classify', classifyTicket);
router.post('/tickets/:id/draft', draftResponse);

export default router;
