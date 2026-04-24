# 🗑️ Funcionalidade de Limpeza de Banco de Dados

## Descrição

O AgroCRM agora possui uma funcionalidade de **limpeza completa da base de dados** com confirmação em **2 etapas** de segurança. Esta funcionalidade foi desenvolvida para permitir que administradores limpem toda a base de dados quando necessário (por exemplo, para testes, reset de ambiente, etc.).

---

## ⚠️ Aviso Importante

**ESTA OPERAÇÃO É IRREVERSÍVEL!**

- ❌ Não há backup automático
- ❌ Não há undo/desfazer
- ❌ Todos os dados serão deletados permanentemente
- ✅ Apenas usuários com role "admin" podem acessar
- ✅ Requer confirmação em 2 etapas

---

## 🔐 Segurança - Confirmação em 2 Etapas

### Etapa 1: Confirmação Inicial
1. Clique no botão "Limpar Base de Dados"
2. Leia o aviso de segurança
3. Clique em "Continuar"
4. Sistema carrega estatísticas do banco

### Etapa 2: Confirmação Final
1. Revise os dados que serão deletados
2. Digite **"LIMPAR_TUDO"** para confirmar
3. Clique em "Limpar Base de Dados"
4. Sistema executa a limpeza
5. Página é recarregada automaticamente

---

## 📍 Como Acessar

### Via URL Direta
```
https://seu-agrocrm.com/admin
```

### Via Menu (se implementado)
Painel de Administração → Banco de Dados → Limpar Base de Dados

---

## 🛠️ Arquivos Implementados

### Backend
- **`server/databaseCleaner.ts`** (NOVO)
  - Função `clearAllDatabaseData()` - Limpa todas as tabelas
  - Função `getDatabaseStats()` - Obtém estatísticas do banco
  - Ordem correta de deleção (respeita foreign keys)

- **`server/routers.ts`** (MODIFICADO)
  - Novo router `admin` com endpoints:
    - `admin.getDatabaseStats` - Query para obter estatísticas
    - `admin.clearDatabase` - Mutation para limpar banco

### Frontend
- **`client/src/components/ClearDatabaseDialog.tsx`** (NOVO)
  - Componente de diálogo com 2 etapas
  - Validação de confirmação
  - Exibição de estatísticas

- **`client/src/pages/AdminPanel.tsx`** (NOVO)
  - Página de administração
  - Visualização de estatísticas
  - Botão para limpeza de banco
  - Verificação de permissão (apenas admin)

- **`client/src/App.tsx`** (MODIFICADO)
  - Rotas `/admin` e `/demo/admin` adicionadas

---

## 📊 Dados Deletados

Quando você clica em "Limpar Base de Dados", os seguintes dados são deletados:

| Tabela | Descrição |
|--------|-----------|
| `salesItems` | Itens de vendas |
| `aiInsights` | Insights gerados por IA |
| `alerts` | Alertas do sistema |
| `activities` | Atividades registradas |
| `opportunities` | Oportunidades de venda |
| `goals` | Metas de vendas |
| `salesHistory` | Histórico de vendas |
| `clients` | Clientes cadastrados |
| `representatives` | Representantes |
| `products` | Produtos |

**NÃO SÃO DELETADOS:**
- ✅ `users` - Dados de autenticação são preservados

---

## 🔄 Fluxo de Execução

```
┌─────────────────────────────────┐
│   Usuário clica no botão        │
│  "Limpar Base de Dados"         │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   ETAPA 1: Confirmação Inicial  │
│  - Lê aviso de segurança        │
│  - Clica em "Continuar"         │
│  - Sistema carrega stats        │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   ETAPA 2: Confirmação Final    │
│  - Revisa dados a deletar       │
│  - Digita "LIMPAR_TUDO"         │
│  - Clica em "Limpar"            │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   Backend executa:              │
│  1. Valida token de confirmação │
│  2. Deleta tabelas em ordem     │
│  3. Retorna resultado           │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   Sucesso!                      │
│  - Exibe mensagem de sucesso    │
│  - Recarrega página em 2s       │
└─────────────────────────────────┘
```

