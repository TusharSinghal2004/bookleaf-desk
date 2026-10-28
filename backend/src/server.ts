import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { prisma } from './db/client';
import { ensureSeeded } from './db/autoSeed';

const PORT = process.env.PORT || 3001;

async function bootstrap() {
  await ensureSeeded();

  const server = app.listen(PORT, () => {
    console.log(`🚀 BookLeaf Backend running on http://localhost:${PORT}`);
    console.log(`📄 Swagger API Docs available at http://localhost:${PORT}/api/docs`);
    console.log(`🤖 OpenAI Integration: ${process.env.OPENAI_API_KEY ? 'Active' : 'Unset (Manual Mode)'}`);
  });

  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  });
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
