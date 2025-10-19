import express from 'express';
import cors from 'cors';
import { Firestore } from '@google-cloud/firestore';

// Use the explicit project ID (hardening)
const firestore = new Firestore({ projectId: 'storage-472007' });
const COL = 'gcal_clickup_map';
const SHARED_SECRET = process.env.SHARED_SECRET || '';

const app = express();
app.use(cors());
app.use(express.json());

// Public sanity routes (no secret)
app.get('/', (_req, res) => res.type('text').send('ok'));
app.get('/healthz', (_req, res) => res.json({ ok: true }));

// Secret gate AFTER health routes
app.use((req, res, next) => {
  if (!SHARED_SECRET) return res.status(500).json({ error: 'Server missing SHARED_SECRET' });
  const provided = req.header('X-Shared-Secret') || '';
  if (provided !== SHARED_SECRET) return res.status(401).json({ error: 'Unauthorized' });
  next();
});

// Mapping endpoints
app.get('/map/:eventId', async (req, res) => {
  try {
    const doc = await firestore.collection(COL).doc(req.params.eventId).get();
    if (!doc.exists) return res.status(404).json({ error: 'not found' });
    res.json({ eventId: doc.id, ...doc.data() });
  } catch (e) {
    console.error('GET /map error:', e);
    res.status(500).json({ error: 'internal' });
  }
});

app.put('/map/:eventId', async (req, res) => {
  try {
    const { taskId } = req.body || {};
    if (!taskId) return res.status(400).json({ error: 'taskId required' });
    const payload = { taskId: String
