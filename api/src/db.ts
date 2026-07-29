import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const configPortal: sql.config = {
    server: process.env.SQL_SERVER || '(local)',
    database: process.env.SQL_DATABASE_PORTAL || 'UPTPortal',
    options: {
        encrypt: false,
        trustServerCertificate: true
    },
    user: process.env.SQL_USER || '',
    password: process.env.SQL_PASSWORD || ''
};

const configGame: sql.config = {
    server: process.env.SQL_SERVER || '(local)',
    database: process.env.SQL_DATABASE_GAME || 'UserDB',
    options: {
        encrypt: false,
        trustServerCertificate: true
    },
    user: process.env.SQL_USER || '',
    password: process.env.SQL_PASSWORD || ''
};

const configClan: sql.config = {
    server: process.env.SQL_SERVER || '(local)',
    database: process.env.SQL_DATABASE_CLAN || 'ClanDB',
    options: {
        encrypt: false,
        trustServerCertificate: true
    },
    user: process.env.SQL_USER || '',
    password: process.env.SQL_PASSWORD || ''
};

let portalPool: sql.ConnectionPool | null = null;
let gamePool: sql.ConnectionPool | null = null;
let clanPool: sql.ConnectionPool | null = null;

export async function getPortalConnection(): Promise<sql.ConnectionPool> {
    if (portalPool && portalPool.connected) return portalPool;
    portalPool = new sql.ConnectionPool(configPortal);
    await portalPool.connect();
    return portalPool;
}

export async function getGameConnection(): Promise<sql.ConnectionPool> {
    if (gamePool && gamePool.connected) return gamePool;
    gamePool = new sql.ConnectionPool(configGame);
    await gamePool.connect();
    return gamePool;
}

export async function getClanConnection(): Promise<sql.ConnectionPool> {
    if (clanPool && clanPool.connected) return clanPool;
    clanPool = new sql.ConnectionPool(configClan);
    await clanPool.connect();
    return clanPool;
}
