import { Router, Request, Response, NextFunction } from 'express';
import sql from 'mssql';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { getPortalConnection, getGameConnection } from '../db';
import { config } from '../config';
import {
    computeCPF_HMAC,
    encryptAES,
    decryptAES,
    hashPasswordClientStyle,
    validateCPF,
    calculateAge
} from '../utils/crypto';
import { verifyCaptcha, isCaptchaBypassAllowed } from '../services/captcha';
import { createAndSendOTP, verifyOTP, activateAccountAfterOTP } from '../services/otp';
import { maskEmail, isSmtpConfigured } from '../services/email';
import { csrfToken, requireCSRF } from '../middleware/csrf';
import { getServerStatus } from '../services/server-status';

const router = Router();

const SESSION_COOKIE = config.cookie.name;
const SESSION_TTL_MS = config.cookie.sessionTtlMinutes * 60 * 1000;

const HONEYPOT_FIELD = 'website_url';
const MIN_FORM_TIME_MS = 3000;

function setSessionCookie(res: Response, token: string, maxAgeMs: number): void {
    res.cookie(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: config.cookie.secure,
        sameSite: config.cookie.sameSite,
        path: '/',
        maxAge: maxAgeMs
    });
}

function clearSessionCookie(res: Response): void {
    res.clearCookie(SESSION_COOKIE, {
        httpOnly: true,
        secure: config.cookie.secure,
        sameSite: config.cookie.sameSite,
        path: '/'
    });
}

function getClientIP(req: Request): string {
    return req.ip || '127.0.0.1';
}

async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    const token = req.cookies?.[SESSION_COOKIE];
    if (!token || typeof token !== 'string') {
        res.status(401).json({ error: { code: 'UPT-AUTH-002', message: 'Sessao expirada ou nao autenticada.' } });
        return;
    }
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    try {
        const pool = await getPortalConnection();
        const result = await pool.request()
            .input('tokenHash', sql.VarChar, tokenHash)
            .query('SELECT AccountID, ExpiresAt, RevokedAt FROM PlayerSessions WHERE TokenHash = @tokenHash');

        if (result.recordset.length === 0) {
            res.status(401).json({ error: { code: 'UPT-AUTH-002', message: 'Sessao expirada ou nao autenticada.' } });
            return;
        }

        const session = result.recordset[0];

        if (session.RevokedAt || new Date() > new Date(session.ExpiresAt)) {
            res.status(401).json({ error: { code: 'UPT-AUTH-002', message: 'Sessao expirada ou nao autenticada.' } });
            return;
        }

        (req as any).accountId = session.AccountID;
        next();
    } catch (err: any) {
        console.error('[AUTH-MIDDLEWARE-ERROR]:', err.message);
        res.status(500).json({ error: { code: 'UPT-SYS-500', message: 'Falha ao validar autenticacao.' } });
    }
}

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    keyGenerator: (req) => getClientIP(req),
    message: { error: { code: 'UPT-RATE-002', message: 'Muitas tentativas. Aguarde antes de tentar novamente.' } }
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: config.isProduction ? 5 : 50,
    keyGenerator: (req) => getClientIP(req),
    message: { error: { code: 'UPT-RATE-003', message: 'Limite de cadastros atingido. Tente novamente mais tarde.' } }
});

const otpVerifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    keyGenerator: (req) => getClientIP(req),
    message: { error: { code: 'UPT-RATE-004', message: 'Muitas tentativas de verificacao. Aguarde.' } }
});

const otpResendLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    keyGenerator: (req) => getClientIP(req),
    message: { error: { code: 'UPT-RATE-005', message: 'Limite de reenvios atingido.' } }
});

const statusLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    keyGenerator: (req) => getClientIP(req),
    message: { error: { code: 'UPT-RATE-006', message: 'Muitas consultas de status. Aguarde.' } }
});

