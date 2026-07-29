import nodemailer from 'nodemailer';
import { config } from '../config';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
    if (transporter) return transporter;

    transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: config.smtp.user ? {
            user: config.smtp.user,
            pass: config.smtp.password,
        } : undefined,
        connectionTimeout: config.smtp.connectionTimeout,
        greetingTimeout: config.smtp.connectionTimeout,
        socketTimeout: config.smtp.sendTimeout,
    });

    return transporter;
}

export function isSmtpConfigured(): boolean {
    return !!(config.smtp.host && config.smtp.host !== 'smtp.exemplo.com' && config.smtp.host !== 'localhost');
}

export async function verifySmtpConnection(): Promise<boolean> {
    if (!isSmtpConfigured()) return false;
    try {
        await getTransporter().verify();
        return true;
    } catch (err: any) {
        console.error('[SMTP-VERIFY]:', err.message);
        return false;
    }
}

export function maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) return '***@***.***';
    const visible = local.charAt(0);
    return `${visible}***@${domain}`;
}

export async function sendOTPEmail(to: string, otp: string, username: string): Promise<boolean> {
    if (!isSmtpConfigured()) {
        console.error('[SMTP] Tentativa de enviar e-mail sem SMTP configurado.');
        return false;
    }

    try {
        const info = await getTransporter().sendMail({
            from: config.smtp.from,
            replyTo: config.smtp.replyTo || undefined,
            to: to,
            subject: 'Universo Priston Tale - Codigo de Verificacao',
            text: [
                `Ola, ${username}!`,
                '',
                `Seu codigo de verificacao e: ${otp}`,
                '',
                `Este codigo expira em ${config.otp.ttlMinutes} minutos.`,
                'Nao compartilhe este codigo com ninguem.',
                '',
                'Se voce nao solicitou este codigo, ignore este e-mail.',
                '',
                'Universo Priston Tale',
                config.portalPublicUrl,
            ].join('\n'),
            html: [
                `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:20px;">`,
                `<h2 style="color:#333;">Universo Priston Tale</h2>`,
                `<p>Ola, <strong>${escapeHtml(username)}</strong>!</p>`,
                `<p>Seu codigo de verificacao e:</p>`,
                `<div style="background:#f5f5f5;border:2px solid #ddd;border-radius:8px;padding:20px;text-align:center;margin:16px 0;">`,
                `<span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#222;">${otp}</span>`,
                `</div>`,
                `<p style="color:#666;font-size:14px;">Este codigo expira em ${config.otp.ttlMinutes} minutos.</p>`,
                `<p style="color:#666;font-size:14px;">Nao compartilhe este codigo com ninguem.</p>`,
                `<hr style="border:none;border-top:1px solid #eee;margin:20px 0;">`,
                `<p style="color:#999;font-size:12px;">Se voce nao solicitou este codigo, ignore este e-mail.</p>`,
                `</div>`,
            ].join(''),
        });

        console.log('[SMTP] E-mail enviado. MessageId:', info.messageId);
        return true;
    } catch (err: any) {
        console.error('[SMTP-SEND-ERROR]:', err.message);
        return false;
    }
}

export async function sendTestEmail(to: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!isSmtpConfigured()) {
        return { success: false, error: 'SMTP nao configurado' };
    }

    try {
        const info = await getTransporter().sendMail({
            from: config.smtp.from,
            to: to,
            subject: 'UPT - Teste de Configuracao SMTP',
            text: 'Este e um e-mail de teste do Universo Priston Tale. Se voce recebeu, o SMTP esta funcionando corretamente.',
        });
        return { success: true, messageId: info.messageId };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
