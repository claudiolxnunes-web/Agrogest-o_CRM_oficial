#!/usr/bin/env node

import { drizzle } from "drizzle-orm/mysql2/http";
import { eq } from "drizzle-orm";
import * as schema from "../drizzle/schema.js";

/**
 * Script para estabelecer claudiolx.nunes@gmail.com como SUPERADMIN
 * 
 * Uso: node scripts/setup-superadmin.mjs
 */

const db = drizzle(
  fetch,
  {
    schema,
    connection: {
      url: process.env.DATABASE_URL,
    },
  }
);

async function setupSuperAdmin() {
  try {
    console.log("🔧 Configurando SUPERADMIN...\n");

    const email = "claudiolx.nunes@gmail.com";

    // 1. Procurar o usuário
    console.log(`📍 Procurando usuário: ${email}`);
    const user = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (user.length === 0) {
      console.log("❌ Usuário não encontrado!");
      console.log(`\n💡 Dica: O usuário ${email} precisa fazer login primeiro.`);
      console.log("   Após fazer login, execute este script novamente.\n");
      process.exit(1);
    }

    const foundUser = user[0];
    console.log(`✅ Usuário encontrado!`);
    console.log(`   ID: ${foundUser.id}`);
    console.log(`   Nome: ${foundUser.name}`);
    console.log(`   Email: ${foundUser.email}`);
    console.log(`   Role atual: ${foundUser.role}\n`);

    // 2. Atualizar para admin
    console.log("🔐 Elevando para SUPERADMIN...");
    await db
      .update(schema.users)
      .set({
        role: "admin",
        isActive: true,
      })
      .where(eq(schema.users.id, foundUser.id));

    console.log("✅ Usuário elevado para SUPERADMIN!\n");

    // 3. Verificar atualização
    const updatedUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, foundUser.id))
      .limit(1);

    const updated = updatedUser[0];
    console.log("📋 Confirmação:");
    console.log(`   Email: ${updated.email}`);
    console.log(`   Role: ${updated.role}`);
    console.log(`   Ativo: ${updated.isActive}\n`);

    console.log("✨ SUPERADMIN configurado com sucesso!\n");
    console.log("🎯 Permissões do SUPERADMIN:");
    console.log("   ✅ Criar/Editar/Deletar clientes");
    console.log("   ✅ Criar/Editar/Deletar vendas");
    console.log("   ✅ Criar/Editar/Deletar produtos");
    console.log("   ✅ Criar/Editar/Deletar metas");
    console.log("   ✅ Acessar painel de administração");
    console.log("   ✅ Limpar base de dados");
    console.log("   ✅ Gerenciar usuários");
    console.log("   ✅ Visualizar logs e estatísticas\n");

    console.log("🚀 Próximos passos:");
    console.log(`   1. Faça login com: ${email}`);
    console.log("   2. Acesse: http://localhost:3000/admin");
    console.log("   3. Você terá acesso total ao sistema!\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao configurar SUPERADMIN:");
    console.error(error);
    process.exit(1);
  }
}

setupSuperAdmin();