---

## 🔒 Validações de Segurança

### 1. Verificação de Permissão
```typescript
if (ctx.user?.role !== 'admin') {
  throw new TRPCError({ code: 'FORBIDDEN' });
}
```

### 2. Token de Confirmação
```typescript
if (input.confirmationToken !== 'CONFIRM_CLEAR_ALL_DATA') {
  throw new TRPCError({
    code: 'BAD_REQUEST',
    message: 'Token de confirmacao invalido',
  });
}
```

### 3. Confirmação Textual
```
Digite "LIMPAR_TUDO" para confirmar
```

### 4. Logging
```
[ADMIN] Usuario admin@example.com esta limpando a base de dados
```

---

## 📈 Estatísticas Exibidas

Antes de confirmar, você verá:

- 👥 Número de clientes
- 👤 Número de representantes
- 💰 Número de vendas
- 📦 Número de produtos
- 🎯 Número de oportunidades
- 📋 Número de metas
- ✅ Número de atividades
- 🔔 Número de alertas
- 🤖 Número de insights de IA
- **📊 Total de registros**

---

## ⚡ Ordem de Deleção

A ordem de deleção é importante para respeitar as constraints de foreign key:

1. `salesItems` (depende de salesHistory e products)
2. `aiInsights` (pode referenciar várias tabelas)
3. `alerts` (depende de users)
4. `activities` (depende de opportunities, clients, representatives)
5. `opportunities` (depende de clients, representatives)
6. `goals` (depende de representatives)
7. `salesHistory` (depende de representatives, clients, products)
8. `clients` (depende de representatives)
9. `representatives` (depende de users)
10. `products` (sem dependências)

---

## 🧪 Testes Recomendados

### Teste 1: Verificar Acesso
```
1. Faça login com usuário não-admin
2. Tente acessar /admin
3. Deve exibir "Acesso Negado"
```

### Teste 2: Confirmação Dupla
```
1. Faça login como admin
2. Acesse /admin
3. Clique em "Limpar Base de Dados"
4. Na etapa 2, tente digitar texto errado
5. Botão deve ficar desabilitado
6. Digite "LIMPAR_TUDO"
7. Botão deve ficar habilitado
```

### Teste 3: Limpeza Completa
```
1. Faça login como admin
2. Acesse /admin
3. Note as estatísticas (ex: 100 clientes)
4. Clique em "Limpar Base de Dados"
5. Confirme em ambas as etapas
6. Aguarde recarregamento
7. Verifique que estatísticas agora mostram 0
```

---

## 🐛 Troubleshooting

### Problema: "Acesso Negado"
**Causa:** Seu usuário não tem role "admin"  
**Solução:** Peça ao administrador para elevar suas permissões

### Problema: "Token de confirmação inválido"
**Causa:** O token enviado não é válido  
**Solução:** Verifique se o backend está respondendo corretamente

### Problema: "Erro ao carregar estatísticas"
**Causa:** Problema de conexão com banco de dados  
**Solução:** Verifique se o banco está online e acessível

### Problema: Página não recarrega após limpeza
**Causa:** Erro no recarregamento automático  
**Solução:** Recarregue manualmente (F5 ou Ctrl+R)

---

## 📝 Logs

As operações de limpeza são registradas no console do servidor:

```
[ADMIN] Usuario admin@example.com esta limpando a base de dados
```

---

## 🔄 Recuperação

Se você acidentalmente limpou o banco:

1. **Restaurar do backup** (se disponível)
2. **Recriar dados manualmente** via importação de Excel
3. **Contatar suporte** do Manus

---

## 📞 Suporte

Para dúvidas ou problemas:
- Acesse https://help.manus.im
- Consulte a documentação técnica
- Entre em contato com o administrador do sistema

---

**Versão:** 1.0.0  
**Data:** 24 de Abril de 2026  
**Desenvolvido por:** Manus AI Agent
