// api/state.js — Sincronización de datos entre dispositivos.
// Usa Vercel KV (Upstash Redis). Guarda un único documento con todo el estado
// de la app bajo una clave fija. Requiere las variables de entorno que Vercel
// crea automáticamente al conectar un store de Vercel KV:
//   KV_REST_API_URL  y  KV_REST_API_TOKEN
//
// GET  /api/state          -> devuelve el estado guardado (o {} si no hay)
// POST /api/state  {state}  -> guarda el estado

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

export default async function handler(req, res) {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return res.status(200).json({ _noBackend: true });
  }

  try {
    if (req.method === 'GET') {
      const out = await kv(`get/${KEY}`, 'GET');
      const val = out && out.result ? JSON.parse(out.result) : {};
      return res.status(200).json(val);
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
