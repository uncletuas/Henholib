import express from 'express';
import cors from 'cors';
import * as kv from './kv_store.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length'],
  maxAge: 600,
}));

kv.ensureTable().catch(err => console.error('DB init error:', err));

app.get('/make-server-a80b6662/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
