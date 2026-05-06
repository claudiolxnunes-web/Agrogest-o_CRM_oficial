import { getDb } from "./db";
import { clients, representatives, opportunities, salesHistory, products, salesItems, orders, importLogs, clientDuplicates } from "../drizzle/schema";
import { eq, or, and } from "drizzle-orm";
import { recognizeExcelHeaders, findFuzzyMatch, type HeaderRecognitionResult } from "./headerRecognition";

export interface ImportResult {
  success: boolean;
  message: string;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  errors: Array<{ row: number; error: string }>;
  importId: string;
}

export interface ExcelClientData {
  name: string;
  type: "farm" | "factory";
  contactName?: string;
  email?: string;
  phone?: string;
  cnpj?: string;
  cpf?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  businessPotential?: number;
  representativeId?: number;
}

export interface ExcelOrderData {
  orderNumber: string;
  clientName: string;
  representativeName: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  status?: "pendente" | "em_producao" | "faturado" | "entregue" | "cancelado";
  issueDate: string;
  expectedDeliveryDate?: string;
}

export interface ExcelSalesData {
  clientName: string;
  representativeName: string;
  amount: number;
  product?: string;
  quantity?: number;
  saleDate: string;
  productCategory?: string;
  notes?: string;
}

export interface ExcelProductData {
  name: string;
  category: string;
  description?: string;
  price?: number;
  unit?: string;
  supplier?: string;
  sku?: string;
}

