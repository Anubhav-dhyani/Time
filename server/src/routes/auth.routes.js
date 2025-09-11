import { Router } from 'express';
import { login, registerStudent, ensureAdmin } from '../controllers/auth.controller.js';

const router = Router();

// Ensure admin user on first call
router.get('/ensure-admin', async (req, res) => {
  await ensureAdmin();
  res.json({ ok: true });
});

router.post('/login', login);
router.post('/register', registerStudent);

export default router;
