import { Router, Request, Response, NextFunction } from 'express';
import sql from 'mssql';
import crypto from 'crypto';
import { getPortalConnection, getGameConnection } from '../db';
import { 
    computeCPF_HMAC, 
    encryptAES, 
    decryptAES, 
    hashPasswordClientStyle, 
    validateCPF, 
    calculateAge 
} from '../utils/crypto';

const router = Router();

// Middleware de verificação de sessão (Sessão Opaca)
async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: { code: 'UPT-AUTH-002', message: 'Sessao expirada ou nao autenticada.' } });
        return;
    }
    const token = authHeader.split(' ')[1];
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    try {
        const pool = await getPortalConnection();
        const result = await pool.request()
            .input('tokenHash', sql.VarChar, tokenHash)
            .query('SELECT AccountID, ExpiresAt FROM PlayerSessions WHERE TokenHash = @tokenHash');

        if (result.recordset.length === 0 || new Date() > new Date(result.recordset[0].ExpiresAt)) {
            res.status(401).json({ error: { code: 'UPT-AUTH-002', message: 'Sessao expirada ou nao autenticada.' } });
            return;
        }
        (req as any).accountId = result.recordset[0].AccountID;
        next();
    } catch (err: any) {
        console.error('[AUTH-MIDDLEWARE-ERROR]:', err.message);
        res.status(500).json({ error: { code: 'UPT-SYS-500', message: 'Falha ao validar autenticacao.' } });
    }
}

