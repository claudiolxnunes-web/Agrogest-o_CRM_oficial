import { 
  int, 
  mysqlEnum, 
  mysqlTable, 
  text, 
  timestamp, 
  varchar,
  decimal,
  date,
  boolean,
  datetime,
  index
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with role-based access control for CRM.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "gerente_regional", "representante"]).default("representante").notNull(),
  region: varchar("region", { length: 100 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => ({
  roleIdx: index("role_idx").on(table.role),
  regionIdx: index("region_idx").on(table.region),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Representatives - Representantes comerciais
 */
export const representatives = mysqlTable("representatives", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  territory: varchar("territory", { length: 255 }),
  region: varchar("region", { length: 100 }).notNull(),
  performanceScore: decimal("performanceScore", { precision: 5, scale: 2 }).default("0"),
  totalSales: decimal("totalSales", { precision: 15, scale: 2 }).default("0"),
  activeClients: int("activeClients").default(0),
  targetAnnualSales: decimal("targetAnnualSales", { precision: 15, scale: 2 }),
  hireDate: date("hireDate"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  regionIdx: index("rep_region_idx").on(table.region),
  userIdIdx: index("rep_userId_idx").on(table.userId),
}));

export type Representative = typeof representatives.$inferSelect;
export type InsertRepresentative = typeof representatives.$inferInsert;

/**
 * Clients - Clientes (Fazendas de ruminantes e Fábricas de ração)
 */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["farm", "factory"]).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zipCode", { length: 10 }),
  cnpj: varchar("cnpj", { length: 20 }),
  cpf: varchar("cpf", { length: 14 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  region: varchar("region", { length: 100 }).notNull(),
  representativeId: int("representativeId").notNull(),
  annualBudget: decimal("annualBudget", { precision: 15, scale: 2 }),
  businessPotentialScore: decimal("businessPotentialScore", { precision: 5, scale: 2 }).default("0"),
  lastPurchaseDate: date("lastPurchaseDate"),
  totalPurchases: decimal("totalPurchases", { precision: 15, scale: 2 }).default("0"),
  numberOfAnimals: int("numberOfAnimals"),
  contactPerson: varchar("contactPerson", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  representativeIdIdx: index("client_rep_idx").on(table.representativeId),
  typeIdx: index("client_type_idx").on(table.type),
  regionIdx: index("client_region_idx").on(table.region),
}));

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Goals - Metas comerciais
 */
export const goals = mysqlTable("goals", {
  id: int("id").autoincrement().primaryKey(),
  representativeId: int("representativeId").notNull(),
  period: varchar("period", { length: 50 }).notNull(), // "2024-01", "Q1-2024", "2024"
  targetAmount: decimal("targetAmount", { precision: 15, scale: 2 }).notNull(),
  currentAmount: decimal("currentAmount", { precision: 15, scale: 2 }).default("0"),
  status: mysqlEnum("status", ["not_started", "in_progress", "at_risk", "completed", "exceeded"]).default("not_started").notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  representativeIdIdx: index("goal_rep_idx").on(table.representativeId),
  periodIdx: index("goal_period_idx").on(table.period),
}));

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = typeof goals.$inferInsert;

/**
 * Opportunities - Oportunidades de negócio
 */
export const opportunities = mysqlTable("opportunities", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  representativeId: int("representativeId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  value: decimal("value", { precision: 15, scale: 2 }).notNull(),
  probability: decimal("probability", { precision: 5, scale: 2 }).default("50"), // 0-100
  stage: mysqlEnum("stage", ["prospecting", "qualified", "proposal", "negotiation", "won", "lost"]).default("prospecting").notNull(),
  expectedCloseDate: date("expectedCloseDate"),
  actualCloseDate: date("actualCloseDate"),
  lostReason: text("lostReason"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  clientIdIdx: index("opp_client_idx").on(table.clientId),
  representativeIdIdx: index("opp_rep_idx").on(table.representativeId),
  stageIdx: index("opp_stage_idx").on(table.stage),
}));

export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = typeof opportunities.$inferInsert;

/**
 * Activities - Atividades e interações com clientes
 */
export const activities = mysqlTable("activities", {
  id: int("id").autoincrement().primaryKey(),
  opportunityId: int("opportunityId"),
  clientId: int("clientId").notNull(),
  representativeId: int("representativeId").notNull(),
  type: mysqlEnum("type", ["visit", "call", "email", "proposal", "meeting", "follow_up"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  activityDate: datetime("activityDate").notNull(),
  result: text("result"),
  nextAction: text("nextAction"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  opportunityIdIdx: index("activity_opp_idx").on(table.opportunityId),
  clientIdIdx: index("activity_client_idx").on(table.clientId),
  representativeIdIdx: index("activity_rep_idx").on(table.representativeId),
  typeIdx: index("activity_type_idx").on(table.type),
}));

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;

/**
 * Alerts - Alertas e notificações
 */
export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["goal_at_risk", "high_value_opportunity", "milestone_reached", "activity_reminder", "system"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  relatedEntityId: int("relatedEntityId"),
  relatedEntityType: varchar("relatedEntityType", { length: 50 }), // "opportunity", "goal", "representative"
  isRead: boolean("isRead").default(false).notNull(),
  emailSent: boolean("emailSent").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("alert_user_idx").on(table.userId),
  typeIdx: index("alert_type_idx").on(table.type),
}));

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

/**
 * SalesHistory - Histórico de vendas para análise
 */
export const salesHistory = mysqlTable("salesHistory", {
  id: int("id").autoincrement().primaryKey(),
  representativeId: int("representativeId").notNull(),
  clientId: int("clientId").notNull(),
  opportunityId: int("opportunityId"),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  saleDate: date("saleDate").notNull(),
  productCategory: varchar("productCategory", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  representativeIdIdx: index("sales_rep_idx").on(table.representativeId),
  clientIdIdx: index("sales_client_idx").on(table.clientId),
  saleDateIdx: index("sales_date_idx").on(table.saleDate),
}));

export type SalesHistory = typeof salesHistory.$inferSelect;
export type InsertSalesHistory = typeof salesHistory.$inferInsert;

/**
 * AIInsights - Insights gerados por IA
 */
export const aiInsights = mysqlTable("aiInsights", {
  id: int("id").autoincrement().primaryKey(),
  representativeId: int("representativeId"),
  opportunityId: int("opportunityId"),
  clientId: int("clientId"),
  insightType: mysqlEnum("insightType", ["next_action", "closure_probability", "pattern_analysis", "recommendation"]).notNull(),
  content: text("content").notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }), // 0-100
  actionable: boolean("actionable").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  representativeIdIdx: index("ai_rep_idx").on(table.representativeId),
  opportunityIdIdx: index("ai_opp_idx").on(table.opportunityId),
  clientIdIdx: index("ai_client_idx").on(table.clientId),
}));

