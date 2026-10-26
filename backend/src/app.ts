import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import YAML from 'yamljs';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './routes/auth';
import authorRoutes from './routes/author';
import adminRoutes from './routes/admin';
import { errorHandler } from './middleware/errorHandler';

export const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'bookleaf-backend',
    timestamp: new Date().toISOString(),
    openai_configured: Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== ''),
  });
});

// Swagger OpenAPI documentation route
const openApiPath = path.resolve(__dirname, '../../docs/openapi.yaml');
if (fs.existsSync(openApiPath)) {
  const swaggerDocument = YAML.load(openApiPath);
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/author', authorRoutes);
app.use('/api/admin', adminRoutes);

// Central error handler
app.use(errorHandler);

export default app;
