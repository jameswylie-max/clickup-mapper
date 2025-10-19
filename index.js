import express from 'express';
import cors from 'cors';
import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({ projectId: 'storage-472007' });

const app = express();
app.use(cors());
app.use(express.json());

const firestore = new Firestore();
const COL = 'gcal_clickup_map';
const SHARED_SECRET = process.env.SHARED_SECRET || '';

// ✅ Public routes (no secret needed) — for sanity checks
app.get('/', (_req, res) => res.type('text').send('ok'));
app.get('/healthz', (_req, res) => res.json({ ok: true }));

// ✅ Secret gate AFTER health routes
app.use((req, res, next) => {
  if (!SHARED_SECRET) return res.status(500).json({ error: 'Server missing SHARED_SECRET' });
  const provided = req.header('X-Shared-Secret') || '';
  if (provided !== SHARED_SECRET) return res.status(401).json({ error: 'Unauthorized' });
  next();
});

// … keep your existing /map routes below …
app.get('/map/:eventId', async (req, res) => {
  const doc = await firestore.collection(COL).doc(req.params.eventId).get();
  if (!doc.exists) return res.status(404).json({ error: 'not found' });
  res.json({ eventId: doc.id, ...doc.data() });
});

app.put('/map/:eventId', async (req, res) => {
  const { taskId } = req.body || {};
  if (!taskId) return res.status(400).json({ error: 'taskId required' });
  const payload = { taskId: String(taskId), lastSynced: new Date().toISOString() };
  await firestore.collection(COL).doc(req.params.eventId).set(payload, { merge: true });
  res.json({ eventId: req.params.eventId, ...payload });
});

app.delete('/map/:eventId', async (req, res) => {
  await firestore.collection(COL).doc(req.params.eventId).delete();
  res.status(204).end();
});

export default app;
