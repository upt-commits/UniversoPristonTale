import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('api/v1/agent')
export class AgentController {
  constructor(private auditService: AuditService) {}

  @Post('heartbeat')
  @HttpCode(HttpStatus.OK)
  async handleHeartbeat(
    @Body() payload: { AgentId: string; Status: string; Timestamp: string },
  ) {
    console.log(`[AGENT] Heartbeat recebido do Agente: ${payload.AgentId} - Status: ${payload.Status}`);
    
    // Opcional: registrar evento de heartbeat na auditoria
    await this.auditService.logAction(
      0,
      'SYSTEM',
      'HEARTBEAT',
      payload.AgentId,
      `Heartbeat periodico recebido. Status: ${payload.Status}`,
      '127.0.0.1',
    );

    return {
      status: 'success',
      receivedAt: new Date().toISOString(),
    };
  }
}
