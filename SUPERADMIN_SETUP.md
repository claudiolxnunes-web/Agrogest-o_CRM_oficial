# 🔐 SUPERADMIN - Guia de Configuração

## O que é SUPERADMIN?

**SUPERADMIN** é um usuário com permissões totais no AgroCRM. Pode:
- ✅ Criar, editar e deletar qualquer coisa
- ✅ Acessar painel de administração
- ✅ Limpar base de dados
- ✅ Gerenciar usuários
- ✅ Visualizar logs e estatísticas
- ✅ Fazer tudo que quiser no sistema

---

## 🎯 Configurar SUPERADMIN

### Pré-requisito
O usuário **DEVE ter feito login pelo menos uma vez** no sistema.

### Passo 1: Fazer Login
1. Acesse: `http://localhost:3000`
2. Faça login com: `claudiolx.nunes@gmail.com`
3. Confirme que conseguiu entrar

### Passo 2: Executar Script
```bash
cd agro_crm_fixed
node scripts/setup-superadmin.mjs
```

### Passo 3: Confirmar
```
✅ Usuário encontrado!
✅ Usuário elevado para SUPERADMIN!
✨ SUPERADMIN configurado com sucesso!
```

### Passo 4: Fazer Logout e Login Novamente
1. Faça logout
2. Faça login novamente com `claudiolx.nunes@gmail.com`
3. Agora você tem acesso total!

---

## 🔓 Permissões do SUPERADMIN

### Acesso Completo

| Funcionalidade | Permissão |
|---|---|
| Visualizar Clientes | ✅ |
| Criar Clientes | ✅ |
| Editar Clientes | ✅ |
| Deletar Clientes | ✅ |
| Visualizar Vendas | ✅ |
| Criar Vendas | ✅ |
| Editar Vendas | ✅ |
| Deletar Vendas | ✅ |
| Visualizar Produtos | ✅ |
| Criar Produtos | ✅ |
| Editar Produtos | ✅ |
| Deletar Produtos | ✅ |
| Visualizar Metas | ✅ |
| Criar Metas | ✅ |
| Editar Metas | ✅ |
| Deletar Metas | ✅ |
| Acessar Admin Panel | ✅ |
| Limpar Base de Dados | ✅ |
| Gerenciar Usuários | ✅ |
| Visualizar Logs | ✅ |
| Visualizar Estatísticas | ✅ |

---

## 🛡️ Segurança

### O SUPERADMIN Pode:
- ✅ Criar e recriar dados
- ✅ Liberar e fechar acesso
- ✅ Limpar base de dados completamente
- ✅ Fazer qualquer operação no sistema

### O SUPERADMIN NÃO Pode:
- ❌ Deletar a própria conta
- ❌ Acessar dados de outros usuários (sem permissão)
- ❌ Modificar código do sistema

---

## 📍 Onde Usar SUPERADMIN

### 1. Painel de Administração
```
URL: http://localhost:3000/admin
Abas: Banco de Dados | Sistema | Logs
```

### 2. Limpar Base de Dados
```
Aba: Banco de Dados
Seção: Operações Destrutivas
Botão: 🗑️ Limpar Base de Dados
```

### 3. Importar Dados
```
URL: http://localhost:3000/importacao
Tipos: Clientes | Vendas | Produtos | Metas
```

### 4. Gerenciar Dados
```
URL: http://localhost:3000/database (via Management UI)
Operações: Criar | Editar | Deletar
```

---

## 🔄 Fluxo Típico do SUPERADMIN

### 1. Limpar Base (Se Necessário)
```
Admin Panel → Banco de Dados → Limpar Base de Dados
Confirmar 2 vezes
Pronto! Base limpa
```

### 2. Importar Dados
```
Menu → Importar Dados
Selecionar arquivo Excel
Sistema reconhece automaticamente
Clicar em "Importar"
```

### 3. Visualizar Dados
```
Menu → Clientes / Vendas / Produtos / Metas
Ver todos os dados importados
```

### 4. Fazer Ajustes
```
Editar dados conforme necessário
Criar novos registros
Deletar registros inválidos
```

---

## 🚨 Operações Destrutivas

### ⚠️ Limpar Base de Dados

**O que faz:**
- Deleta TODOS os dados (exceto usuários)
- Não pode ser desfeito
- Requer confirmação dupla

**Como usar:**
1. Admin Panel → Banco de Dados
2. Scroll para baixo até "Operações Destrutivas"
3. Clique em "🗑️ Limpar Base de Dados"
4. Etapa 1: Leia o aviso e clique "Continuar"
5. Etapa 2: Digite "LIMPAR_TUDO" e clique "Limpar Base de Dados"

**Resultado:**
- Todos os clientes deletados
- Todas as vendas deletadas
- Todos os produtos deletados
- Todas as metas deletadas
- Usuários mantidos

---

## 📊 Estatísticas do SUPERADMIN

No Admin Panel, você vê:
- 📊 Número de clientes
- 📊 Número de representantes
- 📊 Número de vendas
- 📊 Número de produtos
- 📊 Número de oportunidades
- 📊 Número de metas
- 📊 Número de atividades
- 📊 Número de alertas
- 📊 Total de registros

---

## 🆘 Troubleshooting

### Problema: Script diz "Usuário não encontrado"
**Solução:**
1. Faça login com `claudiolx.nunes@gmail.com` primeiro
2. Depois execute o script

### Problema: Permissões não aparecem
**Solução:**
1. Faça logout
2. Faça login novamente
3. Atualize a página (F5)

### Problema: Botão de limpar não aparece
**Solução:**
1. Certifique-se que é SUPERADMIN
2. Acesse: `http://localhost:3000/admin`
3. Clique na aba "Banco de Dados"
4. Role para baixo

---

## 📋 Checklist de Configuração

- [ ] Usuário `claudiolx.nunes@gmail.com` criado
- [ ] Usuário fez login pelo menos uma vez
- [ ] Script `setup-superadmin.mjs` executado
- [ ] Logout e login novamente
- [ ] Acessou `/admin` com sucesso
- [ ] Viu o botão "Limpar Base de Dados"
- [ ] Testou importação de dados
- [ ] Sistema funcionando 100%

---

## 🎯 Resumo

| Item | Status |
|------|--------|
| Email | claudiolx.nunes@gmail.com |
| Role | admin (SUPERADMIN) |
| Permissões | Totais |
| Acesso Admin | ✅ |
| Limpar Base | ✅ |
| Importar Dados | ✅ |
| Gerenciar Tudo | ✅ |

---

**Versão:** 1.0.0  
**Data:** 24 de Abril de 2026  
**Status:** ✅ Pronto para Usar
