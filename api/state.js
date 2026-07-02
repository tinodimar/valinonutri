// api/state.js — Sincronización del estado general (perfiles, pesos, menú).
// Los tildes de compras NO viven acá: están en /api/shopping (aislados).
// Requiere KV_REST_API_URL y KV_REST_API_TOKEN (las crea Vercel al conectar KV).

const KEY = 'nutritino:state';

async function kv(path, method, body) {
  const base = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  const r = await fetch(`${base}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.json();
}

function toObject(result) {
  let v = result;
  for (let i = 0; i < 3; i++) {
    if (v == null) return {};
    if (typeof v === 'object') return v;
    if (typeof v === 'string') {
      try { v = JSON.parse(v); } catch (e) { return {}; }
    } else {
      return {};
    }
  }
  return typeof v === 'object' && v !== null ? v : {};
}

export default async function handler(req, res) {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return res.status(200).json({ _noBackend: true });
  }

  try {
    if (req.method === 'GET') {
      const out = await kv(`get/${KEY}`, 'GET');
      return res.status(200).json(toObject(out && out.result));
    }
    if (req.method === 'POST') {
      const { state } = req.body || {};
      if (!state) return res.status(400).json({ error: 'Falta state' });
      await kv(`set/${KEY}`, 'POST', JSON.stringify(state));
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