export type AIInsight = typeof aiInsights.$inferSelect;
export type InsertAIInsight = typeof aiInsights.$inferInsert;

/**
 * Products - Produtos/Serviços
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 15, scale: 2 }),
  unit: varchar("unit", { length: 50 }), // kg, l, un, etc
  supplier: varchar("supplier", { length: 255 }),
  sku: varchar("sku", { length: 100 }).unique(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  categoryIdx: index("product_category_idx").on(table.category),
  skuIdx: index("product_sku_idx").on(table.sku),
}));

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * SalesItems - Itens de venda (relaciona vendas com produtos)
 */
export const salesItems = mysqlTable("salesItems", {
  id: int("id").autoincrement().primaryKey(),
  salesHistoryId: int("salesHistoryId").notNull(),
  productId: int("productId").notNull(),
  quantity: decimal("quantity", { precision: 15, scale: 4 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 15, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  salesHistoryIdIdx: index("salesItems_salesHistory_idx").on(table.salesHistoryId),
  productIdIdx: index("salesItems_product_idx").on(table.productId),
}));

export type SalesItem = typeof salesItems.$inferSelect;
export type InsertSalesItem = typeof salesItems.$inferInsert;

/**
 * Orders - Pedidos em carteira
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  clientId: int("clientId").notNull(),
  representativeId: int("representativeId").notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  quantity: decimal("quantity", { precision: 15, scale: 4 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 15, scale: 2 }).notNull(),
  totalValue: decimal("totalValue", { precision: 15, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pendente", "em_producao", "faturado", "entregue", "cancelado"]).default("pendente").notNull(),
  issueDate: date("issueDate").notNull(),
  expectedDeliveryDate: date("expectedDeliveryDate"),
  actualDeliveryDate: date("actualDeliveryDate"),
  importLogId: int("importLogId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  clientIdIdx: index("order_client_idx").on(table.clientId),
  representativeIdIdx: index("order_rep_idx").on(table.representativeId),
  statusIdx: index("order_status_idx").on(table.status),
  orderNumberIdx: index("order_number_idx").on(table.orderNumber),
}));

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * ImportLogs - Histórico de importações
 */
export const importLogs = mysqlTable("importLogs", {
  id: int("id").autoincrement().primaryKey(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  importType: mysqlEnum("importType", ["clients", "orders"]).notNull(),
  totalRows: int("totalRows").notNull(),
  processedRows: int("processedRows").default(0),
  successRows: int("successRows").default(0),
  errorRows: int("errorRows").default(0),
  duplicateRows: int("duplicateRows").default(0),
  status: mysqlEnum("status", ["processing", "completed", "failed"]).default("processing").notNull(),
  errorMessage: text("errorMessage"),
  performedBy: int("performedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("import_status_idx").on(table.status),
  typeIdx: index("import_type_idx").on(table.importType),
}));

export type ImportLog = typeof importLogs.$inferSelect;
export type InsertImportLog = typeof importLogs.$inferInsert;

/**
 * ClientDuplicates - Registro de consolidação de duplicados
 */
export const clientDuplicates = mysqlTable("clientDuplicates", {
  id: int("id").autoincrement().primaryKey(),
  originalClientId: int("originalClientId").notNull(),
  duplicateClientId: int("duplicateClientId").notNull(),
  matchType: mysqlEnum("matchType", ["cnpj", "phone", "fuzzy_name"]).notNull(),
  confidenceScore: decimal("confidenceScore", { precision: 5, scale: 2 }),
  isResolved: boolean("isResolved").default(false).notNull(),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  originalClientIdx: index("dup_original_idx").on(table.originalClientId),
  duplicateClientIdx: index("dup_duplicate_idx").on(table.duplicateClientId),
}));

export type ClientDuplicate = typeof clientDuplicates.$inferSelect;
export type InsertClientDuplicate = typeof clientDuplicates.$inferInsert;
