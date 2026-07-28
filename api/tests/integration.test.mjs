import assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';
import http from 'node:http';
import crypto from 'node:crypto';

const API_BASE = process.env.TEST_API_URL || 'http://127.0.0.1:3001';

function makeRequest(method, path, body, cookie) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, API_BASE);
        const headers = {};
        if (body) headers['Content-Type'] = 'application/json';
        if (cookie) headers['Cookie'] = cookie;

        const req = http.request(url, { method, headers }, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                let parsed;
                try { parsed = JSON.parse(data); } catch { parsed = data; }
                resolve({ status: res.statusCode, headers: res.headers, body: parsed });
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

function extractSetCookie(headers) {
    const setCookies = headers['set-cookie'];
    if (!setCookies) return undefined;
    for (const c of setCookies) {
        if (c.startsWith('upt_sid=')) return c;
    }
    return undefined;
}

function extractCookieValue(fullCookie) {
    return fullCookie.split(';')[0];
}

function generateValidCPF() {
    const digits = [];
    for (let i = 0; i < 9; i++) digits.push(Math.floor(Math.random() * 10));
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += digits[i] * (10 - i);
    let check1 = 11 - (sum % 11);
    if (check1 >= 10) check1 = 0;
    digits.push(check1);
    sum = 0;
    for (let i = 0; i < 10; i++) sum += digits[i] * (11 - i);
    let check2 = 11 - (sum % 11);
    if (check2 >= 10) check2 = 0;
    digits.push(check2);
    const cpf = digits.join('');
    if (/^(\d)\1{10}$/.test(cpf)) return generateValidCPF();
    return cpf;
}

const testUser = `T${crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 7)}`;
const testEmail = `${testUser.toLowerCase()}@test.local`;
const testPassword = 'TestPass123';
const testCPF = generateValidCPF();
const testCPF2 = generateValidCPF();
const testCPF3 = generateValidCPF();

describe('Registration', () => {
    it('rejects missing required fields', async () => {
        const res = await makeRequest('POST', '/api/auth/register', { username: 'x' });
        assert.equal(res.status, 400);
        assert.equal(res.body.error.code, 'UPT-REG-001');
    });

    it('rejects invalid CPF', async () => {
        const res = await makeRequest('POST', '/api/auth/register', {
            username: testUser, email: testEmail, password: testPassword,
            fullName: 'Teste Auto', birthDate: '1990-01-15', cpf: '00000000001',
            cep: '01001000', logradouro: 'Rua Teste', numero: '100',
            bairro: 'Centro', cidade: 'Sao Paulo', estado: 'SP',
            termsAccepted: true
        });
        assert.equal(res.status, 400);
        assert.equal(res.body.error.code, 'UPT-REG-003');
    });

    it('rejects terms not accepted', async () => {
        const res = await makeRequest('POST', '/api/auth/register', {
            username: testUser, email: testEmail, password: testPassword,
            fullName: 'Teste Auto', birthDate: '1990-01-15', cpf: testCPF,
            cep: '01001000', logradouro: 'Rua Teste', numero: '100',
            bairro: 'Centro', cidade: 'Sao Paulo', estado: 'SP',
            termsAccepted: false
        });
        assert.equal(res.status, 400);
        assert.equal(res.body.error.code, 'UPT-REG-002');
    });

    it('rejects username too short', async () => {
        const res = await makeRequest('POST', '/api/auth/register', {
            username: 'ab', email: testEmail, password: testPassword,
            fullName: 'Teste Auto', birthDate: '1990-01-15', cpf: testCPF,
            cep: '01001000', logradouro: 'Rua Teste', numero: '100',
            bairro: 'Centro', cidade: 'Sao Paulo', estado: 'SP',
            termsAccepted: true
        });
        assert.equal(res.status, 400);
        assert.equal(res.body.error.code, 'UPT-REG-008');
    });

    it('rejects password too short', async () => {
        const res = await makeRequest('POST', '/api/auth/register', {
            username: testUser, email: testEmail, password: '123',
            fullName: 'Teste Auto', birthDate: '1990-01-15', cpf: testCPF,
            cep: '01001000', logradouro: 'Rua Teste', numero: '100',
            bairro: 'Centro', cidade: 'Sao Paulo', estado: 'SP',
            termsAccepted: true
        });
        assert.equal(res.status, 400);
        assert.equal(res.body.error.code, 'UPT-REG-009');
    });

    it('registers a valid account in both databases', async () => {
        const res = await makeRequest('POST', '/api/auth/register', {
            username: testUser, email: testEmail, password: testPassword,
            fullName: 'Teste Automatizado', birthDate: '1990-01-15', cpf: testCPF,
            cep: '01001000', logradouro: 'Rua Teste', numero: '100',
            bairro: 'Centro', cidade: 'Sao Paulo', estado: 'SP',
            termsAccepted: true
        });
        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.equal(res.body.token, undefined, 'register must not return a token');
    });

    it('rejects duplicate username', async () => {
        const res = await makeRequest('POST', '/api/auth/register', {
            username: testUser, email: 'other@test.local', password: testPassword,
            fullName: 'Outro Teste', birthDate: '1990-01-15', cpf: testCPF2,
            cep: '01001000', logradouro: 'Rua Teste', numero: '100',
            bairro: 'Centro', cidade: 'Sao Paulo', estado: 'SP',
            termsAccepted: true
        });
        assert.equal(res.status, 400);
        assert.equal(res.body.error.code, 'UPT-REG-005');
    });

    it('rejects duplicate email', async () => {
        const user2 = `X${crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 7)}`;
        const res = await makeRequest('POST', '/api/auth/register', {
            username: user2, email: testEmail, password: testPassword,
            fullName: 'Outro Teste', birthDate: '1990-01-15', cpf: testCPF3,
            cep: '01001000', logradouro: 'Rua Teste', numero: '100',
            bairro: 'Centro', cidade: 'Sao Paulo', estado: 'SP',
            termsAccepted: true
        });
        assert.equal(res.status, 400);
        assert.equal(res.body.error.code, 'UPT-REG-006');
    });

    it('rejects duplicate CPF', async () => {
        const user3 = `Y${crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 7)}`;
        const res = await makeRequest('POST', '/api/auth/register', {
            username: user3, email: `${user3.toLowerCase()}@test.local`, password: testPassword,
            fullName: 'Outro Teste', birthDate: '1990-01-15', cpf: testCPF,
            cep: '01001000', logradouro: 'Rua Teste', numero: '100',
            bairro: 'Centro', cidade: 'Sao Paulo', estado: 'SP',
            termsAccepted: true
        });
        assert.equal(res.status, 400);
        assert.equal(res.body.error.code, 'UPT-REG-007');
    });
});

describe('Login', () => {
    it('rejects empty credentials', async () => {
        const res = await makeRequest('POST', '/api/auth/login', {});
        assert.equal(res.status, 400);
    });

    it('rejects invalid password', async () => {
        const res = await makeRequest('POST', '/api/auth/login', {
            username: testUser, password: 'WrongPassword'
        });
        assert.equal(res.status, 400);
        assert.equal(res.body.error.code, 'UPT-AUTH-004');
    });

    it('returns HttpOnly cookie on valid login, no token in JSON', async () => {
        const res = await makeRequest('POST', '/api/auth/login', {
            username: testUser, password: testPassword
        });
        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.equal(res.body.token, undefined, 'token must not appear in JSON');
        assert.equal(res.body.expiresAt, undefined, 'expiresAt must not appear in JSON');

        const cookie = extractSetCookie(res.headers);
        assert.ok(cookie, 'must set upt_sid cookie');
        assert.ok(cookie.includes('HttpOnly'), 'cookie must be HttpOnly');
        assert.ok(cookie.includes('SameSite=Lax'), 'cookie must be SameSite=Lax');
        assert.ok(cookie.includes('Path=/'), 'cookie must have Path=/');
    });
});

describe('Panel /api/player/me', () => {
    let sessionCookie;

    before(async () => {
        const res = await makeRequest('POST', '/api/auth/login', {
            username: testUser, password: testPassword
        });
        const fullCookie = extractSetCookie(res.headers);
        assert.ok(fullCookie);
        sessionCookie = extractCookieValue(fullCookie);
    });

    it('rejects request without cookie (401)', async () => {
        const res = await makeRequest('GET', '/api/player/me');
        assert.equal(res.status, 401);
    });

    it('rejects request with invalid cookie (401)', async () => {
        const res = await makeRequest('GET', '/api/player/me', undefined, 'upt_sid=fake_token');
        assert.equal(res.status, 401);
    });

    it('returns profile with valid session', async () => {
        const res = await makeRequest('GET', '/api/player/me', undefined, sessionCookie);
        assert.equal(res.status, 200);
        assert.ok(res.body.account);
        assert.equal(res.body.account.username, testUser.toUpperCase());
    });
});

describe('Logout', () => {
    let sessionCookie;

    before(async () => {
        const res = await makeRequest('POST', '/api/auth/login', {
            username: testUser, password: testPassword
        });
        const fullCookie = extractSetCookie(res.headers);
        assert.ok(fullCookie);
        sessionCookie = extractCookieValue(fullCookie);
    });

    it('revokes session and clears cookie', async () => {
        const logoutRes = await makeRequest('POST', '/api/auth/logout', {}, sessionCookie);
        assert.equal(logoutRes.status, 200);
        assert.equal(logoutRes.body.success, true);

        const meRes = await makeRequest('GET', '/api/player/me', undefined, sessionCookie);
        assert.equal(meRes.status, 401, 'session must be revoked after logout');
    });

    it('is idempotent (no cookie)', async () => {
        const res = await makeRequest('POST', '/api/auth/logout');
        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
    });
});

describe('Rate limiting (run last)', () => {
    it('enforces login rate limit after many attempts', async () => {
        const responses = [];
        for (let i = 0; i < 20; i++) {
            responses.push(await makeRequest('POST', '/api/auth/login', {
                username: 'RATELIMITUSER', password: 'wrong'
            }));
        }
        const rateLimited = responses.some(r => r.status === 429);
        assert.ok(rateLimited, 'should be rate limited after many login attempts');
    });
});
