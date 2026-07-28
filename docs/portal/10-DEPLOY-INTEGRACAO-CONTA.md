# Plano de Deploy e Contingência — Contas UPT

Este documento orienta os procedimentos de deploy seguro e instruções para rollback em caso de incidentes.

## 1. Procedimento de Deploy da API

Executar no PowerShell do administrador na VM:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\UPT\Services\deploy-upt-api.ps1"
```

## 2. Instruções de Rollback (Banco de Dados e Código)

### Código da API
1. Parar a tarefa agendada:
   ```powershell
   Stop-ScheduledTask -TaskName "UPT API Cadastro"
   ```
2. Mudar o junction `C:\UPT\API` para apontar para a pasta de backup anterior em `C:\UPT\Backups\API\`.
3. Iniciar a tarefa:
   ```powershell
   Start-ScheduledTask -TaskName "UPT API Cadastro"
   ```

### Banco de Dados
Para restaurar a estrutura de tabelas anterior à migração V1, execute o backup gerado em `C:\UPT\Backups\Database\`.
