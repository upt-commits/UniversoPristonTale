import crypto from 'node:crypto';

export const dynamic = 'force-dynamic';

const unknown = (checkedAt: string) => ({
  schemaVersion: 1, world: 'UPT — Temporada 1', state: 'unknown', label: 'Indisponível',
  message: 'Não foi possível confirmar o status agora.', checkedAt,
  lastStateChangeAt: checkedAt, stale: true,
});

export async function GET(request: Request) {
  const base = process.env.STATUS_MONITOR_URL;
  const secret = process.env.STATUS_HMAC_SECRET;
  if (!base || !secret || secret.length < 32) {
    return Response.json(unknown(new Date().toISOString()), { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  const pathname = '/server-status';
  const timestamp = String(Date.now());
  const nonce = crypto.randomBytes(18).toString('hex');
  const signature = crypto.createHmac('sha256', secret).update(`${timestamp}\n${nonce}\nGET\n${pathname}`).digest('hex');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(`${base.replace(/\/$/, '')}${pathname}`, {
      headers: { 'x-upt-timestamp': timestamp, 'x-upt-nonce': nonce, 'x-upt-signature': signature, accept: 'application/json' },
      signal: controller.signal, cache: 'no-store',
    });
    if (!response.ok) throw new Error('monitor-unavailable');
    const data = await response.json();
    const allowed = ['online','offline','starting','restarting','partial','degraded','maintenance','unknown'];
    if (data?.schemaVersion !== 1 || !allowed.includes(data?.state) || typeof data?.checkedAt !== 'string') throw new Error('invalid-monitor-payload');
    const body = JSON.stringify({
      schemaVersion: 1, world: 'UPT — Temporada 1', state: data.state,
      label: String(data.label).slice(0, 32), message: String(data.message).slice(0, 160),
      checkedAt: data.checkedAt, lastStateChangeAt: data.lastStateChangeAt, stale: data.stale === true,
    });
    const etag = `\"${crypto.createHash('sha256').update(body).digest('base64url')}\"`;
    if (request.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers: { ETag: etag, 'Cache-Control': 'public, max-age=5, stale-while-revalidate=20' } });
    return new Response(body, { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=5, stale-while-revalidate=20', ETag: etag } });
  } catch {
    return Response.json(unknown(new Date().toISOString()), { status: 503, headers: { 'Cache-Control': 'no-store' } });
  } finally { clearTimeout(timeout); }
}