export async function importClientsFromExcel(
  data: ExcelClientData[],
  userId: number
): Promise<ImportResult> {
  const db = await getDb();
  if (!db) {
    return {
      success: false,
      message: "Database connection failed",
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      errors: [],
      importId: `import_${Date.now()}`,
    };
  }

  const importId = `import_${Date.now()}_clients`;
  const errors: Array<{ row: number; error: string }> = [];
  let created = 0;
  let updated = 0;

  // Carregar representantes para fuzzy matching
  const allReps = await db.select().from(representatives);
  const repNames = allReps.map(r => r.name);

  for (let i = 0; i < data.length; i++) {
    try {
      const row = i + 2; // Excel row number (1-indexed, +1 for header)
      const clientData = data[i];

      // Validate required fields
      if (!clientData.name || !clientData.type) {
        errors.push({
          row,
          error: "Nome e tipo são obrigatórios",
        });
        continue;
      }

      // Check if client already exists (Smart Deduplication)
      let existing: any[] = [];
      let matchType: "cnpj" | "phone" | "fuzzy_name" | null = null;
      let confidenceScore = 1.0;

      // 1. Try CNPJ match (strongest)
      if (clientData.cnpj) {
        existing = await db.select().from(clients).where(eq(clients.cnpj, clientData.cnpj)).limit(1);
        if (existing.length > 0) matchType = "cnpj";
      }

      // 2. Try CPF match
      if (existing.length === 0 && clientData.cpf) {
        existing = await db.select().from(clients).where(eq(clients.cpf, clientData.cpf)).limit(1);
        if (existing.length > 0) matchType = "cnpj"; // using cnpj as generic doc match type
      }

      // 3. Try Phone match
      if (existing.length === 0 && clientData.phone) {
        existing = await db.select().from(clients).where(eq(clients.phone, clientData.phone)).limit(1);
        if (existing.length > 0) matchType = "phone";
      }

      // 4. Try Exact Name match
      if (existing.length === 0) {
        existing = await db.select().from(clients).where(eq(clients.name, clientData.name)).limit(1);
        if (existing.length > 0) matchType = "fuzzy_name";
      }

      // 5. Try Fuzzy Name match
      if (existing.length === 0) {
        const allClientNames = await db.select({ name: clients.name }).from(clients);
        const fuzzyClient = findFuzzyMatch(clientData.name, allClientNames.map(c => c.name), 0.85);
        if (fuzzyClient.match) {
          existing = await db.select().from(clients).where(eq(clients.name, fuzzyClient.match)).limit(1);
          matchType = "fuzzy_name";
          confidenceScore = fuzzyClient.score;
        }
      }

      // Resolver representante
      let representativeId = clientData.representativeId || 1;
      if (!representativeId && clientData.contactName) {
        const fuzzyRep = findFuzzyMatch(clientData.contactName, repNames, 0.75);
        if (fuzzyRep.match) {
          const rep = allReps.find(r => r.name === fuzzyRep.match);
          if (rep) representativeId = rep.id;
        }
      }

      if (existing.length > 0) {
        // Update existing client
        await db
          .update(clients)
          .set({
            email: clientData.email || existing[0].email,
            phone: clientData.phone || existing[0].phone,
            cnpj: clientData.cnpj || existing[0].cnpj,
            cpf: clientData.cpf || existing[0].cpf,
            address: clientData.address || existing[0].address,
            city: clientData.city || existing[0].city,
            state: clientData.state || existing[0].state,
            zipCode: clientData.zipCode || existing[0].zipCode,
            businessPotentialScore: clientData.businessPotential ? clientData.businessPotential.toString() : existing[0].businessPotentialScore,
            representativeId: representativeId,
            updatedAt: new Date(),
          })
          .where(eq(clients.id, existing[0].id));
        
        // Log duplicate detection if it was a fuzzy or phone match
        if (matchType && matchType !== "cnpj") {
          await db.insert(clientDuplicates).values({
            originalClientId: existing[0].id,
            duplicateClientId: existing[0].id, // For tracking updates to the same record
            matchType: matchType,
            confidenceScore: confidenceScore.toString(),
            isResolved: true,
            resolvedAt: new Date(),
          });
        }
        updated++;
      } else {
        // Create new client
        await db.insert(clients).values({
          name: clientData.name,
          type: clientData.type,
          email: clientData.email,
          phone: clientData.phone,
          cnpj: clientData.cnpj,
          cpf: clientData.cpf,
          address: clientData.address,
          city: clientData.city,
          state: clientData.state,
          zipCode: clientData.zipCode,
          businessPotentialScore: clientData.businessPotential ? clientData.businessPotential.toString() : "50",
          representativeId: representativeId,
          region: clientData.city || "Não especificado",
          contactPerson: clientData.contactName,
        });
        created++;
      }
    } catch (error) {
      errors.push({
        row: i + 2,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  return {
    success: errors.length === 0,
    message: `Importação concluída: ${created} criados, ${updated} atualizados`,
    recordsProcessed: data.length,
    recordsCreated: created,
    recordsUpdated: updated,
    errors,
    importId,
  };
}

export async function importSalesFromExcel(
  data: ExcelSalesData[],
  userId: number
): Promise<ImportResult> {
  const db = await getDb();
  if (!db) {
    return {
      success: false,
      message: "Database connection failed",
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      errors: [],
      importId: `import_${Date.now()}`,
    };
  }

  const importId = `import_${Date.now()}_sales`;
  const errors: Array<{ row: number; error: string }> = [];
  let created = 0;

  // Carregar dados do banco para fuzzy matching
  const allClients = await db.select().from(clients);
  const allReps = await db.select().from(representatives);
  const allProducts = await db.select().from(products);

  const clientNames = allClients.map(c => c.name);
  const repNames = allReps.map(r => r.name);
  const productNames = allProducts.map(p => p.name);

  for (let i = 0; i < data.length; i++) {
    try {
      const row = i + 2;
      const saleData = data[i];

      // Validate required fields
      if (!saleData.clientName || !saleData.representativeName || !saleData.amount) {
        errors.push({
          row,
          error: "Cliente, representante e valor são obrigatórios",
        });
        continue;
      }

      // Find client com fuzzy matching
      let clientResult = await db
        .select()
        .from(clients)
        .where(eq(clients.name, saleData.clientName))
        .limit(1);

      if (clientResult.length === 0) {
        // Tentar fuzzy matching
        const fuzzyClient = findFuzzyMatch(saleData.clientName, clientNames, 0.75);
        if (fuzzyClient.match) {
          clientResult = allClients.filter(c => c.name === fuzzyClient.match);
        } else {
          errors.push({
            row,
            error: `Cliente "${saleData.clientName}" não encontrado (fuzzy match com score ${fuzzyClient.score.toFixed(2)})`,
          });
          continue;
        }
      }

      // Find representative com fuzzy matching
      let repResult = await db
        .select()
        .from(representatives)
        .where(eq(representatives.name, saleData.representativeName))
        .limit(1);

      if (repResult.length === 0) {
        // Tentar fuzzy matching
        const fuzzyRep = findFuzzyMatch(saleData.representativeName, repNames, 0.75);
        if (fuzzyRep.match) {
          repResult = allReps.filter(r => r.name === fuzzyRep.match);
        } else {
          errors.push({
            row,
            error: `Representante "${saleData.representativeName}" não encontrado (fuzzy match com score ${fuzzyRep.score.toFixed(2)})`,
          });
          continue;
        }
      }

      // Create sales record
      const salesResult = await db.insert(salesHistory).values({
        clientId: clientResult[0].id,
        representativeId: repResult[0].id,
        amount: saleData.amount.toString(),
        saleDate: new Date(saleData.saleDate),
        productCategory: saleData.productCategory,
        notes: saleData.notes,
        createdAt: new Date(),
      });

      // Se houver produto, criar item de venda
      if (saleData.product) {
        const fuzzyProduct = findFuzzyMatch(saleData.product, productNames, 0.7);
        if (fuzzyProduct.match) {
          const product = allProducts.find(p => p.name === fuzzyProduct.match);
          if (product) {
            const quantity = saleData.quantity || 1;
            const unitPrice = product.price ? parseFloat(product.price.toString()) : saleData.amount / quantity;
            const totalPrice = unitPrice * quantity;

            await db.insert(salesItems).values({
              salesHistoryId: (salesResult as any).insertId || 0,
              productId: product.id,
              quantity: quantity.toString(),
              unitPrice: unitPrice.toString(),
              totalPrice: totalPrice.toString(),
              createdAt: new Date(),
            });
          }
        }
      }

      created++;
    } catch (error) {
      errors.push({
        row: i + 2,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  return {
    success: errors.length === 0,
    message: `Importação concluída: ${created} vendas importadas`,
    recordsProcessed: data.length,
    recordsCreated: created,
    recordsUpdated: 0,
    errors,
    importId,
  };
}

export async function importProductsFromExcel(
  data: ExcelProductData[],
  userId: number
): Promise<ImportResult> {
  const db = await getDb();
  if (!db) {
    return {
      success: false,
      message: "Database connection failed",
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      errors: [],
      importId: `import_${Date.now()}`,
    };
  }

  const importId = `import_${Date.now()}_products`;
  const errors: Array<{ row: number; error: string }> = [];
  let created = 0;
  let updated = 0;

  for (let i = 0; i < data.length; i++) {
    try {
      const row = i + 2;
      const productData = data[i];

      // Validate required fields
      if (!productData.name || !productData.category) {
        errors.push({
          row,
          error: "Nome e categoria são obrigatórios",
        });
        continue;
      }

      // Check if product already exists by SKU or name
      let existing = await db
        .select()
        .from(products)
        .where(eq(products.name, productData.name))
        .limit(1);

      if (existing.length === 0 && productData.sku) {
        existing = await db
          .select()
          .from(products)
          .where(eq(products.sku, productData.sku))
          .limit(1);
      }

      if (existing.length > 0) {
        // Update existing product
        await db
          .update(products)
          .set({
            category: productData.category,
            description: productData.description || existing[0].description,
            price: productData.price ? productData.price.toString() : existing[0].price,
            unit: productData.unit || existing[0].unit,
            supplier: productData.supplier || existing[0].supplier,
            updatedAt: new Date(),
          })
          .where(eq(products.id, existing[0].id));
        updated++;
      } else {
        // Create new product
        await db.insert(products).values({
          name: productData.name,
          category: productData.category,
          description: productData.description,
          price: productData.price ? productData.price.toString() : undefined,
          unit: productData.unit,
          supplier: productData.supplier,
          sku: productData.sku,
        });
        created++;
      }
    } catch (error) {
      errors.push({
        row: i + 2,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  return {
    success: errors.length === 0,
    message: `Importação concluída: ${created} criados, ${updated} atualizados`,
    recordsProcessed: data.length,
    recordsCreated: created,
    recordsUpdated: updated,
    errors,
    importId,
  };
}

export interface ProtheusConfig {
  apiUrl: string;
  apiKey: string;
  company: string;
}

export async function importFromProtheus(
  config: ProtheusConfig,
  entityType: "clients" | "sales" | "representatives" | "products"
): Promise<ImportResult> {
  const importId = `import_${Date.now()}_protheus`;

  try {
    // This is a template for Protheus integration
    // Actual implementation depends on your Protheus API setup
    const response = await fetch(`${config.apiUrl}/${entityType}`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Erro ao conectar com Protheus: ${response.statusText}`,
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        errors: [],
        importId,
      };
    }

    const data = await response.json();

    // Process based on entity type
    if (entityType === "clients") {
      return await importClientsFromExcel(data, 0);
    } else if (entityType === "sales") {
      return await importSalesFromExcel(data, 0);
    } else if (entityType === "products") {
      return await importProductsFromExcel(data, 0);
    }

    return {
      success: true,
      message: "Importação do Protheus iniciada",
      recordsProcessed: data.length || 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      errors: [],
      importId,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      errors: [{ row: 0, error: "Falha na conexão com Protheus" }],
      importId,
    };
  }
}

export async function importOrdersFromExcel(
  data: ExcelOrderData[],
  userId: number
): Promise<ImportResult> {
  const db = await getDb();
  if (!db) {
    return {
      success: false,
      message: "Database connection failed",
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      errors: [],
      importId: `import_${Date.now()}`,
    };
  }

  const importId = `import_${Date.now()}_orders`;
  const errors: Array<{ row: number; error: string }> = [];
  let created = 0;
  let updated = 0;

  // Carregar dados para fuzzy matching
  const allClients = await db.select().from(clients);
  const allReps = await db.select().from(representatives);
  const clientNames = allClients.map(c => c.name);
  const repNames = allReps.map(r => r.name);

  // Criar log de importação
  const logResult = await db.insert(importLogs).values({
    fileName: "Importação de Pedidos",
    importType: "orders",
    totalRows: data.length,
    status: "processing",
    performedBy: userId,
  });
  const importLogId = (logResult as any).insertId || 0;

  for (let i = 0; i < data.length; i++) {
    try {
      const row = i + 2;
      const orderData = data[i];

      if (!orderData.orderNumber || !orderData.clientName || !orderData.totalValue) {
        // totalValue is derived from quantity * unitPrice if not provided
      }

      const quantity = orderData.quantity || 0;
      const unitPrice = orderData.unitPrice || 0;
      const totalValue = quantity * unitPrice;

      // Find client fuzzy
      const fuzzyClient = findFuzzyMatch(orderData.clientName, clientNames, 0.75);
      if (!fuzzyClient.match) {
        errors.push({ row, error: `Cliente "${orderData.clientName}" não encontrado.` });
        continue;
      }
      const client = allClients.find(c => c.name === fuzzyClient.match);

      // Find rep fuzzy
      const fuzzyRep = findFuzzyMatch(orderData.representativeName, repNames, 0.75);
      const representative = allReps.find(r => r.name === fuzzyRep.match) || allReps[0];

      // Check existing order
      const existing = await db.select().from(orders).where(eq(orders.orderNumber, orderData.orderNumber)).limit(1);

      if (existing.length > 0) {
        await db.update(orders).set({
          clientId: client!.id,
          representativeId: representative.id,
          productName: orderData.productName,
          quantity: quantity.toString(),
          unitPrice: unitPrice.toString(),
          totalValue: totalValue.toString(),
          status: orderData.status || existing[0].status,
          issueDate: new Date(orderData.issueDate),
          expectedDeliveryDate: orderData.expectedDeliveryDate ? new Date(orderData.expectedDeliveryDate) : existing[0].expectedDeliveryDate,
          importLogId: importLogId,
          updatedAt: new Date(),
        }).where(eq(orders.id, existing[0].id));
        updated++;
      } else {
        await db.insert(orders).values({
          orderNumber: orderData.orderNumber,
          clientId: client!.id,
          representativeId: representative.id,
          productName: orderData.productName,
          quantity: quantity.toString(),
          unitPrice: unitPrice.toString(),
          totalValue: totalValue.toString(),
          status: orderData.status || "pendente",
          issueDate: new Date(orderData.issueDate),
          expectedDeliveryDate: orderData.expectedDeliveryDate ? new Date(orderData.expectedDeliveryDate) : null,
          importLogId: importLogId,
        });
        created++;
      }
    } catch (error) {
      errors.push({
        row: i + 2,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  // Atualizar log
  await db.update(importLogs).set({
    processedRows: data.length,
    successRows: created + updated,
    errorRows: errors.length,
    status: "completed",
  }).where(eq(importLogs.id, importLogId));

  return {
    success: errors.length === 0,
    message: `Importação de pedidos concluída: ${created} criados, ${updated} atualizados`,
    recordsProcessed: data.length,
    recordsCreated: created,
    recordsUpdated: updated,
    errors,
    importId,
  };
}
