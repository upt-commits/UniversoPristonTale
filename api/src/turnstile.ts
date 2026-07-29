import crypto from 'crypto';
import { Request } from 'express';

type SiteverifyResponse = {
  success: boolean;
  action?: string;
  hostname?: string;
  'error-codes'?: string[];
};

export function turnstileConfig() {
  const required = process.env.CAPTCHA_REQUIRED === 'true';
  const siteKey = process.env.CAPTCHA_SITE_KEY || '';
  const secretKey = process.env.CAPTCHA_SECRET_KEY || '';
  return { required, siteKey, secretKey, configured: Boolean(siteKey && secretKey) };
}

export async function verifyTurnstile(req: Request, expectedAction: string): Promise<boolean> {
  const config = turnstileConfig();
  if (!config.required) return true;
  if (!config.configured) {
    console.error('[TURNSTILE]: CAPTCHA obrigatório, mas as chaves não estão configuradas.');
    return false;
  }

  const responseToken = req.body?.captchaToken;
  if (typeof responseToken !== 'string' || responseToken.length < 1 || responseToken.length > 2048) return false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: config.secretKey,
        response: responseToken,
        remoteip: req.ip,
        idempotency_key: crypto.randomUUID(),
      }),
      signal: controller.signal,
    });
    if (!response.ok) return false;
    const result = await response.json() as SiteverifyResponse;
    const allowedHosts = new Set(['universopt.com.br', 'www.universopt.com.br']);
    const hostnameValid = process.env.NODE_ENV !== 'production' || Boolean(result.hostname && allowedHosts.has(result.hostname));
    return result.success === true && result.action === expectedAction && hostnameValid;
  } catch (error) {
    console.error('[TURNSTILE]: validação indisponível.', error instanceof Error ? error.message : 'erro desconhecido');
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
