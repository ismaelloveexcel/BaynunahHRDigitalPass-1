import express from 'express';
import session from 'express-session';
import passport from './middleware/auth.js';
import connectPgSimple from 'connect-pg-simple';
import pkg from 'pg';
const { Pool } = pkg;
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import authRoutes from './routes/auth.routes.js';
import candidateRoutes from './routes/candidate.routes.js';
import jobRoutes from './routes/job.routes.js';
import applicationRoutes from './routes/application.routes.js';
import managerRoutes from './routes/manager.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import hrRoutes from './routes/hr.routes.js';
import agencyRoutes from './routes/agency.routes.js';
import passRoutes from './routes/pass.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

const PORT = process.env.PORT || 3000;

// PostgreSQL session store
const PgSession = connectPgSimple(session);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/baynunah_hris',
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    store: new PgSession({
      pool,
      tableName: 'sessions',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'baynunah-hris-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    },
  })
);

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/agencies', agencyRoutes);
app.use('/api/pass', passRoutes);
app.use('/api/analytics', analyticsRoutes);

// WebSocket handling for real-time updates
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  ws.on('message', (message) => {
    console.log('Received:', message.toString());
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Broadcast to all connected clients
export function broadcast(data: any) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(JSON.stringify(data));
    }
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Baynunah HRIS server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
});
