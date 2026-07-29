import readline from 'readline';
import bcrypt from 'bcrypt';
import sql from 'mssql';
import { getPortalConnection } from './db';

async function readHidden(prompt: string): Promise<string> {
  if (!process.stdin.isTTY || !process.stdin.setRawMode) {
    throw new Error('O bootstrap exige um terminal interativo local.');
  }
  process.stdout.write(prompt);
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();

  return new Promise((resolve, reject) => {
    let value = '';
    const finish = (error?: Error) => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener('keypress', onKeypress);
      process.stdout.write('\n');
      if (error) reject(error); else resolve(value);
    };
    const onKeypress = (character: string, key: readline.Key) => {
      if (key.ctrl && key.name === 'c') return finish(new Error('Bootstrap cancelado.'));
      if (key.name === 'return') return finish();
      if (key.name === 'backspace') value = value.slice(0, -1);
      else if (!key.ctrl && !key.meta && character) value += character;
    };
    process.stdin.on('keypress', onKeypress);
  });
}

async function main() {
  const username = process.argv[2];
  if (!username || !/^[A-Za-z0-9_.-]{4,64}$/.test(username)) {
    throw new Error('Uso: npm run bootstrap:admin -- NOME');
  }

  const portal = await getPortalConnection();
  const count = await portal.request().query('SELECT COUNT(*) AS total FROM AdminUsers');
  if (count.recordset[0].total > 0) {
    throw new Error('Bootstrap bloqueado: já existe administrador.');
  }

  const password = await readHidden('Senha inicial: ');
  const confirmation = await readHidden('Confirme a senha: ');
  if (password !== confirmation) throw new Error('As senhas não coincidem.');
  if (password.length < 12) throw new Error('A senha deve ter pelo menos 12 caracteres.');

  const passwordHash = await bcrypt.hash(password, 12);
  await portal.request()
    .input('username', sql.VarChar, username)
    .input('passwordHash', sql.VarChar, passwordHash)
    .query("INSERT AdminUsers(Username,PasswordHash,Role) VALUES(@username,@passwordHash,'SUPER_ADMIN')");
  await portal.request()
    .input('action', sql.VarChar, 'ADMIN_BOOTSTRAP')
    .input('target', sql.VarChar, username)
    .input('result', sql.VarChar, 'SUCCESS')
    .input('ip', sql.VarChar, '127.0.0.1')
    .query('INSERT AdminAuditLog(Action,Target,Result,IPAddress) VALUES(@action,@target,@result,@ip)');
  console.log('Administrador criado. MFA será obrigatório no primeiro acesso.');
}

main().then(() => process.exit(0)).catch((error: Error) => {
  console.error(error.message);
  process.exit(1);
});
