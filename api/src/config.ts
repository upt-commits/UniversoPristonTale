import dotenv from 'dotenv';
dotenv.config();

function requireEnv(key: string, fallback?: string): string {
    const val = process.env[key] || fallback;
    if (!val) throw new Error(`[UPT-CONFIG] Missing required env var: ${key}`);
    return val;
}

function envBool(key: string, fallback: boolean): boolean {
    const val = process.env[key];
    if (val === undefined) return fallback;
    return val === 'true' || val === '1';
}

function envInt(key: string, fallback: number): number {
    const val = process.env[key];
    if (!val) return fallback;
    const n = parseInt(val, 10);
    return isNaN(n) ? fallback : n;
}

export const config = {
    port: envInt('PORT', 3001),
    host: process.env.HOST || '127.0.0.1',
    appEnv: process.env.APP_ENV || process.env.NODE_ENV || 'development',
    isProduction: (process.env.APP_ENV || process.env.NODE_ENV) === 'production',

    portalPublicUrl: process.env.PORTAL_PUBLIC_URL || 'http://localhost:3000',

    cookie: {
        name: process.env.COOKIE_NAME || 'upt_sid',
        secure: envBool('COOKIE_SECURE', false),
        sameSite: (process.env.COOKIE_SAME_SITE || 'lax') as 'lax' | 'strict' | 'none',
        sessionTtlMinutes: envInt('SESSION_TTL_MINUTES', 1440),
    },

    trustProxy: process.env.TRUST_PROXY || '1',

    smtp: {
        host: process.env.SMTP_HOST || '',
        port: envInt('SMTP_PORT', 587),
        secure: envBool('SMTP_SECURE', false),
        user: process.env.SMTP_USER || '',
        password: process.env.SMTP_PASSWORD || '',
        from: process.env.SMTP_FROM || 'noreply@universopt.com.br',
        replyTo: process.env.SMTP_REPLY_TO || '',
        connectionTimeout: envInt('SMTP_CONNECTION_TIMEOUT', 10000),
        sendTimeout: envInt('SMTP_SEND_TIMEOUT', 15000),
    },

    otp: {
        enabled: envBool('OTP_ENABLED', true),
        ttlMinutes: envInt('OTP_TTL_MINUTES', 10),
        maxAttempts: envInt('OTP_MAX_ATTEMPTS', 5),
        resendCooldownSeconds: envInt('OTP_RESEND_COOLDOWN_SECONDS', 60),
        maxResendsPerHour: envInt('OTP_MAX_RESENDS_PER_HOUR', 5),
    },

    captcha: {
        provider: process.env.CAPTCHA_PROVIDER || 'turnstile',
        siteKey: process.env.CAPTCHA_SITE_KEY || '',
        secretKey: process.env.CAPTCHA_SECRET_KEY || '',
        required: envBool('CAPTCHA_REQUIRED', true),
        allowDevBypass: envBool('ALLOW_DEV_CAPTCHA_BYPASS', false),
    },

    registration: {
        enabled: envBool('REGISTRATION_ENABLED', true),
    },

    status: {
        cacheTtlSeconds: envInt('STATUS_CACHE_TTL_SECONDS', 10),
        staleThresholdSeconds: envInt('STATUS_STALE_THRESHOLD_SECONDS', 60),
        updateIntervalSeconds: envInt('STATUS_UPDATE_INTERVAL_SECONDS', 15),
        loginServerHost: process.env.LOGIN_SERVER_HOST || '127.0.0.1',
        loginServerPort: envInt('LOGIN_SERVER_PORT', 10009),
        gameServerHost: process.env.GAME_SERVER_HOST || '127.0.0.1',
        gameServerPort: envInt('GAME_SERVER_PORT', 30010),
        maxCapacity: envInt('SERVER_MAX_CAPACITY', 0),
    },
};

export function validateProductionConfig(): void {
    if (!config.isProduction) return;

    if (!config.cookie.secure) {
        throw new Error('[UPT-CONFIG] COOKIE_SECURE must be true in production.');
    }

    if (!config.portalPublicUrl.startsWith('https://')) {
        throw new Error('[UPT-CONFIG] PORTAL_PUBLIC_URL must use HTTPS in production.');
    }

    if (config.captcha.required && (!config.captcha.siteKey || config.captcha.siteKey === 'CHANGE_ME')) {
        console.warn('[UPT-CONFIG] CAPTCHA_REQUIRED=true but CAPTCHA_SITE_KEY not configured. Registration will be disabled.');
        config.registration.enabled = false;
    }

    if (config.otp.enabled && (!config.smtp.host || config.smtp.host === 'smtp.exemplo.com')) {
        console.warn('[UPT-CONFIG] OTP_ENABLED=true but SMTP not configured. Registration will be disabled.');
        config.registration.enabled = false;
    }
}
