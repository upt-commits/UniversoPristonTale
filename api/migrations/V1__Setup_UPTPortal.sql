-- Migration V1: Criação da estrutura de tabelas para o portal Universo Priston Tale (UPT)

USE UPTPortal;

-- 1. Documentos Jurídicos Versionados
CREATE TABLE LegalDocuments (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Type VARCHAR(50) NOT NULL, -- 'terms-of-use', 'privacy-notice', 'game-license', 'community-rules', 'game-rating-notice', 'guardian-consent'
    Version VARCHAR(20) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    HashSHA256 VARCHAR(64) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    Active BIT DEFAULT 1
);

-- 2. Contas de Jogadores do Portal
CREATE TABLE PlayerAccounts (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    UserInfoID INT NULL, -- Vínculo com UserDB.dbo.UserInfo (sem FK para cruzar bancos de forma segura)
    AccountName VARCHAR(32) NOT NULL UNIQUE,
    Email VARCHAR(150) NOT NULL UNIQUE,
    EmailVerified BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    Active BIT DEFAULT 1,
    IsMinor BIT DEFAULT 0
);

-- 3. Perfis Detalhados (Dados Pessoais Protegidos por AES-256)
CREATE TABLE PlayerProfiles (
    AccountID INT PRIMARY KEY FOREIGN KEY REFERENCES PlayerAccounts(ID),
    FullName VARCHAR(255) NOT NULL,
    BirthDate DATE NOT NULL,
    CPF_HMAC VARCHAR(64) NOT NULL UNIQUE, -- CPF hashing para conferir duplicidade sem descriptografar
    CPF_Encrypted VARCHAR(512) NOT NULL,  -- CPF criptografado com AES-256-GCM
    CEP VARCHAR(8) NOT NULL,
    Logradouro VARCHAR(255) NOT NULL,
    Numero VARCHAR(50) NOT NULL,
    Complemento VARCHAR(255) NULL,
    Bairro VARCHAR(150) NOT NULL,
    Cidade VARCHAR(150) NOT NULL,
    Estado CHAR(2) NOT NULL
);

-- 4. Termos Aceitos
CREATE TABLE LegalAcceptances (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    AccountID INT NOT NULL FOREIGN KEY REFERENCES PlayerAccounts(ID),
    DocumentID INT NOT NULL FOREIGN KEY REFERENCES LegalDocuments(ID),
    AcceptedAtUtc DATETIME NOT NULL,
    IPAddress VARCHAR(45) NOT NULL,
    UserAgent VARCHAR(512) NOT NULL,
    Method VARCHAR(50) NOT NULL, -- 'web-form', 'launcher'
    LegalGuardianName VARCHAR(255) NULL, -- Se menor de 12 anos
    LegalGuardianCPF VARCHAR(255) NULL
);

-- 5. Consentimento de Responsável
CREATE TABLE GuardianConsents (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    MinorAccountID INT NOT NULL FOREIGN KEY REFERENCES PlayerAccounts(ID),
    GuardianName VARCHAR(255) NOT NULL,
    GuardianEmail VARCHAR(150) NOT NULL,
    GuardianCPF_Encrypted VARCHAR(512) NOT NULL,
    ConsentGivenAt DATETIME DEFAULT GETDATE(),
    IPAddress VARCHAR(45) NOT NULL
);

-- 6. Tokens de Verificação de E-mail
CREATE TABLE EmailVerificationTokens (
    TokenHash VARCHAR(64) PRIMARY KEY,
    AccountID INT NOT NULL FOREIGN KEY REFERENCES PlayerAccounts(ID),
    Email VARCHAR(150) NOT NULL,
    ExpiresAt DATETIME NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- 7. Tokens de Recuperação de Senha
CREATE TABLE PasswordResetTokens (
    TokenHash VARCHAR(64) PRIMARY KEY,
    AccountID INT NOT NULL FOREIGN KEY REFERENCES PlayerAccounts(ID),
    ExpiresAt DATETIME NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- 8. Sessões Ativas do Painel (Sessão Opaca)
CREATE TABLE PlayerSessions (
    TokenHash VARCHAR(64) PRIMARY KEY, -- Hash SHA-256 do token opaco
    AccountID INT NOT NULL FOREIGN KEY REFERENCES PlayerAccounts(ID),
    CreatedAt DATETIME DEFAULT GETDATE(),
    ExpiresAt DATETIME NOT NULL,
    IPAddress VARCHAR(45) NOT NULL,
    UserAgent VARCHAR(512) NOT NULL
);

-- 9. Trilha de Auditoria de Segurança
CREATE TABLE SecurityAuditLog (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    AccountID INT NULL,
    Event VARCHAR(100) NOT NULL, -- 'REGISTER_PENDING', 'EMAIL_VERIFIED', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'PASSWORD_RESET'
    IPAddress VARCHAR(45) NOT NULL,
    UserAgent VARCHAR(512) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    Details NVARCHAR(1000) NULL
);
