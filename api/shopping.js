// api/shopping.js — Sincronización SOLO de los tildes de compras.
// Aislado del resto del estado para que ningún otro guardado pueda pisarlos.
// Guarda un objeto { [scope]: { key: 1, ... } } bajo una única clave KV.
//
// GET  /api/shopping            -> { shared:{...}, <userId>:{...} }
// POST /api/shopping {scope,checks} -> reemplaza los tildes de ese scope

const KEY = 'nutritino:shopping';

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
      const { scope, checks } = req.body || {};
      if (!scope) return res.status(400).json({ error: 'Falta scope' });
      // leer lo actual, actualizar solo ese scope, guardar
      const out = await kv(`get/${KEY}`, 'GET');
      const all = out && out.result ? JSON.parse(out.result) : {};
      all[scope] = checks || {};
      await kv(`set/${KEY}`, 'POST', JSON.stringify(all));
      return res.status(200).json({ ok: true, scope });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
