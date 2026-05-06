import { eq, and, desc, asc, gte, lte, like, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  representatives,
  clients,
  goals,
  opportunities,
  activities,
  alerts,
  salesHistory,
  aiInsights,
  type User,
  type Representative,
  type Client,
  type Goal,
  type Opportunity,
  type Activity,
  type Alert,
  type SalesHistory,
  type AIInsight,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USER QUERIES
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "phone", "region", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}


// ============================================================================
// REPRESENTATIVE QUERIES
// ============================================================================

export async function getRepresentativeByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(representatives).where(eq(representatives.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getRepresentativeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(representatives).where(eq(representatives.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getRepresentativesByRegion(region: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(representatives).where(eq(representatives.region, region));
}

export async function getAllRepresentatives() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(representatives).where(eq(representatives.isActive, true));
}

export async function createRepresentative(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(representatives).values(data);
  return result;
}

export async function updateRepresentative(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(representatives).set(data).where(eq(representatives.id, id));
}

// ============================================================================
// CLIENT QUERIES
// ============================================================================

export async function getClientById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getClientsByRepresentative(representativeId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(clients).where(
    and(eq(clients.representativeId, representativeId), eq(clients.isActive, true))
  );
}

export async function getClientsByType(type: 'farm' | 'factory') {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(clients).where(
    and(eq(clients.type, type), eq(clients.isActive, true))
  );
}

export async function getClientsByRegion(region: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(clients).where(
    and(eq(clients.region, region), eq(clients.isActive, true))
  );
}

export async function getAllClients() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(clients).where(eq(clients.isActive, true));
}

export async function createClient(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(clients).values(data);
  return result;
}

export async function updateClient(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(clients).set(data).where(eq(clients.id, id));
}

// ============================================================================
// GOAL QUERIES
// ============================================================================

export async function getGoalsByRepresentative(representativeId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(goals).where(eq(goals.representativeId, representativeId));
}

export async function getGoalByPeriod(representativeId: number, period: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(goals).where(
    and(eq(goals.representativeId, representativeId), eq(goals.period, period))
  ).limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function createGoal(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(goals).values(data);
}

export async function updateGoal(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(goals).set(data).where(eq(goals.id, id));
}

// ============================================================================
// OPPORTUNITY QUERIES
// ============================================================================

export async function getOpportunityById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(opportunities).where(eq(opportunities.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOpportunitiesByClient(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(opportunities).where(eq(opportunities.clientId, clientId));
}

export async function getOpportunitiesByRepresentative(representativeId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(opportunities).where(eq(opportunities.representativeId, representativeId));
}

export async function getOpportunitiesByStage(stage: 'prospecting' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost') {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(opportunities).where(eq(opportunities.stage, stage));
}

export async function getAllOpportunities() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(opportunities).orderBy(desc(opportunities.createdAt));
}

export async function createOpportunity(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(opportunities).values(data);
}

export async function updateOpportunity(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(opportunities).set(data).where(eq(opportunities.id, id));
}

// ============================================================================
// ACTIVITY QUERIES
// ============================================================================

export async function getActivitiesByOpportunity(opportunityId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(activities).where(eq(activities.opportunityId, opportunityId));
}

export async function getActivitiesByClient(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(activities).where(eq(activities.clientId, clientId));
}

export async function getActivitiesByRepresentative(representativeId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(activities).where(eq(activities.representativeId, representativeId));
}

export async function createActivity(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(activities).values(data);
}

// ============================================================================
// ALERT QUERIES
// ============================================================================

export async function getAlertsByUser(userId: number, unreadOnly: boolean = false) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions: any[] = [eq(alerts.userId, userId)];
  if (unreadOnly) {
    conditions.push(eq(alerts.isRead, false));
  }
  
  return await db.select().from(alerts).where(and(...conditions)).orderBy(desc(alerts.createdAt));
}

export async function createAlert(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(alerts).values(data);
}

export async function updateAlert(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(alerts).set(data).where(eq(alerts.id, id));
}

// ============================================================================
// SALES HISTORY QUERIES
// ============================================================================

export async function getSalesHistoryByRepresentative(representativeId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(salesHistory).where(eq(salesHistory.representativeId, representativeId));
}

export async function getSalesHistoryByClient(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(salesHistory).where(eq(salesHistory.clientId, clientId));
}

export async function createSalesHistory(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(salesHistory).values(data);
}

// ============================================================================
// AI INSIGHTS QUERIES
// ============================================================================

export async function getAIInsightsByRepresentative(representativeId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(aiInsights).where(eq(aiInsights.representativeId, representativeId));
}

export async function getAIInsightsByOpportunity(opportunityId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(aiInsights).where(eq(aiInsights.opportunityId, opportunityId));
}

export async function createAIInsight(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(aiInsights).values(data);
}

// ============================================================================
// ORDER QUERIES
// ============================================================================

import { orders, importLogs, clientDuplicates } from "../drizzle/schema";

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orders).orderBy(desc(orders.issueDate));
}

export async function getOrdersByClient(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orders).where(eq(orders.clientId, clientId)).orderBy(desc(orders.issueDate));
}

export async function getOrdersByRepresentative(representativeId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orders).where(eq(orders.representativeId, representativeId)).orderBy(desc(orders.issueDate));
}

export async function createOrder(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(orders).values(data);
}

export async function updateOrder(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(orders).set(data).where(eq(orders.id, id));
}

// ============================================================================
// IMPORT LOG QUERIES
// ============================================================================

export async function getAllImportLogs() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(importLogs).orderBy(desc(importLogs.createdAt));
}

// ============================================================================
// DUPLICATE QUERIES
// ============================================================================

export async function getClientDuplicates() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(clientDuplicates).where(eq(clientDuplicates.isResolved, false));
}

export async function resolveDuplicate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(clientDuplicates).set({ 
    isResolved: true, 
    resolvedAt: new Date() 
  }).where(eq(clientDuplicates.id, id));
}