// POST /api/auth/register
router.post('/auth/register', registerLimiter, async (req: Request, res: Response): Promise<void> => {
    if (!config.registration.enabled) {
        res.status(503).json({ error: { code: 'UPT-REG-DISABLED', message: 'O cadastro esta temporariamente indisponivel.' } });
        return;
    }

    const {
        username, email, password,
        fullName, birthDate, cpf,
        cep, logradouro, numero, complemento, bairro, cidade, estado,
        termsAccepted, guardianName, guardianCPF,
        captchaToken, formStartTime
    } = req.body;

    if (req.body[HONEYPOT_FIELD]) {
        res.status(400).json({ error: { code: 'UPT-REG-BOT', message: 'Requisicao invalida.' } });
        return;
    }

    if (formStartTime) {
        const elapsed = Date.now() - Number(formStartTime);
        if (elapsed < MIN_FORM_TIME_MS) {
            res.status(400).json({ error: { code: 'UPT-REG-BOT', message: 'Formulario enviado muito rapidamente.' } });
            return;
        }
    }

    if (!username || !email || !password || !fullName || !birthDate || !cpf || !cep || !logradouro || !numero || !bairro || !cidade || !estado) {
        res.status(400).json({ error: { code: 'UPT-REG-001', message: 'Todos os campos obrigatorios devem ser preenchidos.' } });
        return;
    }

    if (!termsAccepted) {
        res.status(400).json({ error: { code: 'UPT-REG-002', message: 'Voce precisa aceitar os Termos de Uso e Regulamentos.' } });
        return;
    }

    if (typeof username !== 'string' || username.length < 4 || username.length > 16 || !/^[a-zA-Z0-9]+$/.test(username)) {
        res.status(400).json({ error: { code: 'UPT-REG-008', message: 'Nome da conta deve ter 4-16 caracteres alfanumericos.' } });
        return;
    }

    if (typeof password !== 'string' || password.length < 6 || password.length > 32) {
        res.status(400).json({ error: { code: 'UPT-REG-009', message: 'Senha deve ter entre 6 e 32 caracteres.' } });
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof email !== 'string' || !emailRegex.test(email) || email.length > 150) {
        res.status(400).json({ error: { code: 'UPT-REG-010', message: 'E-mail invalido.' } });
        return;
    }

    if (!validateCPF(cpf)) {
        res.status(400).json({ error: { code: 'UPT-REG-003', message: 'CPF informado e invalido.' } });
        return;
    }

    const age = calculateAge(birthDate);
    const isMinor = age < 18;
    if (age < 12 && (!guardianName || !guardianCPF)) {
        res.status(400).json({ error: { code: 'UPT-REG-004', message: 'Cadastro de menores de 12 anos exige nome e CPF do responsavel.' } });
        return;
    }

    if (config.captcha.required || !isCaptchaBypassAllowed()) {
        const captchaResult = await verifyCaptcha(captchaToken || '', getClientIP(req));
        if (!captchaResult.success) {
            res.status(400).json({ error: { code: 'UPT-REG-CAPTCHA', message: captchaResult.error || 'Captcha invalido.' } });
            return;
        }
    }

    const cpfHMAC = computeCPF_HMAC(cpf, process.env.CPF_HMAC_KEY || '');
    const cpfEncrypted = encryptAES(cpf, process.env.FIELD_ENCRYPTION_KEY || '');
    const normUser = username.toUpperCase().trim();
    const normEmail = email.toLowerCase().trim();
    const clientIP = getClientIP(req);
    const userAgent = (req.headers['user-agent'] || 'Unknown').substring(0, 512);

    const pool = await getPortalConnection();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        const checkDuplicity = await new sql.Request(transaction)
            .input('username', sql.VarChar, normUser)
            .input('email', sql.VarChar, normEmail)
            .input('cpfHMAC', sql.VarChar, cpfHMAC)
            .query(`
                SELECT
                    (SELECT COUNT(*) FROM UPTPortal.dbo.PlayerAccounts WHERE AccountName = @username) as countUser,
                    (SELECT COUNT(*) FROM UPTPortal.dbo.PlayerAccounts WHERE Email = @email) as countEmail,
                    (SELECT COUNT(*) FROM UPTPortal.dbo.PlayerProfiles WHERE CPF_HMAC = @cpfHMAC) as countCPF,
                    (SELECT COUNT(*) FROM UserDB.dbo.UserInfo WHERE AccountName = @username) as countGameUser
            `);

        const { countUser, countEmail, countCPF, countGameUser } = checkDuplicity.recordset[0];
        if (countUser > 0 || countGameUser > 0) {
            await transaction.rollback();
            res.status(400).json({ error: { code: 'UPT-REG-005', message: 'Nome de conta ja esta em uso.' } });
            return;
        }
        if (countEmail > 0) {
            await transaction.rollback();
            res.status(400).json({ error: { code: 'UPT-REG-006', message: 'E-mail ja esta em uso.' } });
            return;
        }
        if (countCPF > 0) {
            await transaction.rollback();
            res.status(400).json({ error: { code: 'UPT-REG-007', message: 'CPF ja cadastrado no sistema.' } });
            return;
        }

        const registerAccount = await new sql.Request(transaction)
            .input('username', sql.VarChar, normUser)
            .input('email', sql.VarChar, normEmail)
            .input('isMinor', sql.Bit, isMinor ? 1 : 0)
            .query('INSERT INTO UPTPortal.dbo.PlayerAccounts (AccountName, Email, EmailVerified, IsMinor, Active) OUTPUT INSERTED.ID VALUES (@username, @email, 0, @isMinor, 0)');

        const accountId = registerAccount.recordset[0].ID;

        await new sql.Request(transaction)
            .input('accountId', sql.Int, accountId)
            .input('fullName', sql.VarChar, fullName)
            .input('birthDate', sql.Date, new Date(birthDate))
            .input('cpfHMAC', sql.VarChar, cpfHMAC)
            .input('cpfEncrypted', sql.VarChar, cpfEncrypted)
            .input('cep', sql.VarChar, cep.replace(/\D/g, ''))
            .input('logradouro', sql.VarChar, logradouro)
            .input('numero', sql.VarChar, numero)
            .input('complemento', sql.VarChar, complemento || '')
            .input('bairro', sql.VarChar, bairro)
            .input('cidade', sql.VarChar, cidade)
            .input('estado', sql.Char, estado.toUpperCase())
            .query(`
                INSERT INTO UPTPortal.dbo.PlayerProfiles (AccountID, FullName, BirthDate, CPF_HMAC, CPF_Encrypted, CEP, Logradouro, Numero, Complemento, Bairro, Cidade, Estado)
                VALUES (@accountId, @fullName, @birthDate, @cpfHMAC, @cpfEncrypted, @cep, @logradouro, @numero, @complemento, @bairro, @cidade, @estado)
            `);

        if (age < 12 && guardianName && guardianCPF) {
            const guardianCPFEnc = encryptAES(guardianCPF, process.env.FIELD_ENCRYPTION_KEY || '');
            await new sql.Request(transaction)
                .input('minorId', sql.Int, accountId)
                .input('gName', sql.VarChar, guardianName)
                .input('gEmail', sql.VarChar, normEmail)
                .input('gCPFEnc', sql.VarChar, guardianCPFEnc)
                .input('ip', sql.VarChar, clientIP)
                .query(`
                    INSERT INTO UPTPortal.dbo.GuardianConsents (MinorAccountID, GuardianName, GuardianEmail, GuardianCPF_Encrypted, IPAddress)
                    VALUES (@minorId, @gName, @gEmail, @gCPFEnc, @ip)
                `);
        }

        const docs = await new sql.Request(transaction).query('SELECT ID FROM UPTPortal.dbo.LegalDocuments WHERE Active = 1');
        for (const doc of docs.recordset) {
            await new sql.Request(transaction)
                .input('accountId', sql.Int, accountId)
                .input('docId', sql.Int, doc.ID)
                .input('ip', sql.VarChar, clientIP)
                .input('ua', sql.VarChar, userAgent)
                .query(`
                    INSERT INTO UPTPortal.dbo.LegalAcceptances (AccountID, DocumentID, AcceptedAtUtc, IPAddress, UserAgent, Method)
                    VALUES (@accountId, @docId, GETUTCDATE(), @ip, @ua, 'web-form')
                `);
        }

        const clientHash = hashPasswordClientStyle(username, password);
        await new sql.Request(transaction)
            .input('username', sql.VarChar, normUser)
            .input('password', sql.VarChar, clientHash)
            .query(`
                INSERT INTO UserDB.dbo.UserInfo (AccountName, Password, Flag, Active, RegisDay, ActiveCode, Coins, Email, GameMasterType, GameMasterLevel, GameMasterMacAddress, CoinsTraded, BanStatus, IsMuted, MuteCount)
                VALUES (@username, @password, 114, 0, CONVERT(varchar, GETDATE(), 120), '', 0, '', 0, 0, '', 0, 0, 0, 0)
            `);

        const getGameId = await new sql.Request(transaction)
            .input('username', sql.VarChar, normUser)
            .query('SELECT ID FROM UserDB.dbo.UserInfo WHERE AccountName = @username');

        const gameUserId = getGameId.recordset[0].ID;

        await new sql.Request(transaction)
            .input('accountId', sql.Int, accountId)
            .input('userInfoId', sql.Int, gameUserId)
            .query('UPDATE UPTPortal.dbo.PlayerAccounts SET UserInfoID = @userInfoId WHERE ID = @accountId');

        await new sql.Request(transaction)
            .input('accountId', sql.Int, accountId)
            .input('ip', sql.VarChar, clientIP)
            .input('ua', sql.VarChar, userAgent)
            .query("INSERT INTO UPTPortal.dbo.SecurityAuditLog (AccountID, Event, IPAddress, UserAgent, Details) VALUES (@accountId, 'REGISTER_SUCCESS', @ip, @ua, 'Conta criada. Aguardando verificacao de e-mail.')");

        await transaction.commit();

        if (config.otp.enabled && isSmtpConfigured()) {
            await createAndSendOTP(accountId, normEmail, normUser, clientIP, userAgent);
        }

        res.json({
            success: true,
            accountId: accountId,
            emailMasked: maskEmail(normEmail),
            otpRequired: config.otp.enabled && isSmtpConfigured(),
            message: config.otp.enabled && isSmtpConfigured()
                ? 'Conta criada. Verifique seu e-mail para ativar.'
                : 'Conta criada com sucesso. A verificacao de e-mail sera disponibilizada em breve.'
        });

    } catch (transErr: any) {
        try { await transaction.rollback(); } catch (_) {}
        console.error('[REGISTER-ROUTE-ERROR]:', transErr.message);
        res.status(500).json({ error: { code: 'UPT-REG-500', message: 'Falha critica no banco ao registrar conta.' } });
    }
});

