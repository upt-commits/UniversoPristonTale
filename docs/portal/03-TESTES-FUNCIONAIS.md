# docs/portal/03-TESTES-FUNCIONAIS.md

Este documento detalha os testes funcionais realizados para garantir o funcionamento estável do Portal UPT.

---

## Matriz de Testes Executados

| ID | Rota | Pré-condição | Passos | Resultado Esperado | Resultado Obtido | PASS/FAIL |
|---|---|---|---|---|---|---|
| **T01** | `/` | Servidor rodando localmente | Acessar a home | Hero carregado, navegação visível. | Home carregada com sucesso. | **PASS** |
| **T02** | `/criar-conta` | Sem gateway configurado | Acessar o formulário | Exibir aviso de homologação, desabilitar inputs. | Inputs desabilitados e aviso exibido. | **PASS** |
| **T03** | `/entrar` | Sem gateway configurado | Tentar fazer login | Inputs de conta/senha desabilitados. | Bloqueado com sucesso. | **PASS** |
| **T04** | `/shop` | Nenhuma chave PIX configurada | Acessar UPT Shop | Mostrar catálogo visual e fluxo de compra estáticos. | Catálogo carregado sem checkouts ativos. | **PASS** |
| **T05** | `/rankings` | Sem integração de banco | Acessar Rankings | Exibir estado vazio padrão explicativo. | Estado vazio renderizado. | **PASS** |
| **T06** | `/status` | Ambiente de homologação | Acessar Status | Exibir a lista honesta de serviços UPT. | Serviços listados com status reais. | **PASS** |
| **T07** | `/download` | Sem binários finais | Acessar Downloads | Botão de download desabilitado. | Bloqueado corretamente. | **PASS** |

## Testes Automatizados via Node.js

Para executar a suite de testes locais:

```powershell
npm test
```

**Resultado**: 3 testes passados, 0 falhas.
