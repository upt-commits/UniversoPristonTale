import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { PermissionsGuard } from './permissions.guard';
import { RequirePermissions } from './permissions.decorator';
import { ADMIN_PERMISSIONS } from './auth.interface';

@Controller('api/v1/items')
@UseGuards(PermissionsGuard)
export class ItemsController {
  constructor(private dbService: DatabaseService) {}

  @Get('warehouse/:userid')
  @RequirePermissions(ADMIN_PERMISSIONS.DATABASE_READ)
  async getWarehouseItems(@Param('userid') userid: string) {
    const pool = this.dbService.getPool('ItemDB');
    const request = pool.request();
    request.input('userid', userid);

    // Consulta do armazem/bau do jogador no ItemDB
    const result = await request.query(`
      SELECT TOP 100 
        ItemName, Quantity, Level, Chk1, Chk2, StorageType
      FROM Warehouse
      WHERE AccountName = @userid
    `);
    return result.recordset;
  }
}
