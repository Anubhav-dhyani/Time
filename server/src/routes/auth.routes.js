import { Router } from 'express';
import { login, registerStudent, ensureAdmin, changePassword } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/change-password', authenticate, changePassword);

// Ensure admin user on first call
router.get('/ensure-admin', async (req, res) => {
  await ensureAdmin();
  res.json({ ok: true });
});

router.post('/login', login);
router.post('/register', registerStudent);

export default router;