// POST /api/auth/verify-email
router.post('/auth/verify-email', otpVerifyLimiter, async (req: Request, res: Response): Promise<void> => {
    const { accountId, code } = req.body;

    if (!accountId || !code || typeof code !== 'string' || code.length !== 6) {
        res.status(400).json({ error: { code: 'UPT-OTP-BAD', message: 'Codigo de verificacao invalido.' } });
        return;
    }

    const clientIP = getClientIP(req);
    const userAgent = (req.headers['user-agent'] || 'Unknown').substring(0, 512);

    try {
        const result = await verifyOTP(Number(accountId), code, clientIP, userAgent);

        if (!result.success) {
            res.status(400).json({ error: { code: result.errorCode || 'UPT-OTP-FAIL', message: result.error } });
            return;
        }

        await activateAccountAfterOTP(Number(accountId));

        const pool = await getPortalConnection();
        await pool.request()
            .input('accountId', sql.Int, Number(accountId))
            .input('ip', sql.VarChar, clientIP)
            .input('ua', sql.VarChar, userAgent)
            .query("INSERT INTO SecurityAuditLog (AccountID, Event, IPAddress, UserAgent, Details) VALUES (@accountId, 'EMAIL_VERIFIED', @ip, @ua, 'E-mail verificado via OTP.')");

        res.json({ success: true, message: 'E-mail verificado com sucesso. Voce ja pode fazer login.' });

    } catch (err: any) {
        console.error('[VERIFY-EMAIL-ERROR]:', err.message);
        res.status(500).json({ error: { code: 'UPT-OTP-500', message: 'Erro ao verificar e-mail.' } });
    }
});

