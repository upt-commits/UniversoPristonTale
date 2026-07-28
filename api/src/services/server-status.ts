import net from 'net';
import sql from 'mssql';
import { config } from '../config';
import { getPortalConnection, getGameConnection } from '../db';

interface ServiceStatus {
    status: 'online' | 'offline' | 'unknown';
    latencyMs: number | null;
}

interface ServerStatus {
    status: 'online' | 'offline' | 'maintenance' | 'unknown';
    maintenance: boolean;
    maintenanceInfo?: {
        title: string | null;
        message: string | null;
        startedAt: string | null;
        expectedEndAt: string | null;
    };
    players: {
        online: number | null;
        capacity: number | null;
    };
    services: {
        loginServer: ServiceStatus;
        gameServer: ServiceStatus;
    };
    updatedAt: string;
    stale: boolean;
}

let cachedStatus: ServerStatus | null = null;
let lastUpdate: number = 0;

export async function getServerStatus(): Promise<ServerStatus> {
    const now = Date.now();
    if (cachedStatus && (now - lastUpdate) < config.status.cacheTtlSeconds * 1000) {
        const stale = (now - lastUpdate) > config.status.staleThresholdSeconds * 1000;
        return { ...cachedStatus, stale };
    }

    try {
        const status = await fetchServerStatus();
        cachedStatus = status;
        lastUpdate = now;
        return status;
    } catch (err: any) {
        console.error('[STATUS-ERROR]:', err.message);
        if (cachedStatus) {
            return { ...cachedStatus, stale: true };
        }
        return getUnknownStatus();
    }
}

async function fetchServerStatus(): Promise<ServerStatus> {
    const maintenance = await checkMaintenance();
    if (maintenance.active) {
        return {
            status: 'maintenance',
            maintenance: true,
            maintenanceInfo: {
                title: maintenance.title,
                message: maintenance.message,
                startedAt: maintenance.startedAt,
                expectedEndAt: maintenance.expectedEndAt,
            },
            players: { online: null, capacity: config.status.maxCapacity || null },
            services: {
                loginServer: { status: 'unknown', latencyMs: null },
                gameServer: { status: 'unknown', latencyMs: null },
            },
            updatedAt: new Date().toISOString(),
            stale: false,
        };
    }

    const [loginStatus, gameStatus, playersOnline] = await Promise.all([
        checkTcpService(config.status.loginServerHost, config.status.loginServerPort),
        checkTcpService(config.status.gameServerHost, config.status.gameServerPort),
        getPlayersOnline(),
    ]);

    const bothOnline = loginStatus.status === 'online' && gameStatus.status === 'online';
    const anyOffline = loginStatus.status === 'offline' || gameStatus.status === 'offline';

    let overallStatus: 'online' | 'offline' | 'unknown' = 'unknown';
    if (bothOnline) overallStatus = 'online';
    else if (anyOffline) overallStatus = 'offline';

    return {
        status: overallStatus,
        maintenance: false,
        players: {
            online: playersOnline,
            capacity: config.status.maxCapacity || null,
        },
        services: {
            loginServer: loginStatus,
            gameServer: gameStatus,
        },
        updatedAt: new Date().toISOString(),
        stale: false,
    };
}

function checkTcpService(host: string, port: number): Promise<ServiceStatus> {
    return new Promise((resolve) => {
        if (!host || !port) {
            resolve({ status: 'unknown', latencyMs: null });
            return;
        }

        const start = Date.now();
        const socket = new net.Socket();

        const timeout = setTimeout(() => {
            socket.destroy();
            resolve({ status: 'offline', latencyMs: null });
        }, 3000);

        socket.connect(port, host, () => {
            clearTimeout(timeout);
            const latency = Date.now() - start;
            socket.destroy();
            resolve({ status: 'online', latencyMs: latency });
        });

        socket.on('error', () => {
            clearTimeout(timeout);
            socket.destroy();
            resolve({ status: 'offline', latencyMs: null });
        });
    });
}

async function getPlayersOnline(): Promise<number | null> {
    try {
        const pool = await getGameConnection();
        const result = await pool.request()
            .query('SELECT COUNT(*) as cnt FROM CharacterInfo WHERE IsOnline = 1');
        return result.recordset[0].cnt;
    } catch {
        return null;
    }
}

async function checkMaintenance(): Promise<{
    active: boolean;
    title: string | null;
    message: string | null;
    startedAt: string | null;
    expectedEndAt: string | null;
}> {
    try {
        const pool = await getPortalConnection();
        const result = await pool.request()
            .query('SELECT TOP 1 Active, Title, Message, StartedAt, ExpectedEndAt FROM ServerMaintenance WHERE Active = 1 ORDER BY CreatedAt DESC');

        if (result.recordset.length === 0) {
            return { active: false, title: null, message: null, startedAt: null, expectedEndAt: null };
        }

        const row = result.recordset[0];
        return {
            active: !!row.Active,
            title: row.Title,
            message: row.Message,
            startedAt: row.StartedAt?.toISOString() || null,
            expectedEndAt: row.ExpectedEndAt?.toISOString() || null,
        };
    } catch {
        return { active: false, title: null, message: null, startedAt: null, expectedEndAt: null };
    }
}

function getUnknownStatus(): ServerStatus {
    return {
        status: 'unknown',
        maintenance: false,
        players: { online: null, capacity: null },
        services: {
            loginServer: { status: 'unknown', latencyMs: null },
            gameServer: { status: 'unknown', latencyMs: null },
        },
        updatedAt: new Date().toISOString(),
        stale: true,
    };
}
