import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getPrivateTelemetry, getPublicStatus, verifyMonitorSignature } from './monitor';

const router = Router();
const limiter = rateLimit({ windowMs: 60_000, max: 180, standardHeaders: true, legacyHeaders: false });

router.get('/server-status', limiter, (req, res) => {
  const timestamp = String(req.header('x-upt-timestamp') || '');
  const nonce = String(req.header('x-upt-nonce') || '');
  const signature = String(req.header('x-upt-signature') || '');
  if (!verifyMonitorSignature(timestamp, nonce, signature, req.path)) {
    res.status(401).json({ error: { code: 'UPT-STATUS-401', message: 'Acesso não autorizado.' } });
    return;
  }
  const status = getPublicStatus();
  res.set({ 'Cache-Control': 'private, no-store', 'Content-Type': 'application/json; charset=utf-8' }).status(200).json(status);
});

// Mounted only below the existing MFA/RBAC admin router in a later integration.
export function privateDiagnostic() { return getPrivateTelemetry(); }

export default router;