// POST /api/auth/resend-verification
router.post('/auth/resend-verification', otpResendLimiter, async (req: Request, res: Response): Promise<void> => {
    const { accountId } = req.body;

    if (!accountId) {
        res.status(400).json({ error: { code: 'UPT-OTP-BAD', message: 'ID da conta ausente.' } });
        return;
    }

    const clientIP = getClientIP(req);
    const userAgent = (req.headers['user-agent'] || 'Unknown').substring(0, 512);

    try {
        const pool = await getPortalConnection();
        const account = await pool.request()
            .input('accountId', sql.Int, Number(accountId))
            .query('SELECT AccountName, Email, EmailVerified FROM PlayerAccounts WHERE ID = @accountId');

        if (account.recordset.length === 0) {
            res.status(400).json({ error: { code: 'UPT-OTP-NOTFOUND', message: 'Conta nao encontrada.' } });
            return;
        }

        if (account.recordset[0].EmailVerified) {
            res.json({ success: true, message: 'E-mail ja verificado.' });
            return;
        }

        const result = await createAndSendOTP(
            Number(accountId),
            account.recordset[0].Email,
            account.recordset[0].AccountName,
            clientIP,
            userAgent
        );

        if (!result.success) {
            res.status(429).json({ error: { code: 'UPT-OTP-COOLDOWN', message: result.error } });
            return;
        }

        res.json({
            success: true,
            emailMasked: maskEmail(account.recordset[0].Email),
            message: 'Novo codigo enviado.'
        });
    } catch (err: any) {
        console.error('[RESEND-OTP-ERROR]:', err.message);
        res.status(500).json({ error: { code: 'UPT-OTP-500', message: 'Erro ao reenviar codigo.' } });
    }
});

