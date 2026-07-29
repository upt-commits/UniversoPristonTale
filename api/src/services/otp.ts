import crypto from 'crypto';
import sql from 'mssql';
import { config } from '../config';
import { getPortalConnection } from '../db';
import { sendOTPEmail } from './email';

export function generateOTP(): string {
    const bytes = crypto.randomBytes(4);
    const num = bytes.readUInt32BE(0) % 1000000;
    return num.toString().padStart(6, '0');
}

export function hashOTP(otp: string): string {
    return crypto.createHmac('sha256', config.smtp.from)
        .update(otp)
        .digest('hex');
}

export async function createAndSendOTP(
    accountId: number,
    email: string,
    username: string,
    ip: string,
    userAgent: string
): Promise<{ success: boolean; error?: string }> {
    const pool = await getPortalConnection();

    const resendCheck = await pool.request()
        .input('accountId', sql.Int, accountId)
        .input('since', sql.DateTime, new Date(Date.now() - config.otp.resendCooldownSeconds * 1000))
        .query('SELECT COUNT(*) as cnt FROM OTPResendLog WHERE AccountID = @accountId AND SentAt > @since');

    if (resendCheck.recordset[0].cnt > 0) {
        return { success: false, error: `Aguarde ${config.otp.resendCooldownSeconds} segundos antes de solicitar outro codigo.` };
    }

    const hourlyCheck = await pool.request()
        .input('accountId', sql.Int, accountId)
        .input('since', sql.DateTime, new Date(Date.now() - 3600000))
        .query('SELECT COUNT(*) as cnt FROM OTPResendLog WHERE AccountID = @accountId AND SentAt > @since');

    if (hourlyCheck.recordset[0].cnt >= config.otp.maxResendsPerHour) {
        return { success: false, error: 'Limite de reenvios atingido. Tente novamente mais tarde.' };
    }

    await pool.request()
        .input('accountId', sql.Int, accountId)
        .query('UPDATE EmailVerificationOTP SET UsedAt = GETUTCDATE() WHERE AccountID = @accountId AND UsedAt IS NULL');

    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const expiresAt = new Date(Date.now() + config.otp.ttlMinutes * 60 * 1000);

    await pool.request()
        .input('accountId', sql.Int, accountId)
        .input('otpHash', sql.VarChar, otpHash)
        .input('email', sql.VarChar, email)
        .input('expiresAt', sql.DateTime, expiresAt)
        .input('ip', sql.VarChar, ip)
        .input('ua', sql.VarChar, userAgent)
        .query(`INSERT INTO EmailVerificationOTP (AccountID, OTPHash, Email, ExpiresAt, IPAddress, UserAgent)
                VALUES (@accountId, @otpHash, @email, @expiresAt, @ip, @ua)`);

    await pool.request()
        .input('accountId', sql.Int, accountId)
        .input('ip', sql.VarChar, ip)
        .query('INSERT INTO OTPResendLog (AccountID, IPAddress) VALUES (@accountId, @ip)');

    const sent = await sendOTPEmail(email, otp, username);
    if (!sent) {
        return { success: false, error: 'Falha ao enviar o e-mail de verificacao. Tente novamente.' };
    }

    return { success: true };
}

export async function verifyOTP(
    accountId: number,
    code: string,
    ip: string,
    userAgent: string
): Promise<{ success: boolean; error?: string; errorCode?: string }> {
    const pool = await getPortalConnection();

    const otpRecord = await pool.request()
        .input('accountId', sql.Int, accountId)
        .query(`SELECT TOP 1 ID, OTPHash, ExpiresAt, Attempts, MaxAttempts, UsedAt
                FROM EmailVerificationOTP
                WHERE AccountID = @accountId AND UsedAt IS NULL
                ORDER BY CreatedAt DESC`);

    if (otpRecord.recordset.length === 0) {
        return { success: false, error: 'Nenhum codigo de verificacao ativo. Solicite um novo.', errorCode: 'UPT-OTP-001' };
    }

    const record = otpRecord.recordset[0];

    if (record.Attempts >= record.MaxAttempts) {
        return { success: false, error: 'Numero maximo de tentativas atingido. Solicite um novo codigo.', errorCode: 'UPT-OTP-004' };
    }

    if (new Date() > new Date(record.ExpiresAt)) {
        return { success: false, error: 'Codigo expirado. Solicite um novo codigo.', errorCode: 'UPT-OTP-002' };
    }

    await pool.request()
        .input('id', sql.Int, record.ID)
        .query('UPDATE EmailVerificationOTP SET Attempts = Attempts + 1 WHERE ID = @id');

    const inputHash = hashOTP(code);
    if (!crypto.timingSafeEqual(Buffer.from(inputHash, 'hex'), Buffer.from(record.OTPHash, 'hex'))) {
        const remaining = record.MaxAttempts - record.Attempts - 1;
        if (remaining <= 0) {
            return { success: false, error: 'Codigo incorreto. Numero maximo de tentativas atingido.', errorCode: 'UPT-OTP-004' };
        }
        return { success: false, error: `Codigo incorreto. ${remaining} tentativa(s) restante(s).`, errorCode: 'UPT-OTP-003' };
    }

    await pool.request()
        .input('id', sql.Int, record.ID)
        .query('UPDATE EmailVerificationOTP SET UsedAt = GETUTCDATE() WHERE ID = @id');

    return { success: true };
}

export async function activateAccountAfterOTP(accountId: number): Promise<void> {
    const pool = await getPortalConnection();

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
        await new sql.Request(transaction)
            .input('accountId', sql.Int, accountId)
            .query('UPDATE UPTPortal.dbo.PlayerAccounts SET EmailVerified = 1 WHERE ID = @accountId');

        const accountInfo = await new sql.Request(transaction)
            .input('accountId', sql.Int, accountId)
            .query('SELECT UserInfoID FROM UPTPortal.dbo.PlayerAccounts WHERE ID = @accountId');

        const userInfoId = accountInfo.recordset[0]?.UserInfoID;
        if (userInfoId) {
            await new sql.Request(transaction)
                .input('userInfoId', sql.Int, userInfoId)
                .query('UPDATE UserDB.dbo.UserInfo SET Active = 1 WHERE ID = @userInfoId');
        }

        await transaction.commit();
    } catch (err) {
        try { await transaction.rollback(); } catch (_) {}
        throw err;
    }
}
