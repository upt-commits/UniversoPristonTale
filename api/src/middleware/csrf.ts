import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import sql from 'mssql';
import { getPortalConnection } from '../db';
import { config } from '../config';

const SESSION_COOKIE = config.cookie.name;
const CSRF_HEADER = 'x-csrf-token';

export async function csrfToken(req: Request, res: Response): Promise<void> {
    const sessionToken = req.cookies?.[SESSION_COOKIE];
    if (!sessionToken || typeof sessionToken !== 'string') {
        res.status(401).json({ error: { code: 'UPT-CSRF-001', message: 'Sessao nao autenticada.' } });
        return;
    }

    const sessionHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
    const csrfToken = crypto.randomBytes(32).toString('hex');
    const csrfHash = crypto.createHash('sha256').update(csrfToken).digest('hex');

    try {
        const pool = await getPortalConnection();
        await pool.request()
            .input('sessionHash', sql.VarChar, sessionHash)
            .input('csrfHash', sql.VarChar, csrfHash)
            .query('UPDATE PlayerSessions SET CSRFTokenHash = @csrfHash WHERE TokenHash = @sessionHash AND RevokedAt IS NULL');

        res.json({ csrfToken });
    } catch (err: any) {
        console.error('[CSRF-TOKEN-ERROR]:', err.message);
        res.status(500).json({ error: { code: 'UPT-CSRF-500', message: 'Erro ao gerar token CSRF.' } });
    }
}

export async function requireCSRF(req: Request, res: Response, next: NextFunction): Promise<void> {
    const origin = req.headers['origin'];
    const referer = req.headers['referer'];

    const allowedOrigins = [
        'https://universopt.com.br',
        'https://www.universopt.com.br',
    ];
    if (!config.isProduction) {
        allowedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000');
    }

    if (origin) {
        if (!allowedOrigins.includes(origin)) {
            res.status(403).json({ error: { code: 'UPT-CSRF-002', message: 'Origem nao autorizada.' } });
            return;
        }
    } else if (referer) {
        const refOrigin = extractOrigin(referer);
        if (refOrigin && !allowedOrigins.includes(refOrigin)) {
            res.status(403).json({ error: { code: 'UPT-CSRF-002', message: 'Origem nao autorizada.' } });
            return;
        }
    }

    const csrfToken = req.headers[CSRF_HEADER] as string;
    if (!csrfToken) {
        res.status(403).json({ error: { code: 'UPT-CSRF-003', message: 'Token CSRF ausente.' } });
        return;
    }

    const sessionToken = req.cookies?.[SESSION_COOKIE];
    if (!sessionToken) {
        res.status(401).json({ error: { code: 'UPT-CSRF-004', message: 'Sessao nao autenticada.' } });
        return;
    }

    const sessionHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
    const csrfHash = crypto.createHash('sha256').update(csrfToken).digest('hex');

    try {
        const pool = await getPortalConnection();
        const result = await pool.request()
            .input('sessionHash', sql.VarChar, sessionHash)
            .input('csrfHash', sql.VarChar, csrfHash)
            .query('SELECT AccountID FROM PlayerSessions WHERE TokenHash = @sessionHash AND CSRFTokenHash = @csrfHash AND RevokedAt IS NULL AND ExpiresAt > GETUTCDATE()');

        if (result.recordset.length === 0) {
            res.status(403).json({ error: { code: 'UPT-CSRF-005', message: 'Token CSRF invalido ou expirado.' } });
            return;
        }

        next();
    } catch (err: any) {
        console.error('[CSRF-VALIDATE-ERROR]:', err.message);
        res.status(500).json({ error: { code: 'UPT-CSRF-500', message: 'Erro ao validar CSRF.' } });
    }
}

function extractOrigin(url: string): string | null {
    try {
        const u = new URL(url);
        return `${u.protocol}//${u.host}`;
    } catch {
        return null;
    }
}
