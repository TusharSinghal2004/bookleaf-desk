import { Router } from 'express';
import { login, getMe, loginSchema } from '../controllers/authController';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', validate({ body: loginSchema }), login);
router.get('/me', authenticate, getMe);

export default router;
