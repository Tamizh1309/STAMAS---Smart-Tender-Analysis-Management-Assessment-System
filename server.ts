import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Backend Modular Routers
import { tenderRouter } from './backend/routes/tenderRoutes.ts';
import { geminiRouter } from './backend/routes/geminiRoutes.ts';
import { systemRouter } from './backend/routes/systemRoutes.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '15mb' }));

  // Mount Backend API Routes
  app.use('/api/tenders', tenderRouter);
  app.use('/api/gemini', geminiRouter);
  app.use('/api/system', systemRouter);

  // Development: Mount Vite Middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: Serve React Frontend Dist Static Assets
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[STAMAS Backend] Server active on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start STAMAS server:', err);
});