// POST /api/auth/login
router.post('/auth/login', authLimiter, async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ error: { code: 'UPT-AUTH-003', message: 'Preencha conta e senha.' } });
        return;
    }

    try {
        const portalPool = await getPortalConnection();
        const gamePool = await getGameConnection();

        const normUser = username.toUpperCase().trim();
        const clientHash = hashPasswordClientStyle(username, password);
        const clientIP = getClientIP(req);
        const userAgent = (req.headers['user-agent'] || 'Unknown').substring(0, 512);

        const checkGameUser = await gamePool.request()
            .input('username', sql.VarChar, normUser)
            .query('SELECT ID, Password, Active FROM UserInfo WHERE AccountName = @username');

        if (checkGameUser.recordset.length === 0 || checkGameUser.recordset[0].Password !== clientHash) {
            await portalPool.request()
                .input('ip', sql.VarChar, clientIP)
                .input('ua', sql.VarChar, userAgent)
                .query("INSERT INTO SecurityAuditLog (AccountID, Event, IPAddress, UserAgent, Details) VALUES (NULL, 'LOGIN_FAILED', @ip, @ua, 'Credenciais invalidas')");

            res.status(400).json({ error: { code: 'UPT-AUTH-004', message: 'Usuario ou senha incorretos.' } });
            return;
        }

        let portalUser = await portalPool.request()
            .input('username', sql.VarChar, normUser)
            .query('SELECT ID, IsMinor, EmailVerified, Email FROM PlayerAccounts WHERE AccountName = @username');

        let accountId = 0;
        if (portalUser.recordset.length === 0) {
            const createPortalUser = await portalPool.request()
                .input('username', sql.VarChar, normUser)
                .input('userInfoId', sql.Int, checkGameUser.recordset[0].ID)
                .query("INSERT INTO PlayerAccounts (AccountName, Email, EmailVerified, UserInfoID, Active) OUTPUT INSERTED.ID VALUES (@username, '', 1, @userInfoId, 1)");
            accountId = createPortalUser.recordset[0].ID;
        } else {
            accountId = portalUser.recordset[0].ID;

            if (portalUser.recordset[0].Email && !portalUser.recordset[0].EmailVerified && config.otp.enabled) {
                res.status(403).json({
                    error: {
                        code: 'UPT-AUTH-EMAIL-UNVERIFIED',
                        message: 'E-mail ainda nao verificado. Verifique sua caixa de entrada.',
                        accountId: accountId,
                        emailMasked: maskEmail(portalUser.recordset[0].Email)
                    }
                });
                return;
            }
        }

        if (checkGameUser.recordset[0].Active !== 1) {
            res.status(400).json({ error: { code: 'UPT-AUTH-005', message: 'Esta conta esta inativa ou suspensa.' } });
            return;
        }

        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

        await portalPool.request()
            .input('tokenHash', sql.VarChar, tokenHash)
            .input('accountId', sql.Int, accountId)
            .input('expires', sql.DateTime, expiresAt)
            .input('ip', sql.VarChar, clientIP)
            .input('ua', sql.VarChar, userAgent)
            .query('INSERT INTO PlayerSessions (TokenHash, AccountID, ExpiresAt, IPAddress, UserAgent) VALUES (@tokenHash, @accountId, @expires, @ip, @ua)');

        await portalPool.request()
            .input('accountId', sql.Int, accountId)
            .input('ip', sql.VarChar, clientIP)
            .input('ua', sql.VarChar, userAgent)
            .query("INSERT INTO SecurityAuditLog (AccountID, Event, IPAddress, UserAgent, Details) VALUES (@accountId, 'LOGIN_SUCCESS', @ip, @ua, 'Autenticado com sucesso')");

        setSessionCookie(res, token, SESSION_TTL_MS);

        res.json({ success: true });

    } catch (err: any) {
        console.error('[LOGIN-ROUTE-ERROR]:', err.message);
        res.status(500).json({ error: { code: 'UPT-AUTH-500', message: 'Erro ao autenticar.' } });
    }
});

