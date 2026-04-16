const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'wooden_designer_secret_123';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/wooden_designer',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Initialize DB tables
async function initDB() {
  try {
    // Create Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create Designs table with user_id
    await pool.query(`
      CREATE TABLE IF NOT EXISTS designs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        structure_data JSONB NOT NULL,
        thumbnail TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Database initialized');
  } catch (err) {
    console.warn('⚠️  DB not connected - running without persistence:', err.message);
  }
}

// In-memory fallback store
const memoryStore = {
  users: new Map(),
  designs: new Map()
};

// ─── Middleware ───────────────────────────────────────────────────────────────

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ success: false, error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// ─── Auth Routes ──────────────────────────────────────────────────────────────

// Signup
app.post('/api/auth/signup', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ success: false, error: 'All fields are required' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({ success: true, user, token });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ success: false, error: 'Username or email already exists' });
    
    // Memory fallback
    const id = uuidv4();
    const newUser = { id, username, email, password: password }; // in memory we won't hash for simplicity or just dummy
    memoryStore.users.set(id, newUser);
    const token = jwt.sign({ id, username }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ success: true, user: { id, username, email }, token });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password are required' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ success: false, error: 'User not found' });

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ success: false, error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, user: { id: user.id, username: user.username, email: user.email }, token });
  } catch (err) {
    // Memory fallback check
    const user = Array.from(memoryStore.users.values()).find(u => u.email === email);
    if (user && user.password === password) {
       const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
       return res.json({ success: true, user: { id: user.id, username: user.username, email: user.email }, token });
    }
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});

// ─── Design Routes (Protected) ────────────────────────────────────────────────

// GET all designs for user
app.get('/api/designs', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, description, thumbnail, created_at, updated_at FROM designs WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    const result = Array.from(memoryStore.designs.values())
      .filter(d => d.user_id === req.user.id)
      .map(({ structure_data, ...rest }) => rest);
    res.json({ success: true, data: result });
  }
});

// GET single design
app.get('/api/designs/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM designs WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Design not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    const design = memoryStore.designs.get(req.params.id);
    if (!design || design.user_id !== req.user.id) return res.status(404).json({ success: false, error: 'Design not found' });
    res.json({ success: true, data: design });
  }
});

// POST create design
app.post('/api/designs', authenticateToken, async (req, res) => {
  const { name, description, structure_data, thumbnail } = req.body;
  if (!name || !structure_data) return res.status(400).json({ success: false, error: 'name and structure_data required' });
  
  try {
    const result = await pool.query(
      'INSERT INTO designs (user_id, name, description, structure_data, thumbnail) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, name, description || '', structure_data, thumbnail || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    const id = uuidv4();
    const design = { id, user_id: req.user.id, name, description: description || '', structure_data, thumbnail: thumbnail || null, created_at: new Date(), updated_at: new Date() };
    memoryStore.designs.set(id, design);
    res.status(201).json({ success: true, data: design });
  }
});

// PUT update design
app.put('/api/designs/:id', authenticateToken, async (req, res) => {
  const { name, description, structure_data, thumbnail } = req.body;
  try {
    const result = await pool.query(
      'UPDATE designs SET name=$1, description=$2, structure_data=$3, thumbnail=$4, updated_at=NOW() WHERE id=$5 AND user_id=$6 RETURNING *',
      [name, description, structure_data, thumbnail, req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Not found or unauthorized' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    const design = memoryStore.designs.get(req.params.id);
    if (!design || design.user_id !== req.user.id) return res.status(404).json({ success: false, error: 'Not found' });
    const updated = { ...design, name, description, structure_data, thumbnail, updated_at: new Date() };
    memoryStore.designs.set(req.params.id, updated);
    res.json({ success: true, data: updated });
  }
});

// DELETE design
app.delete('/api/designs/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM designs WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    const design = memoryStore.designs.get(req.params.id);
    if (design && design.user_id === req.user.id) {
        memoryStore.designs.delete(req.params.id);
    }
    res.json({ success: true });
  }
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
});

