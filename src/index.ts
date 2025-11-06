import { Hono } from 'hono';
import { createServer } from 'http';
import authRoutes from './routes/auth';

const app = new Hono();
const PORT = parseInt(process.env.PORT || '5000');

// Middleware
app.use('*', async (c, next) => {
  // Pass control to the next middleware/route handler first
  await next(); 
  
  // Set required CORS headers manually on the response object (c.res)
  c.header('Access-Control-Allow-Origin', '*'); // Allow all origins for local testing
  c.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle pre-flight OPTIONS request immediately
  if (c.req.method === 'OPTIONS') {
    return c.text('', 204); // Respond with 204 No Content for pre-flight check
  }
});

// Health check
app.get('/api/health', (c) => c.json({ 
  status: 'ok',
  message: 'Pulse API is running!'
}));

// Test
app.get('/api/test', (c) => c.json({ 
  message: 'Test endpoint working'
}));

// Auth routes
app.route('/api/auth', authRoutes);

// Start server
const server = createServer(app.fetch);
server.listen(PORT, () => {
  console.log(`🚀 Pulse API running at http://localhost:${PORT}`);
  console.log(`📡 Health: http://localhost:${PORT}/api/health`);
});