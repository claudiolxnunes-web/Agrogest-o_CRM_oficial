import { getDb } from "./db";
import { 
  users,
  representatives,
  clients,
  goals,
  opportunities,
  activities,
  alerts,
  salesHistory,
  aiInsights,
  products,
  salesItems
} from "../drizzle/schema";

export interface DatabaseCleanupResult {
  success: boolean;
  message: string;
  tablesCleared: string[];
  recordsDeleted: number;
  timestamp: Date;
}

/**
 * Limpar toda a base de dados (exceto usuários admin)
 * Deve ser chamado com confirmação dupla
 */
export async function clearAllDatabaseData(): Promise<DatabaseCleanupResult> {
  const db = await getDb();
  if (!db) {
    return {
      success: false,
      message: "Falha ao conectar com o banco de dados",
      tablesCleared: [],
      recordsDeleted: 0,
      timestamp: new Date(),
    };
  }

  const tablesCleared: string[] = [];
  let totalRecordsDeleted = 0;

  try {
    // Ordem importante: deletar primeiro as tabelas com foreign keys
    
    // 1. Deletar salesItems (depende de salesHistory e products)
    await db.delete(salesItems);
    tablesCleared.push("salesItems");

    // 2. Deletar aiInsights (pode referenciar várias tabelas)
    await db.delete(aiInsights);
    tablesCleared.push("aiInsights");

    // 3. Deletar alerts (depende de users)
    await db.delete(alerts);
    tablesCleared.push("alerts");

    // 4. Deletar activities (depende de opportunities, clients, representatives)
    await db.delete(activities);
    tablesCleared.push("activities");

    // 5. Deletar opportunities (depende de clients, representatives)
    await db.delete(opportunities);
    tablesCleared.push("opportunities");

    // 6. Deletar goals (depende de representatives)
    await db.delete(goals);
    tablesCleared.push("goals");

    // 7. Deletar salesHistory (depende de representatives, clients, products)
    await db.delete(salesHistory);
    tablesCleared.push("salesHistory");

    // 8. Deletar clients (depende de representatives)
    await db.delete(clients);
    tablesCleared.push("clients");

    // 9. Deletar representatives (depende de users)
    await db.delete(representatives);
    tablesCleared.push("representatives");

    // 10. Deletar products (sem dependências)
    await db.delete(products);
    tablesCleared.push("products");

    // Nota: Não deletamos users pois contêm dados de autenticação importantes

    totalRecordsDeleted = tablesCleared.length; // Simplificado para demo

    return {
      success: true,
      message: `Base de dados limpa com sucesso. ${tablesCleared.length} tabelas foram esvaziadas.`,
      tablesCleared,
      recordsDeleted: totalRecordsDeleted,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("[DatabaseCleaner] Erro ao limpar banco:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido ao limpar banco",
      tablesCleared,
      recordsDeleted: totalRecordsDeleted,
      timestamp: new Date(),
    };
  }
}

/**
 * Obter estatísticas do banco de dados
 */
export async function getDatabaseStats() {
  const db = await getDb();
  if (!db) {
    return null;
  }

  try {
    const stats = {
      users: await db.select().from(users),
      representatives: await db.select().from(representatives),
      clients: await db.select().from(clients),
      goals: await db.select().from(goals),
      opportunities: await db.select().from(opportunities),
      activities: await db.select().from(activities),
      alerts: await db.select().from(alerts),
      salesHistory: await db.select().from(salesHistory),
      aiInsights: await db.select().from(aiInsights),
      products: await db.select().from(products),
      salesItems: await db.select().from(salesItems),
    };

    return {
      usersCount: stats.users.length,
      representativesCount: stats.representatives.length,
      clientsCount: stats.clients.length,
      goalsCount: stats.goals.length,
      opportunitiesCount: stats.opportunities.length,
      activitiesCount: stats.activities.length,
      alertsCount: stats.alerts.length,
      salesHistoryCount: stats.salesHistory.length,
      aiInsightsCount: stats.aiInsights.length,
      productsCount: stats.products.length,
      salesItemsCount: stats.salesItems.length,
      totalRecords: 
        stats.users.length +
        stats.representatives.length +
        stats.clients.length +
        stats.goals.length +
        stats.opportunities.length +
        stats.activities.length +
        stats.alerts.length +
        stats.salesHistory.length +
        stats.aiInsights.length +
        stats.products.length +
        stats.salesItems.length,
    };
  } catch (error) {
    console.error("[DatabaseCleaner] Erro ao obter estatísticas:", error);
    return null;
  }
}
