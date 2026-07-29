import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { PermissionsGuard } from './permissions.guard';
import { RequirePermissions } from './permissions.decorator';
import { ADMIN_PERMISSIONS } from './auth.interface';

@Controller('api/v1/logs')
@UseGuards(PermissionsGuard)
export class LogsController {
  constructor(private dbService: DatabaseService) {}

  @Get('chat')
  @RequirePermissions(ADMIN_PERMISSIONS.AUDIT_VIEW)
  async getChatLogs(@Query('search') search?: string) {
    const pool = this.dbService.getPool('ChatDB');
    const request = pool.request();
    let query = `
      SELECT TOP 200 
        Sender, Receiver, Message, ChatType, Date as Timestamp
      FROM PublicChat
    `;

    if (search) {
      request.input('search', `%${search}%`);
      query += ` WHERE Sender LIKE @search OR Message LIKE @search`;
    }

    query += ` ORDER BY Date DESC`;
    const result = await request.query(query);
    return result.recordset;
  }
}
