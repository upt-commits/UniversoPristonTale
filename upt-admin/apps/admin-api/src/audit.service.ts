import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Injectable()
export class AuditService {
  constructor(private dbService: DatabaseService) {}

  async logAction(
    userId: number,
    username: string,
    action: string,
    target: string,
    details: string,
    ipAddress: string,
  ) {
    try {
      const pool = this.dbService.getPool('UPTPortal'); // Inicialmente usando UPTPortal para armazenar logs locais
      const request = pool.request();
      request.input('AccountID', userId);
      request.input('Event', `${action} on ${target}`);
      request.input('IPAddress', ipAddress);
      request.input('UserAgent', 'UPT Admin API');
      request.input('Details', details);

      await request.query(`
        INSERT INTO SecurityAuditLog (AccountID, Event, IPAddress, UserAgent, CreatedAt, Details)
        VALUES (@AccountID, @Event, @IPAddress, @UserAgent, GETDATE(), @Details)
      `);
      console.log(`[AUDIT] Ação registrada: ${action} por ${username}`);
    } catch (err) {
      console.error('[AUDIT] Erro ao gravar auditoria no banco:', err.message);
    }
  }
}
