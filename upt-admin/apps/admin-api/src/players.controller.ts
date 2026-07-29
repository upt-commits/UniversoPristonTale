import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { PermissionsGuard } from './permissions.guard';
import { RequirePermissions } from './permissions.decorator';
import { ADMIN_PERMISSIONS } from './auth.interface';

@Controller('api/v1/players')
@UseGuards(PermissionsGuard)
export class PlayersController {
  constructor(private dbService: DatabaseService) {}

  @Get()
  @RequirePermissions(ADMIN_PERMISSIONS.DATABASE_READ)
  async getPlayers(@Query('search') search?: string) {
    const pool = this.dbService.getPool('UserDB');
    const request = pool.request();
    // Colunas reais mapeadas do schema de desenvolvimento do UserInfo do Priston Tale UPT:
    // ID (PK), AccountName, Email, RegisDay (Data), BanStatus
    let query = `
      SELECT TOP 100 
        ID, AccountName, Email, RegisDay as CreatedAt,
        CASE WHEN BanStatus > 0 THEN 1 ELSE 0 END as IsBanned
      FROM UserInfo
    `;

    if (search) {
      request.input('search', `%${search}%`);
      query += ` WHERE AccountName LIKE @search OR Email LIKE @search`;
    }

    query += ` ORDER BY RegisDay DESC`;
    const result = await request.query(query);
    return result.recordset;
  }

  @Get(':userid/characters')
  @RequirePermissions(ADMIN_PERMISSIONS.DATABASE_READ)
  async getPlayerCharacters(@Param('userid') userid: string) {
    const pool = this.dbService.getPool('GameDB');
    const request = pool.request();
    request.input('userid', userid);

    // Consulta na tabela CharInfo mapeada no GameDB associado ao AccountName
    const result = await request.query(`
      SELECT 
        Name, JobCode, Level, Experience, MapNum, X, Z
      FROM CharInfo
      WHERE AccountName = @userid
    `);
    return result.recordset;
  }
}
