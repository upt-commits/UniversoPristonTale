import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database.module';
import { AuditModule } from './audit.module';
import { AgentController } from './agent.controller';
import { PlayersController } from './players.controller';
import { ItemsController } from './items.controller';
import { LogsController } from './logs.controller';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [AppController, AgentController, PlayersController, ItemsController, LogsController],
  providers: [AppService],
})
export class AppModule {}
