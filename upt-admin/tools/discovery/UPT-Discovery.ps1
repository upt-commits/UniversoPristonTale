# UPT-Discovery - Diagnóstico e Descoberta de Ambiente Priston Tale UPT
Param(
    [string]$OutputPath = "upt-discovery-result.json",
    [string]$ServerRootDir = "D:\Priston Tale UPT de volta"
)

Write-Host "============================================="
Write-Host "   UPT DISCOVERY - DIAGNOSTICO DE AMBIENTE   "
Write-Host "============================================="

$Report = @{
    Timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    OS = [System.Environment]::OSVersion.VersionString
    MachineName = [System.Environment]::MachineName
    GameServerPaths = @{}
    Processes = @()
    Databases = @()
}

$PathsToCheck = @{
    "GameServer" = "$ServerRootDir\bin\GameServer"
    "LoginServer" = "$ServerRootDir\bin\LoginServer"
    "ServerSource" = "$ServerRootDir\PristonTale-EU-main-master"
    "Backups" = "$ServerRootDir\_BACKUPS_UPT"
}

foreach ($Key in $PathsToCheck.Keys) {
    $Path = $PathsToCheck[$Key]
    $Exists = Test-Path $Path
    $Report.GameServerPaths[$Key] = @{
        Path = $Path
        Exists = $Exists
    }
    if ($Exists) {
        Write-Host "[PATH] Encontrado $Key em $Path"
    } else {
        Write-Host "[PATH] Nao encontrado: $Key em $Path"
    }
}

$ProcessesToFind = @("Server", "GameServer", "LoginServer", "UPTServerManager")
foreach ($ProcName in $ProcessesToFind) {
    $Procs = Get-Process -Name $ProcName -ErrorAction SilentlyContinue
    foreach ($P in $Procs) {
        $Report.Processes += @{
            Name = $P.Name
            Id = $P.Id
            Path = $P.Path
            Cpu = $P.CPU
            WorkingSet = $P.WorkingSet
        }
        Write-Host "[PROCESS] Servidor ativo detectado: $($P.Name) (PID: $($P.Id))"
    }
}

Write-Host "[SQL] Verificando conexoes de banco de dados locais..."
$DBsToTest = @("UserDB", "GameDB", "ItemDB", "SkillDBNew", "ClanDB", "EventDB", "LogDB", "ServerDB", "ChatDB", "UPTPortal")
$ConnectionString = "Server=(local);Database=master;Trusted_Connection=True;TrustServerCertificate=True;Timeout=5"

try {
    $Connection = New-Object System.Data.SqlClient.SqlConnection
    $Connection.ConnectionString = $ConnectionString
    $Connection.Open()
    
    $Command = $Connection.CreateCommand()
    $Command.CommandText = "SELECT name, state_desc FROM sys.databases WHERE name IN ('" + ($DBsToTest -join "','") + "')"
    $Reader = $Command.ExecuteReader()
    
    while ($Reader.Read()) {
        $DbName = $Reader.GetValue(0)
        $DbState = $Reader.GetValue(1)
        $Report.Databases += @{
            Name = $DbName
            State = $DbState
            Online = ($DbState -eq "ONLINE")
        }
        Write-Host "[SQL] Banco de dados detectado: $DbName ($DbState)"
    }
    $Reader.Close()
    $Connection.Close()
}
catch {
    Write-Host "[SQL] Erro de conexao local com SQL Server: $_"
}

$Report | ConvertTo-Json -Depth 5 | Out-File -FilePath $OutputPath -Encoding UTF8
Write-Host "============================================="
Write-Host "Descoberta completa. Resultado salvo em $OutputPath"
Write-Host "============================================="
