-- Migration V2: OTP, CSRF, ClassDef, indexes, and security hardening
-- Applies to: UPTPortal and UserDB
-- Prerequisite: V1__Setup_UPTPortal.sql applied
-- Rollback: see docs/portal/17-TRANSACAO-CADASTRO.md

-- ============================================================
-- 1. ClassDef population (UserDB)
-- ============================================================
USE UserDB;

IF NOT EXISTS (SELECT 1 FROM ClassDef WHERE ClassID = 0)
    INSERT INTO ClassDef (ClassID, ClassName) VALUES (0, 'Fighter');
IF NOT EXISTS (SELECT 1 FROM ClassDef WHERE ClassID = 1)
    INSERT INTO ClassDef (ClassID, ClassName) VALUES (1, 'Mechanician');
IF NOT EXISTS (SELECT 1 FROM ClassDef WHERE ClassID = 2)
    INSERT INTO ClassDef (ClassID, ClassName) VALUES (2, 'Archer');
IF NOT EXISTS (SELECT 1 FROM ClassDef WHERE ClassID = 3)
    INSERT INTO ClassDef (ClassID, ClassName) VALUES (3, 'Pikeman');
IF NOT EXISTS (SELECT 1 FROM ClassDef WHERE ClassID = 4)
    INSERT INTO ClassDef (ClassID, ClassName) VALUES (4, 'Atalanta');
IF NOT EXISTS (SELECT 1 FROM ClassDef WHERE ClassID = 5)
    INSERT INTO ClassDef (ClassID, ClassName) VALUES (5, 'Knight');
IF NOT EXISTS (SELECT 1 FROM ClassDef WHERE ClassID = 6)
    INSERT INTO ClassDef (ClassID, ClassName) VALUES (6, 'Magician');
IF NOT EXISTS (SELECT 1 FROM ClassDef WHERE ClassID = 7)
    INSERT INTO ClassDef (ClassID, ClassName) VALUES (7, 'Priestess');
IF NOT EXISTS (SELECT 1 FROM ClassDef WHERE ClassID = 8)
    INSERT INTO ClassDef (ClassID, ClassName) VALUES (8, 'Assassin');
IF NOT EXISTS (SELECT 1 FROM ClassDef WHERE ClassID = 9)
    INSERT INTO ClassDef (ClassID, ClassName) VALUES (9, 'Shaman');

GO

-- ============================================================
-- 2. OTP table for email verification (UPTPortal)
-- ============================================================
USE UPTPortal;

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'EmailVerificationOTP')
BEGIN
    CREATE TABLE EmailVerificationOTP (
        ID INT IDENTITY(1,1) PRIMARY KEY,
        AccountID INT NOT NULL FOREIGN KEY REFERENCES PlayerAccounts(ID),
        OTPHash VARCHAR(128) NOT NULL,
        Email VARCHAR(150) NOT NULL,
        CreatedAt DATETIME NOT NULL DEFAULT GETUTCDATE(),
        ExpiresAt DATETIME NOT NULL,
        UsedAt DATETIME NULL,
        Attempts INT NOT NULL DEFAULT 0,
        MaxAttempts INT NOT NULL DEFAULT 5,
        IPAddress VARCHAR(45) NOT NULL,
        UserAgent VARCHAR(512) NOT NULL
    );
END
GO

-- Index for fast lookups by AccountID and active OTPs
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_EmailVerificationOTP_AccountID')
    CREATE INDEX IX_EmailVerificationOTP_AccountID ON EmailVerificationOTP (AccountID, ExpiresAt);
GO

-- Index for cleanup of expired OTPs
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_EmailVerificationOTP_ExpiresAt')
    CREATE INDEX IX_EmailVerificationOTP_ExpiresAt ON EmailVerificationOTP (ExpiresAt) WHERE UsedAt IS NULL;
GO

-- ============================================================
-- 3. OTP resend tracking
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'OTPResendLog')
BEGIN
    CREATE TABLE OTPResendLog (
        ID INT IDENTITY(1,1) PRIMARY KEY,
        AccountID INT NOT NULL FOREIGN KEY REFERENCES PlayerAccounts(ID),
        SentAt DATETIME NOT NULL DEFAULT GETUTCDATE(),
        IPAddress VARCHAR(45) NOT NULL
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_OTPResendLog_AccountID')
    CREATE INDEX IX_OTPResendLog_AccountID ON OTPResendLog (AccountID, SentAt);
GO

-- ============================================================
-- 4. CSRF token support via sessions
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'PlayerSessions' AND COLUMN_NAME = 'CSRFTokenHash')
    ALTER TABLE PlayerSessions ADD CSRFTokenHash VARCHAR(64) NULL;
GO

-- ============================================================
-- 5. Maintenance mode configuration
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ServerMaintenance')
BEGIN
    CREATE TABLE ServerMaintenance (
        ID INT IDENTITY(1,1) PRIMARY KEY,
        Active BIT NOT NULL DEFAULT 0,
        Title NVARCHAR(200) NULL,
        Message NVARCHAR(1000) NULL,
        StartedAt DATETIME NULL,
        ExpectedEndAt DATETIME NULL,
        CreatedBy VARCHAR(100) NOT NULL,
        CreatedAt DATETIME NOT NULL DEFAULT GETUTCDATE()
    );
END
GO

-- ============================================================
-- 6. Server status cache
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ServerStatusCache')
BEGIN
    CREATE TABLE ServerStatusCache (
        ID INT PRIMARY KEY DEFAULT 1,
        StatusJSON NVARCHAR(MAX) NOT NULL,
        UpdatedAt DATETIME NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT CK_ServerStatusCache_SingleRow CHECK (ID = 1)
    );
END
GO

-- ============================================================
-- 7. Additional indexes for performance
-- ============================================================

-- PlayerAccounts: faster lookups by AccountName and Email
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_PlayerAccounts_AccountName')
    CREATE INDEX IX_PlayerAccounts_AccountName ON PlayerAccounts (AccountName);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_PlayerAccounts_Email')
    CREATE INDEX IX_PlayerAccounts_Email ON PlayerAccounts (Email);
GO

-- PlayerSessions: faster lookup by AccountID
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_PlayerSessions_AccountID')
    CREATE INDEX IX_PlayerSessions_AccountID ON PlayerSessions (AccountID, ExpiresAt);
GO

-- SecurityAuditLog: faster lookup by AccountID and Event
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SecurityAuditLog_AccountID')
    CREATE INDEX IX_SecurityAuditLog_AccountID ON SecurityAuditLog (AccountID, CreatedAt);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SecurityAuditLog_Event')
    CREATE INDEX IX_SecurityAuditLog_Event ON SecurityAuditLog (Event, CreatedAt);
GO

-- EmailVerificationTokens: index by AccountID
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_EmailVerificationTokens_AccountID')
    CREATE INDEX IX_EmailVerificationTokens_AccountID ON EmailVerificationTokens (AccountID);
GO

-- LegalAcceptances: index by AccountID
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_LegalAcceptances_AccountID')
    CREATE INDEX IX_LegalAcceptances_AccountID ON LegalAcceptances (AccountID);
GO

PRINT 'V2 migration completed successfully.';
GO
