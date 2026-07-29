export interface AuthUser {
  id: number;
  username: string;
  role: string;
  permissions: string[];
}

export const ADMIN_PERMISSIONS = {
  SERVER_CONTROL: 'server:control',
  DATABASE_READ: 'database:read',
  DATABASE_WRITE: 'database:write',
  AUDIT_VIEW: 'audit:view',
  ITEM_SPAWN: 'item:spawn',
  COIN_MANAGE: 'coin:manage',
  ACCOUNTS_MANAGE: 'accounts:manage',
};
