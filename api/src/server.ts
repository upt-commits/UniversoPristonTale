import express, { Request, Response } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config, validateProductionConfig } from './config';
import apiRoutes from './routes';
import { isSmtpConfigured, verifySmtpConnection } from './services/email';

validateProductionConfig();

const app = express();

const trustProxyValue = config.trustProxy;
if (/^\d+$/.test(trustProxyValue)) {
    app.set('trust proxy', parseInt(trustProxyValue, 10));
} else {
    app.set('trust proxy', trustProxyValue);
}

app.use(helmet());

const allowedOrigins = [
    'https://universopt.com.br',
    'https://www.universopt.com.br'
];
if (!config.isProduction) {
    allowedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000');
}

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Acesso bloqueado por diretiva CORS do UPT'));
        }
    },
    credentials: true
}));

app.use(cookieParser());

app.use(express.json({ limit: '10kb' }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    keyGenerator: (req) => req.ip || '127.0.0.1',
    message: { error: { code: 'UPT-RATE-001', message: 'Muitas requisicoes vindas deste IP. Tente novamente mais tarde.' } }
});
app.use(limiter);

app.use('/api', apiRoutes);

app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'UPT API is secure and running!' });
});

app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'UPT API is secure and running!' });
});

app.use((err: any, _req: Request, res: Response, _next: any) => {
    console.error('[UPT-ERROR-GLOBAL]:', err.message);
    res.status(500).json({
        error: {
            code: 'UPT-SYS-500',
            message: 'Ocorreu um erro interno de processamento no servidor. Tente novamente.'
        }
    });
});

app.listen(config.port, config.host, async () => {
    console.log(`[UPT-API]: Servidor seguro rodando na porta ${config.port}`);
    console.log(`[UPT-API]: APP_ENV=${config.appEnv}`);
    console.log(`[UPT-API]: Cookie Secure=${config.cookie.secure}, SameSite=${config.cookie.sameSite}`);
    console.log(`[UPT-API]: Trust Proxy=${trustProxyValue}`);
    console.log(`[UPT-API]: Registration Enabled=${config.registration.enabled}`);
    console.log(`[UPT-API]: OTP Enabled=${config.otp.enabled}`);
    console.log(`[UPT-API]: CAPTCHA Required=${config.captcha.required}`);
    console.log(`[UPT-API]: SMTP Configured=${isSmtpConfigured()}`);

    if (isSmtpConfigured()) {
        const smtpOk = await verifySmtpConnection();
        console.log(`[UPT-API]: SMTP Connection Verified=${smtpOk}`);
    }
});