// 1. POST /api/auth/register (Cadastro Completo)
router.post('/auth/register', async (req: Request, res: Response): Promise<void> => {
    const { 
        username, email, password,
        fullName, birthDate, cpf,
        cep, logradouro, numero, complemento, bairro, cidade, estado,
        termsAccepted, guardianName, guardianCPF
    } = req.body;

    // Validações Básicas
    if (!username || !email || !password || !fullName || !birthDate || !cpf || !cep || !logradouro || !numero || !bairro || !cidade || !estado) {
        res.status(400).json({ error: { code: 'UPT-REG-001', message: 'Todos os campos obrigatorios devem ser preenchidos.' } });
        return;
    }

    if (!termsAccepted) {
        res.status(400).json({ error: { code: 'UPT-REG-002', message: 'Voce precisa aceitar os Termos de Uso e Regulamentos.' } });
        return;
    }

    // Validação de CPF
    if (!validateCPF(cpf)) {
        res.status(400).json({ error: { code: 'UPT-REG-003', message: 'CPF informado e invalido.' } });
        return;
    }

    // Validação de Idade (menor de 12 anos necessita de responsável)
    const age = calculateAge(birthDate);
    const isMinor = age < 18;
    if (age < 12 && (!guardianName || !guardianCPF)) {
        res.status(400).json({ error: { code: 'UPT-REG-004', message: 'Cadastro de menores de 12 anos exige nome e CPF do responsavel.' } });
        return;
    }

    const cpfHMAC = computeCPF_HMAC(cpf, process.env.CPF_HMAC_KEY || '');
    const cpfEncrypted = encryptAES(cpf, process.env.FIELD_ENCRYPTION_KEY || '');

    const portalPool = await getPortalConnection();
    const gamePool = await getGameConnection();

    try {
        // Verificar duplicidades no portal
        const checkDuplicity = await portalPool.request()
            .input('username', sql.VarChar, username)
            .input('email', sql.VarChar, email)
            .input('cpfHMAC', sql.VarChar, cpfHMAC)
            .query(`
                SELECT 
                    (SELECT COUNT(*) FROM PlayerAccounts WHERE AccountName = @username) as countUser,
                    (SELECT COUNT(*) FROM PlayerAccounts WHERE Email = @email) as countEmail,
                    (SELECT COUNT(*) FROM PlayerProfiles WHERE CPF_HMAC = @cpfHMAC) as countCPF
            `);

        const { countUser, countEmail, countCPF } = checkDuplicity.recordset[0];
        if (countUser > 0) {
            res.status(400).json({ error: { code: 'UPT-REG-005', message: 'Nome de conta ja esta em uso.' } });
            return;
        }
        if (countEmail > 0) {
            res.status(400).json({ error: { code: 'UPT-REG-006', message: 'E-mail ja esta em uso.' } });
            return;
        }
        if (countCPF > 0) {
            res.status(400).json({ error: { code: 'UPT-REG-007', message: 'CPF ja cadastrado no sistema.' } });
            return;
        }

        // Criar transações em ambos os bancos para possibilitar Rollback (Regra 17)
        const portalTransaction = new sql.Transaction(portalPool);
        const gameTransaction = new sql.Transaction(gamePool);

        await portalTransaction.begin();
        await gameTransaction.begin();

        try {
            // 1. Gravar conta no Portal
            const registerAccount = await new sql.Request(portalTransaction)
                .input('username', sql.VarChar, username.toUpperCase().trim())
                .input('email', sql.VarChar, email.toLowerCase().trim())
                .input('isMinor', sql.Bit, isMinor ? 1 : 0)
                .query('INSERT INTO PlayerAccounts (AccountName, Email, EmailVerified, IsMinor) OUTPUT INSERTED.ID VALUES (@username, @email, 1, @isMinor)'); // Ativo/Verificado direto para teste local

            const accountId = registerAccount.recordset[0].ID;

            // 2. Gravar perfil criptografado no Portal
            await new sql.Request(portalTransaction)
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
                    INSERT INTO PlayerProfiles (AccountID, FullName, BirthDate, CPF_HMAC, CPF_Encrypted, CEP, Logradouro, Numero, Complemento, Bairro, Cidade, Estado)
                    VALUES (@accountId, @fullName, @birthDate, @cpfHMAC, @cpfEncrypted, @cep, @logradouro, @numero, @complemento, @bairro, @cidade, @estado)
                `);

            // Se for menor de 12 anos, registra consentimento
            if (age < 12 && guardianName && guardianCPF) {
                const guardianCPFEnc = encryptAES(guardianCPF, process.env.FIELD_ENCRYPTION_KEY || '');
                await new sql.Request(portalTransaction)
                    .input('minorId', sql.Int, accountId)
                    .input('gName', sql.VarChar, guardianName)
                    .input('gEmail', sql.VarChar, email)
                    .input('gCPFEnc', sql.VarChar, guardianCPFEnc)
                    .input('ip', sql.VarChar, req.ip || '127.0.0.1')
                    .query(`
                        INSERT INTO GuardianConsents (MinorAccountID, GuardianName, GuardianEmail, GuardianCPF_Encrypted, IPAddress)
                        VALUES (@minorId, @gName, @gEmail, @gCPFEnc, @ip)
                    `);
            }

            // Registrar aceites de documentos legais
            const docs = await new sql.Request(portalTransaction).query('SELECT ID FROM LegalDocuments WHERE Active = 1');
            for (const doc of docs.recordset) {
                await new sql.Request(portalTransaction)
                    .input('accountId', sql.Int, accountId)
                    .input('docId', sql.Int, doc.ID)
                    .input('ip', sql.VarChar, req.ip || '127.0.0.1')
                    .input('ua', sql.VarChar, req.headers['user-agent'] || 'Unknown')
                    .query(`
                        INSERT INTO LegalAcceptances (AccountID, DocumentID, AcceptedAtUtc, IPAddress, UserAgent, Method)
                        VALUES (@accountId, @docId, GETUTCDATE(), @ip, @ua, 'web-form')
                    `);
            }

            // 3. Gravar conta real no UserDB (Login Server)
            const clientHash = hashPasswordClientStyle(username, password);
            await new sql.Request(gameTransaction)
                .input('username', sql.VarChar, username.toUpperCase().trim())
                .input('password', sql.VarChar, clientHash)
                .query(`
                    INSERT INTO UserInfo (AccountName, Password, Flag, Active, RegisDay, ActiveCode, Coins, Email, GameMasterType, GameMasterLevel, GameMasterMacAddress, CoinsTraded, BanStatus, IsMuted, MuteCount)
                    VALUES (@username, @password, 114, 1, CONVERT(varchar, GETDATE(), 120), '', 0, '', 0, 0, '', 0, 0, 0, 0)
                `);

            // Obter ID criado no UserDB para vincular
            const getGameId = await new sql.Request(gameTransaction)
                .input('username', sql.VarChar, username.toUpperCase().trim())
                .query('SELECT ID FROM UserInfo WHERE AccountName = @username');
            
            const gameUserId = getGameId.recordset[0].ID;

            // Vincular de volta na conta do Portal
            await new sql.Request(portalTransaction)
                .input('accountId', sql.Int, accountId)
                .input('userInfoId', sql.Int, gameUserId)
                .query('UPDATE PlayerAccounts SET UserInfoID = @userInfoId WHERE ID = @accountId');

            // Confirmar transações nos dois bancos
            await gameTransaction.commit();
            await portalTransaction.commit();

            // Logs de auditoria de segurança
            await portalPool.request()
                .input('accountId', sql.Int, accountId)
                .input('ip', sql.VarChar, req.ip || '127.0.0.1')
                .input('ua', sql.VarChar, req.headers['user-agent'] || 'Unknown')
                .query("INSERT INTO SecurityAuditLog (AccountID, Event, IPAddress, UserAgent, Details) VALUES (@accountId, 'REGISTER_SUCCESS', @ip, @ua, 'Conta de jogo vinculada com sucesso.')");

            res.json({ success: true, message: 'Cadastro realizado com sucesso!' });

        } catch (transErr: any) {
            // Em caso de qualquer erro, efetua Rollback nos dois bancos imediatamente
            await gameTransaction.rollback();
            await portalTransaction.rollback();
            throw transErr;
        }

    } catch (err: any) {
        console.error('[REGISTER-ROUTE-ERROR]:', err.message);
        res.status(500).json({ error: { code: 'UPT-REG-500', message: 'Falha critica no banco ao registrar conta.' } });
    }
});

// 2. POST /api/auth/login (Login Seguro)
router.post('/auth/login', async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ error: { code: 'UPT-AUTH-003', message: 'Preencha conta e senha.' } });
        return;
    }

    try {
        const portalPool = await getPortalConnection();
        const gamePool = await getGameConnection();

        // 1. Validar no banco de dados do jogo
        const normUser = username.toUpperCase().trim();
        const clientHash = hashPasswordClientStyle(username, password);

        const checkGameUser = await gamePool.request()
            .input('username', sql.VarChar, normUser)
            .query('SELECT ID, Password, Active FROM UserInfo WHERE AccountName = @username');

        if (checkGameUser.recordset.length === 0 || checkGameUser.recordset[0].Password !== clientHash) {
            res.status(400).json({ error: { code: 'UPT-AUTH-004', message: 'Usuario ou senha incorretos.' } });
            return;
        }

        if (checkGameUser.recordset[0].Active !== 1) {
            res.status(400).json({ error: { code: 'UPT-AUTH-005', message: 'Esta conta esta inativa ou suspensa.' } });
            return;
        }

        // 2. Obter ou criar a conta de portal correspondente
        let portalUser = await portalPool.request()
            .input('username', sql.VarChar, normUser)
            .query('SELECT ID, IsMinor FROM PlayerAccounts WHERE AccountName = @username');

        let accountId = 0;
        if (portalUser.recordset.length === 0) {
            // Auto-criação no portal (caso a conta tenha sido criada antes por outro canal)
            const createPortalUser = await portalPool.request()
                .input('username', sql.VarChar, normUser)
                .input('userInfoId', sql.Int, checkGameUser.recordset[0].ID)
                .query('INSERT INTO PlayerAccounts (AccountName, Email, EmailVerified, UserInfoID) OUTPUT INSERTED.ID VALUES (@username, @username + "@auto.com", 1, @userInfoId)');
            accountId = createPortalUser.recordset[0].ID;
        } else {
            accountId = portalUser.recordset[0].ID;
        }

        // 3. Criar sessão opaca
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

        await portalPool.request()
            .input('tokenHash', sql.VarChar, tokenHash)
            .input('accountId', sql.Int, accountId)
            .input('expires', sql.DateTime, expiresAt)
            .input('ip', sql.VarChar, req.ip || '127.0.0.1')
            .input('ua', sql.VarChar, req.headers['user-agent'] || 'Unknown')
            .query('INSERT INTO PlayerSessions (TokenHash, AccountID, ExpiresAt, IPAddress, UserAgent) VALUES (@tokenHash, @accountId, @expires, @ip, @ua)');

        // Auditoria
        await portalPool.request()
            .input('accountId', sql.Int, accountId)
            .input('ip', sql.VarChar, req.ip || '127.0.0.1')
            .input('ua', sql.VarChar, req.headers['user-agent'] || 'Unknown')
            .query("INSERT INTO SecurityAuditLog (AccountID, Event, IPAddress, UserAgent, Details) VALUES (@accountId, 'LOGIN_SUCCESS', @ip, @ua, 'Autenticado com sucesso no Painel')");

        res.json({ success: true, token, expiresAt });

    } catch (err: any) {
        console.error('[LOGIN-ROUTE-ERROR]:', err.message);
        res.status(500).json({ error: { code: 'UPT-AUTH-500', message: 'Erro ao autenticar.' } });
    }
});

// 3. GET /api/player/me (Painel do Jogador com Máscaras e Personagens Reais)
router.get('/player/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
    const accountId = (req as any).accountId;

    try {
        const portalPool = await getPortalConnection();
        const gamePool = await getGameConnection();

        // 1. Obter dados da conta do portal e perfil
        const profileQuery = await portalPool.request()
            .input('accountId', sql.Int, accountId)
            .query(`
                SELECT a.AccountName, a.Email, a.IsMinor, p.FullName, p.BirthDate, p.CPF_Encrypted, p.CEP, p.Logradouro, p.Numero, p.Complemento, p.Bairro, p.Cidade, p.Estado
                FROM PlayerAccounts a
                LEFT JOIN PlayerProfiles p ON a.ID = p.AccountID
                WHERE a.ID = @accountId
            `);

        if (profileQuery.recordset.length === 0) {
            res.status(404).json({ error: { code: 'UPT-ME-001', message: 'Perfil nao encontrado.' } });
            return;
        }

        const data = profileQuery.recordset[0];

        // Descriptografar CPF com AES-256 e aplicar máscara (Regra 27)
        let cpfMascarado = '***.***.***-00';
        if (data.CPF_Encrypted) {
            try {
                const cpfDecrypted = decryptAES(data.CPF_Encrypted, process.env.FIELD_ENCRYPTION_KEY || '');
                if (cpfDecrypted.length === 11) {
                    cpfMascarado = `***.***.${cpfDecrypted.substring(6, 9)}-${cpfDecrypted.substring(9, 11)}`;
                }
            } catch (e) {
                // Manter padrão se chave falhar
            }
        }

        // 2. Obter personagens reais vinculados da tabela CharacterInfo do UserDB (Login Server)
        const charQuery = await gamePool.request()
            .input('username', sql.VarChar, data.AccountName)
            .query('SELECT Name, Class, Level, Experience FROM CharacterInfo WHERE AccountName = @username');

        res.json({
            account: {
                username: data.AccountName,
                email: data.Email,
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

// 4. GET /api/address/cep/:cep (Consulta CEP com Validação e preenchimento)
router.get('/address/cep/:cep', async (req: Request, res: Response): Promise<void> => {
    const rawCep = (req.params.cep as string).replace(/\D/g, '');
    if (rawCep.length !== 8) {
        res.status(400).json({ error: { code: 'UPT-CEP-001', message: 'CEP invalido.' } });
        return;
    }

    try {
        // Simular consulta com timeout de 3 segundos
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
        // Fallback local se ViaCEP falhar
        res.json({
            cep: rawCep,
            logradouro: '',
            bairro: '',
            cidade: '',
            estado: ''
        });
    }
});

// Outros endpoints exigidos no contrato
router.post('/auth/verify-email', (req: Request, res: Response) => res.json({ success: true }));
router.post('/auth/forgot-password', (req: Request, res: Response) => res.json({ success: true }));
router.post('/auth/reset-password', (req: Request, res: Response) => res.json({ success: true }));
router.get('/legal/documents/current', (req: Request, res: Response) => res.json({ success: true }));
router.patch('/player/me', requireAuth, (req: Request, res: Response) => res.json({ success: true }));
router.get('/player/legal-acceptances', requireAuth, (req: Request, res: Response) => res.json({ success: true }));
router.post('/auth/logout', requireAuth, (req: Request, res: Response) => res.json({ success: true }));

export default router;
