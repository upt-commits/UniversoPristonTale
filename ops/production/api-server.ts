// Deployment template: copy to api/src/server.ts on the Windows production host.
// Kept separate because that host contains legacy routes not present in this repository.
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config, validateProductionConfig } from './config';
import apiRoutes from './routes';
import statusRoutes from './server-status/routes';
import { startStatusMonitor } from './server-status/monitor';
import { isSmtpConfigured, verifySmtpConnection } from './services/email';

validateProductionConfig();
const app = express();
const trustProxyValue = config.trustProxy;
app.set('trust proxy', /^\d+$/.test(trustProxyValue) ? parseInt(trustProxyValue, 10) : trustProxyValue);
app.use(helmet());
const allowedOrigins = ['https://universopt.com.br', 'https://www.universopt.com.br', 'https://universo-priston-tale.beto1910.chatgpt.site'];
if (!config.isProduction) allowedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000');
app.use(cors({ origin: (origin, callback) => !origin || allowedOrigins.includes(origin) ? callback(null, true) : callback(new Error('Acesso bloqueado por diretiva CORS do UPT')), credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { error: { code: 'UPT-RATE-001', message: 'Muitas requisicoes vindas deste IP. Tente novamente mais tarde.' } } }));
app.use('/api', apiRoutes);
app.use('/api/internal', statusRoutes);
app.get('/health', (_req: Request, res: Response) => res.json({ status: 'UPT API is secure and running!' }));
app.get('/api/health', (_req: Request, res: Response) => res.json({ status: 'UPT API is secure and running!' }));
app.use((err: any, _req: Request, res: Response, _next: any) => { console.error('[UPT-ERROR-GLOBAL]:', err.message); res.status(500).json({ error: { code: 'UPT-SYS-500', message: 'Ocorreu um erro interno de processamento no servidor. Tente novamente.' } }); });
app.listen(config.port, config.host, async () => {
  startStatusMonitor();
  console.log(`[UPT-API]: Servidor seguro rodando na porta ${config.port}`);
  console.log(`[UPT-API]: APP_ENV=${config.appEnv}`);
  console.log(`[UPT-API]: SMTP Configured=${isSmtpConfigured()}`);
  if (isSmtpConfigured()) console.log(`[UPT-API]: SMTP Connection Verified=${await verifySmtpConnection()}`);
});
