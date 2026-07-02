// api/chef.js — Vercel Serverless Functio
// La API key vive acá (en el servidor de Vercel), nunca en el navegador.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Falta configurar ANTHROPIC_API_KEY en Vercel (Settings → Environment Variables + Redeploy)' });
  }

  try {
    const { system, messages } = req.body || {};

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1000,
        system,
        messages,
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({
        error: (data && data.error && data.error.message) ? data.error.message : 'Error de la API',
        type: data && data.error && data.error.type,
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Error al contactar la API', detail: String(err) });
  }
}