// POST /api/auth/logout
router.post('/auth/logout', async (req: Request, res: Response): Promise<void> => {
    const token = req.cookies?.[SESSION_COOKIE];

    clearSessionCookie(res);

    if (!token || typeof token !== 'string') {
        res.json({ success: true });
        return;
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const clientIP = getClientIP(req);
    const userAgent = (req.headers['user-agent'] || 'Unknown').substring(0, 512);

    try {
        const pool = await getPortalConnection();

        const session = await pool.request()
            .input('tokenHash', sql.VarChar, tokenHash)
            .query('SELECT AccountID FROM PlayerSessions WHERE TokenHash = @tokenHash AND RevokedAt IS NULL');

        const accountId = session.recordset.length > 0 ? session.recordset[0].AccountID : null;

        await pool.request()
            .input('tokenHash', sql.VarChar, tokenHash)
            .query('UPDATE PlayerSessions SET RevokedAt = GETUTCDATE() WHERE TokenHash = @tokenHash AND RevokedAt IS NULL');

        if (accountId) {
            await pool.request()
                .input('accountId', sql.Int, accountId)
                .input('ip', sql.VarChar, clientIP)
                .input('ua', sql.VarChar, userAgent)
                .query("INSERT INTO SecurityAuditLog (AccountID, Event, IPAddress, UserAgent, Details) VALUES (@accountId, 'LOGOUT', @ip, @ua, 'Sessao encerrada pelo usuario')");
        }

        res.json({ success: true });

    } catch (err: any) {
        console.error('[LOGOUT-ROUTE-ERROR]:', err.message);
        res.json({ success: true });
    }
});

// GET /api/auth/csrf
router.get('/auth/csrf', csrfToken);

// GET /api/player/me
router.get('/player/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
    const accountId = (req as any).accountId;

    try {
        const portalPool = await getPortalConnection();
        const gamePool = await getGameConnection();

        const profileQuery = await portalPool.request()
            .input('accountId', sql.Int, accountId)
            .query(`
                SELECT a.AccountName, a.Email, a.IsMinor, a.EmailVerified,
                       p.FullName, p.BirthDate, p.CPF_Encrypted,
                       p.CEP, p.Logradouro, p.Numero, p.Complemento, p.Bairro, p.Cidade, p.Estado
                FROM PlayerAccounts a
                LEFT JOIN PlayerProfiles p ON a.ID = p.AccountID
                WHERE a.ID = @accountId
            `);

        if (profileQuery.recordset.length === 0) {
            res.status(404).json({ error: { code: 'UPT-ME-001', message: 'Perfil nao encontrado.' } });
            return;
        }

        const data = profileQuery.recordset[0];

        let cpfMascarado = '***.***.***-00';
        if (data.CPF_Encrypted) {
            try {
                const cpfDecrypted = decryptAES(data.CPF_Encrypted, process.env.FIELD_ENCRYPTION_KEY || '');
                if (cpfDecrypted.length === 11) {
                    cpfMascarado = `***.***.${cpfDecrypted.substring(6, 9)}-${cpfDecrypted.substring(9, 11)}`;
                }
            } catch (e) {
                // keep default mask
            }
        }

        const charQuery = await gamePool.request()
            .input('username', sql.VarChar, data.AccountName)
            .query(`SELECT ci.Name, ci.Level, ci.Experience,
                           COALESCE(cd.ClassName, CONCAT('Classe #', ci.JobCode)) as Class
                    FROM CharacterInfo ci
                    LEFT JOIN ClassDef cd ON ci.JobCode = cd.ClassID
                    WHERE ci.AccountName = @username`);

        res.json({
            account: {
                username: data.AccountName,
                email: data.Email,
                emailVerified: !!data.EmailVerified,
                isMinor: data.IsMinor
            },
            profile: data.FullName ? {
                fullName: data.FullName,
                birthDate: data.BirthDate,
                cpf: cpfMascarado,
                cep: data.CEP,
                address: `${data.Logradouro}, ${data.Numero} ${data.Complemento ? '- ' + data.Complemento : ''}`
            } : null,
            characters: charQuery.recordset
        });

    } catch (err: any) {
        console.error('[ME-ROUTE-ERROR]:', err.message);
        res.status(500).json({ error: { code: 'UPT-ME-500', message: 'Erro ao carregar dados do painel.' } });
    }
});

