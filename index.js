import express from 'express';
import cors from 'cors';
import { Firestore } from '@google-cloud/firestore';

const app = express();
app.use(cors());
app.use(express.json());

const firestore = new Firestore();
const COL = 'gcal_clickup_map';

const SHARED_SECRET = process.env.SHARED_SECRET || '';

app.use((req, res, next) => {
  if (!SHARED_SECRET) return res.status(500).json({ error: 'Server missing SHARED_SECRET' });
  const provided = req.header('X-Shared-Secret') || '';
  if (provided !== SHARED_SECRET) return res.status(401).json({ error: 'Unauthorized' });
  next();
});

app.get('/map/:eventId', async (req, res) => {
  try {
    const doc = await firestore.collection(COL).doc(req.params.eventId).get();
    if (!doc.exists) return res.status(404).json({ error: 'not found' });
    return res.json({ eventId: doc.id, ...doc.data() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'internal' });
  }
});

app.put('/map/:eventId', async (req, res) => {
  try {
    const { taskId } = req.body || {};
    if (!taskId) return res.status(400).json({ error: 'taskId required' });
    const payload = { taskId: String(taskId), lastSynced: new Date().toISOString() };
    await firestore.collection(COL).doc(req.params.eventId).set(payload, { merge: true });
    return res.json({ eventId: req.params.eventId, ...payload });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'internal' });
  }
});

app.delete('/map/:eventId', async (req, res) => {
  try {
    await firestore.collection(COL).doc(req.params.eventId).delete();
    return res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'internal' });
  }
});

app.get('/healthz', (_req, res) => res.json({ ok: true }));

export default app;
