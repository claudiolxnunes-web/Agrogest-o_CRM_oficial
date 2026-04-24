import { getDb } from "./db";
import { clients, representatives, opportunities, salesHistory, products, salesItems } from "../drizzle/schema";
import { eq } from "drizzle-orm";
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
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  businessPotential?: number;
  representativeId?: number;
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

      // Check if client already exists (com fuzzy matching)
      let existing = await db
        .select()
        .from(clients)
        .where(eq(clients.name, clientData.name))
        .limit(1);

      if (existing.length === 0) {
        // Tentar fuzzy matching
        const fuzzyClient = findFuzzyMatch(clientData.name, 
          (await db.select().from(clients)).map(c => c.name), 
          0.85
        );
        if (fuzzyClient.match) {
          existing = (await db.select().from(clients)).filter(c => c.name === fuzzyClient.match);
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
            address: clientData.address || existing[0].address,
            city: clientData.city || existing[0].city,
            state: clientData.state || existing[0].state,
            zipCode: clientData.zipCode || existing[0].zipCode,
            businessPotentialScore: clientData.businessPotential ? clientData.businessPotential.toString() : existing[0].businessPotentialScore,
            representativeId: representativeId,
            updatedAt: new Date(),
          })
          .where(eq(clients.id, existing[0].id));
        updated++;
      } else {
        // Create new client
        await db.insert(clients).values({
          name: clientData.name,
          type: clientData.type,
          email: clientData.email,
          phone: clientData.phone,
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
