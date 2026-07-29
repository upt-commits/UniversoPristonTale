import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';
import sql from 'mssql';

const envPath = process.argv[2];
const backupDirectory = process.argv[3];
if (!envPath || !backupDirectory) {
  throw new Error('Uso: node scripts/migrate-admin.mjs CAMINHO_ENV DIRETORIO_BACKUP');
}
dotenv.config({ path: envPath });

const database = process.env.SQL_DATABASE_PORTAL || 'UPTPortal';
if (!/^[A-Za-z0-9_]+$/.test(database)) throw new Error('Nome de banco inválido.');
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '_');
const backupPath = path.join(backupDirectory, `${database}_pre_admin_${stamp}.bak`);
await fs.mkdir(backupDirectory, { recursive: true });

const pool = await sql.connect({
  server: process.env.SQL_SERVER || '(local)',
  database,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  options: { encrypt: false, trustServerCertificate: true },
  requestTimeout: 120000,
});

try {
  await pool.request().input('path', sql.NVarChar, backupPath)
    .query(`BACKUP DATABASE [${database}] TO DISK=@path WITH COPY_ONLY, CHECKSUM, INIT`);
  await pool.request().input('path', sql.NVarChar, backupPath)
    .query('RESTORE VERIFYONLY FROM DISK=@path WITH CHECKSUM');

  const migration = await fs.readFile(new URL('../migrations/V3__Admin_Security.sql', import.meta.url), 'utf8');
  for (const batch of migration.split(/^\s*GO\s*$/gim).filter(Boolean)) await pool.request().batch(batch);

  const objects = await pool.request().query(`
    SELECT COUNT(*) AS total FROM sys.tables
    WHERE name IN ('AdminUsers','AdminSessions','AdminAuditLog')
  `);
  if (objects.recordset[0].total !== 3) throw new Error('Validação da migration falhou.');
  const stat = await fs.stat(backupPath);
  if (stat.size < 1024) throw new Error('Backup SQL com tamanho inválido.');
  console.log(JSON.stringify({ backupPath, backupBytes: stat.size, migration: 'V3__Admin_Security', validated: true }));
} finally {
  await pool.close();
}
