import express, { Request, Response } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Helmet para cabeçalhos HTTP seguros
app.use(helmet());

// CORS restrito ao domínio do portal oficial
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://universopt.com.br',
  'https://www.universopt.com.br'
];
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

app.use(express.json({ limit: '10kb' })); // Proteção contra payloads excessivos

// Rate limiter geral
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo de 100 requisições por IP
  message: { error: { code: 'UPT-RATE-001', message: 'Muitas requisicoes vindas deste IP. Tente novamente mais tarde.' } }
});
app.use(limiter);

// Rotas da API
app.use('/api', apiRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'UPT API is secure and running!' });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'UPT API is secure and running!' });
});

// Tratamento de erros global para ocultar detalhes técnicos em produção
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('[UPT-ERROR-GLOBAL]:', err.message);
  res.status(500).json({
    error: {
      code: 'UPT-SYS-500',
      message: 'Ocorreu um erro interno de processamento no servidor. Tente novamente.',
      correlationId: req.headers['x-correlation-id'] || 'sys-error'
    }
  });
});

app.listen(port, () => {
  console.log(`[UPT-API]: Servidor seguro rodando na porta ${port}`);
});
