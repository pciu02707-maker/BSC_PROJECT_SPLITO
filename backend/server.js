const express = require('express');
const http = require('http');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const path = require('path');
const { Server } = require('socket.io');
require('dotenv').config({
  path: path.join(__dirname, '.env'),
  override: process.env.NODE_ENV !== 'production',
});

const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const connectDB = require('./src/config/db');
require('./src/config/passport');

const authRoutes = require('./src/routes/auth.routes');
const tripRoutes = require('./src/routes/trip.routes');
const expenseRoutes = require('./src/routes/expense.routes');
const userRoutes = require('./src/routes/user.routes');
const publicPlanRoutes = require('./src/routes/publicPlan.routes');
const { initSocket } = require('./src/socket/socket');
const errorMiddleware = require('./src/middleware/error.middleware');

const app = express();
const httpServer = http.createServer(app);

// ─── Connect Database ─────────────────────────────────────────────────────────
connectDB();

// ─── Socket.io Setup ─────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
initSocket(io);
app.set('io', io); // make io accessible in controllers

// ─── Core Middleware ──────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'splito-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 1 day
}));
app.use(passport.initialize());
app.use(passport.session());

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/public-plans', publicPlanRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Splito API is running 🚀' });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorMiddleware);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Splito server running on http://localhost:${PORT}`);
});
