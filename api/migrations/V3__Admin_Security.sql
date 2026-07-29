SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID('dbo.AdminUsers','U') IS NULL CREATE TABLE dbo.AdminUsers (
  ID int IDENTITY(1,1) PRIMARY KEY,
  Username varchar(64) NOT NULL UNIQUE,
  PasswordHash varchar(255) NOT NULL,
  Role varchar(32) NOT NULL CHECK (Role IN ('SUPER_ADMIN','ADMIN','GM','SUPORTE','FINANCEIRO','CONTEUDO','AUDITOR')),
  TotpSecretEncrypted varchar(512) NULL,
  MfaEnabled bit NOT NULL CONSTRAINT DF_AdminUsers_MfaEnabled DEFAULT 0,
  FailedAttempts int NOT NULL CONSTRAINT DF_AdminUsers_FailedAttempts DEFAULT 0,
  LockedUntil datetime2 NULL,
  Active bit NOT NULL CONSTRAINT DF_AdminUsers_Active DEFAULT 1,
  CreatedAt datetime2 NOT NULL CONSTRAINT DF_AdminUsers_CreatedAt DEFAULT SYSUTCDATETIME(),
  PasswordChangedAt datetime2 NOT NULL CONSTRAINT DF_AdminUsers_PasswordChangedAt DEFAULT SYSUTCDATETIME()
);

IF OBJECT_ID('dbo.AdminSessions','U') IS NULL CREATE TABLE dbo.AdminSessions (
  TokenHash char(64) PRIMARY KEY,
  AdminUserID int NOT NULL REFERENCES dbo.AdminUsers(ID),
  MfaVerified bit NOT NULL,
  CreatedAt datetime2 NOT NULL CONSTRAINT DF_AdminSessions_CreatedAt DEFAULT SYSUTCDATETIME(),
  LastSeenAt datetime2 NOT NULL CONSTRAINT DF_AdminSessions_LastSeenAt DEFAULT SYSUTCDATETIME(),
  ExpiresAt datetime2 NOT NULL,
  RevokedAt datetime2 NULL,
  IPAddress varchar(45) NOT NULL,
  UserAgent varchar(512) NOT NULL
);

IF OBJECT_ID('dbo.AdminAuditLog','U') IS NULL CREATE TABLE dbo.AdminAuditLog (
  ID bigint IDENTITY(1,1) PRIMARY KEY,
  AdminUserID int NULL,
  Action varchar(100) NOT NULL,
  Target varchar(200) NULL,
  BeforeState nvarchar(max) NULL,
  AfterState nvarchar(max) NULL,
  Result varchar(32) NOT NULL,
  IPAddress varchar(45) NOT NULL,
  CreatedAt datetime2 NOT NULL CONSTRAINT DF_AdminAuditLog_CreatedAt DEFAULT SYSUTCDATETIME()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_AdminSessions_User_Expiry' AND object_id=OBJECT_ID('dbo.AdminSessions'))
  CREATE INDEX IX_AdminSessions_User_Expiry ON dbo.AdminSessions(AdminUserID,ExpiresAt) INCLUDE(RevokedAt,MfaVerified);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_AdminAuditLog_Date' AND object_id=OBJECT_ID('dbo.AdminAuditLog'))
  CREATE INDEX IX_AdminAuditLog_Date ON dbo.AdminAuditLog(CreatedAt DESC);
COMMIT TRANSACTION;
