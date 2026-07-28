import crypto from 'crypto';

export function computeCPF_HMAC(cpf: string, keyHex: string): string {
    const rawCpf = cpf.replace(/\D/g, ''); // 11 digits only
    return crypto.createHmac('sha256', Buffer.from(keyHex, 'hex')).update(rawCpf).digest('hex');
}

export function encryptAES(text: string, keyHex: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(keyHex, 'hex'), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${tag}:${encrypted}`;
}

export function decryptAES(ciphertext: string, keyHex: string): string {
    const parts = ciphertext.split(':');
    if (parts.length !== 3) throw new Error('Cifra inválida');
    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = Buffer.from(parts[2], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(keyHex, 'hex'), iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

export function hashPasswordClientStyle(username: string, pass: string): string {
    const normUser = username.toUpperCase().trim();
    const input = `${normUser}:${pass}`;
    return crypto.createHash('sha256').update(input, 'utf8').digest('hex').toUpperCase();
}

export function validateCPF(cpf: string): boolean {
    const raw = cpf.replace(/\D/g, '');
    if (raw.length !== 11 || /^(\d)\1{10}$/.test(raw)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(raw[i]) * (10 - i);
    let check1 = 11 - (sum % 11);
    if (check1 >= 10) check1 = 0;
    if (parseInt(raw[9]) !== check1) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(raw[i]) * (11 - i);
    let check2 = 11 - (sum % 11);
    if (check2 >= 10) check2 = 0;
    return parseInt(raw[10]) === check2;
}

export function calculateAge(birthDateStr: string): number {
    const birthDate = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}
