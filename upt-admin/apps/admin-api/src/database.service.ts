import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as mssql from 'mssql';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pools: Map<string, mssql.ConnectionPool> = new Map();

  async onModuleInit() {
    const dbs = [
      'UserDB', 'GameDB', 'ItemDB', 'SkillDBNew', 
      'ClanDB', 'EventDB', 'LogDB', 'ServerDB', 
      'ChatDB', 'UPTPortal'
    ];

    const baseConfig: mssql.config = {
      server: process.env.DB_SERVER || '127.0.0.1',
      port: Number(process.env.DB_PORT) || 1434,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
      pool: {
        max: 5,
        min: 0,
        idleTimeoutMillis: 15000,
      },
      connectionTimeout: 15000,
      requestTimeout: 15000
    };

    // Inicializacao sequencial com delay de 250ms para evitar sobrecarga de handshakes no SQL Server local da maquina dev
    for (const db of dbs) {
      const config = { ...baseConfig, database: db };
      try {
        const pool = new mssql.ConnectionPool(config);
        await pool.connect();
        this.pools.set(db, pool);
        console.log(`[SQL] Conectado com sucesso ao banco: ${db}`);
        await new Promise(resolve => setTimeout(resolve, 250));
      } catch (err) {
        console.error(`[SQL] Falha ao conectar ao banco ${db}:`, err.message);
      }
    }
  }

  getPool(dbName: string): mssql.ConnectionPool {
    const pool = this.pools.get(dbName);
    if (!pool) {
      throw new Error(`Instancia de conexao para o banco de dados ${dbName} nao inicializada.`);
    }
    return pool;
  }

  async onModuleDestroy() {
    for (const [name, pool] of this.pools.entries()) {
      await pool.close();
      console.log(`[SQL] Conexao encerrada com o banco: ${name}`);
    }
  }
}
