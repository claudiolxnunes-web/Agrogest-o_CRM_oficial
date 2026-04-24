#!/usr/bin/env node

/**
 * Script para elevar um usuário a admin
 * Uso: node scripts/make-admin.mjs <email>
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const email = process.argv[2];

if (!email) {
  console.error('❌ Erro: Email não fornecido');
  console.error('Uso: node scripts/make-admin.mjs <email>');
  process.exit(1);
}

async function makeAdmin() {
  try {
    console.log(`🔄 Conectando ao banco de dados...`);
    
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    console.log(`🔍 Procurando usuário: ${email}`);
    
    // Buscar usuário
    const [users] = await connection.execute(
      'SELECT id, name, email, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.error(`❌ Usuário não encontrado: ${email}`);
      await connection.end();
      process.exit(1);
    }

    const user = users[0];
    console.log(`✅ Usuário encontrado:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Nome: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role atual: ${user.role}`);

    if (user.role === 'admin') {
      console.log(`⚠️  Usuário já é admin!`);
      await connection.end();
      process.exit(0);
    }

    // Elevar a admin
    console.log(`\n🔄 Elevando para admin...`);
    
    const [result] = await connection.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      ['admin', user.id]
    );

    if (result.affectedRows > 0) {
      console.log(`✅ Sucesso! ${user.email} agora é admin`);
      console.log(`\n📝 Próximos passos:`);
      console.log(`   1. Faça logout e login novamente`);
      console.log(`   2. Acesse: https://seu-agrocrm.com/admin`);
      console.log(`   3. Você verá o painel de administração`);
    } else {
      console.error(`❌ Erro ao atualizar usuário`);
    }

    await connection.end();
  } catch (error) {
    console.error(`❌ Erro:`, error.message);
    process.exit(1);
  }
}

makeAdmin();
