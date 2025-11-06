// apps/api/src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import authRoutes from './routes/auth.js';

const app = new Hono();
const PORT = parseInt(process.env.PORT || '5000');
const isDevelopment = process.env.NODE_ENV === 'development';

// CORS Configuration
app.use('*', cors({
  origin: isDevelopment 
    ? ['http://localhost:8081', 'exp://192.168.*.*:8081'] 
    : ['https://your-production-frontend.com'], // Update this later
  credentials: true,
}));

// Health check
app.get('/api/health', (c) => c.json({ 
  status: 'ok',
  message: 'Pulse API is running!',
  environment: process.env.NODE_ENV,
  timestamp: new Date().toISOString(),
}));

// Test endpoint
app.get('/api/test', (c) => c.json({ 
  message: 'Test endpoint working',
  environment: process.env.NODE_ENV,
}));

// Auth routes
app.route('/api/auth', authRoutes);

// 404 handler
app.notFound((c) => c.json({ error: 'Not Found' }, 404));

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ 
    error: 'Internal Server Error',
    message: isDevelopment ? err.message : 'Something went wrong'
  }, 500);
});

// Start server
serve({
  fetch: app.fetch,
  port: PORT,
}, (info) => {
  console.log(`🚀 Pulse API running at http://localhost:${info.port}`);
  console.log(`📡 Health: http://localhost:${info.port}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});

export default app;