// GET /api/public/server-status
router.get('/public/server-status', statusLimiter, async (_req: Request, res: Response): Promise<void> => {
    try {
        const status = await getServerStatus();
        res.json(status);
    } catch (err: any) {
        console.error('[STATUS-ROUTE-ERROR]:', err.message);
        res.json({
            status: 'unknown',
            maintenance: false,
            players: { online: null, capacity: null },
            services: {
                loginServer: { status: 'unknown', latencyMs: null },
                gameServer: { status: 'unknown', latencyMs: null },
            },
            updatedAt: new Date().toISOString(),
            stale: true,
        });
    }
});

// GET /api/public/captcha-config
router.get('/public/captcha-config', (_req: Request, res: Response): void => {
    res.json({
        provider: config.captcha.provider,
        siteKey: config.captcha.siteKey && config.captcha.siteKey !== 'CHANGE_ME' ? config.captcha.siteKey : null,
        required: config.captcha.required,
        registrationEnabled: config.registration.enabled,
    });
});

// GET /api/address/cep/:cep
router.get('/address/cep/:cep', async (req: Request, res: Response): Promise<void> => {
    const rawCep = (req.params.cep as string).replace(/\D/g, '');
    if (rawCep.length !== 8) {
        res.status(400).json({ error: { code: 'UPT-CEP-001', message: 'CEP invalido.' } });
        return;
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`, { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) throw new Error('ViaCEP offline');
        const data: any = await response.json();

        if (data.erro) {
            res.status(404).json({ error: { code: 'UPT-CEP-002', message: 'CEP nao encontrado.' } });
            return;
        }

        res.json({
            cep: rawCep,
            logradouro: data.logradouro || '',
            bairro: data.bairro || '',
            cidade: data.localidade || '',
            estado: data.uf || ''
        });

    } catch (err) {
        res.json({
            cep: rawCep,
            logradouro: '',
            bairro: '',
            cidade: '',
            estado: ''
        });
    }
});

// Stubs
router.post('/auth/forgot-password', (_req, res) => res.status(501).json({ error: { code: 'UPT-NYI-002', message: 'Recuperacao de senha ainda nao disponivel.' } }));
router.post('/auth/reset-password', (_req, res) => res.status(501).json({ error: { code: 'UPT-NYI-003', message: 'Redefinicao de senha ainda nao disponivel.' } }));
router.get('/legal/documents/current', (_req, res) => res.json({ success: true }));
router.patch('/player/me', requireAuth, requireCSRF, (_req, res) => res.status(501).json({ error: { code: 'UPT-NYI-004', message: 'Atualizacao de perfil ainda nao disponivel.' } }));
router.get('/player/legal-acceptances', requireAuth, (_req, res) => res.json({ success: true }));

export default router;
