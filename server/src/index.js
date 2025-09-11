import 'dotenv/config';
import app from './server.js';
import { connectDB } from './lib/db.js';
import { ensureAdmin } from './controllers/auth.controller.js';

const port = process.env.PORT || 4000;

async function start() {
  await connectDB();
  await ensureAdmin();
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
