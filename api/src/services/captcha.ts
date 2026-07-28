import { config } from '../config';

interface CaptchaVerifyResult {
    success: boolean;
    error?: string;
}

export function isCaptchaRequired(): boolean {
    if (!config.captcha.required) return false;

    if (!config.isProduction && config.captcha.allowDevBypass && !config.captcha.required) {
        return false;
    }

    return true;
}

export function isCaptchaBypassAllowed(): boolean {
    return !config.isProduction
        && !config.captcha.required
        && config.captcha.allowDevBypass;
}

export async function verifyCaptcha(token: string, remoteIp: string): Promise<CaptchaVerifyResult> {
    if (!config.captcha.required) {
        if (!config.isProduction && config.captcha.allowDevBypass) {
            return { success: true };
        }
    }

    if (!token) {
        return { success: false, error: 'Token de captcha ausente.' };
    }

    if (!config.captcha.secretKey || config.captcha.secretKey === 'CHANGE_ME') {
        return { success: false, error: 'Captcha nao configurado no servidor.' };
    }

    try {
        const verifyUrl = getCaptchaVerifyUrl();
        const body = buildVerifyBody(token, remoteIp);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(verifyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body,
            signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
            return { success: false, error: 'Falha ao verificar captcha.' };
        }

        const data: any = await response.json();

        if (!data.success) {
            return { success: false, error: 'Captcha invalido ou expirado.' };
        }

        if (config.captcha.provider === 'turnstile' && data.hostname) {
            const allowedHosts = getAllowedHostnames();
            if (!allowedHosts.includes(data.hostname)) {
                return { success: false, error: 'Captcha de hostname invalido.' };
            }
        }

        return { success: true };
    } catch (err: any) {
        if (err.name === 'AbortError') {
            return { success: false, error: 'Timeout ao verificar captcha.' };
        }
        console.error('[CAPTCHA-VERIFY-ERROR]:', err.message);
        return { success: false, error: 'Erro ao verificar captcha.' };
    }
}

function getCaptchaVerifyUrl(): string {
    switch (config.captcha.provider) {
        case 'turnstile':
            return 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
        case 'hcaptcha':
            return 'https://hcaptcha.com/siteverify';
        case 'recaptcha':
            return 'https://www.google.com/recaptcha/api/siteverify';
        default:
            return 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    }
}

function buildVerifyBody(token: string, remoteIp: string): string {
    const params = new URLSearchParams();
    params.set('secret', config.captcha.secretKey);
    params.set('response', token);
    if (remoteIp) params.set('remoteip', remoteIp);
    return params.toString();
}

function getAllowedHostnames(): string[] {
    const hosts = ['universopt.com.br', 'www.universopt.com.br'];
    if (!config.isProduction) {
        hosts.push('localhost', '127.0.0.1');
    }
    return hosts;
}
