import { invokeLLM } from "./_core/llm";

/**
 * Interface para resultado do reconhecimento de cabeçalhos
 */
export interface HeaderRecognitionResult {
  mappings: Record<string, string>; // field -> detected column header
  confidence: Record<string, number>; // field -> confidence score (0-100)
  suggestions: string[]; // sugestões adicionais
}

/**
 * Interface para dados de contexto do banco
 */
export interface DatabaseContext {
  existingClients: Array<{ name: string; type: string; region: string }>;
  existingRepresentatives: Array<{ name: string; region: string }>;
  existingProducts: Array<{ name: string; category: string }>;
}

/**
 * Reconhecer cabeçalhos de Excel usando IA
 * Mapeia automaticamente colunas para campos do sistema
 */
export async function recognizeExcelHeaders(
  excelHeaders: string[],
  importType: "clients" | "sales" | "products",
  databaseContext?: DatabaseContext
): Promise<HeaderRecognitionResult> {
  try {
    // Definir campos esperados por tipo de importação
    const fieldsMap = {
      clients: {
        required: ["name", "type"],
        optional: ["email", "phone", "address", "city", "state", "zipCode", "region", "representativeId", "contactPerson", "annualBudget"],
      },
      sales: {
        required: ["clientName", "representativeName", "amount", "saleDate"],
        optional: ["product", "quantity", "productCategory", "notes"],
      },
      products: {
        required: ["name", "category"],
        optional: ["description", "price", "unit", "supplier", "sku"],
      },
    };

    const expectedFields = fieldsMap[importType];
    const allFields = [...expectedFields.required, ...expectedFields.optional];

    // Preparar contexto para LLM
    const contextInfo = databaseContext
      ? `
    Contexto do Banco de Dados:
    - Clientes existentes (amostra): ${databaseContext.existingClients.slice(0, 5).map(c => `"${c.name}" (${c.type})`).join(", ")}
    - Representantes existentes (amostra): ${databaseContext.existingRepresentatives.slice(0, 5).map(r => `"${r.name}"`).join(", ")}
    - Produtos existentes (amostra): ${databaseContext.existingProducts.slice(0, 5).map(p => `"${p.name}"`).join(", ")}
    `
      : "";

    // Chamar LLM para reconhecimento inteligente
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Você é um especialista em processamento de dados e reconhecimento de padrões.
          Sua tarefa é mapear colunas de um arquivo Excel para campos de um sistema de CRM agrícola.
          
          Regras:
          1. Analise os nomes das colunas do Excel
          2. Mapeie-os para os campos esperados do sistema
          3. Considere variações de nomenclatura (ex: "Cliente" = "name", "Tipo de Cliente" = "type")
          4. Para cada mapeamento, forneça um score de confiança (0-100)
          5. Retorne um JSON válido com a estrutura: { "mappings": {...}, "confidence": {...}, "suggestions": [...] }
          
          Campos esperados para importação de ${importType}:
          - Obrigatórios: ${expectedFields.required.join(", ")}
          - Opcionais: ${expectedFields.optional.join(", ")}
          
          ${contextInfo}`,
        },
        {
          role: "user",
          content: `Colunas encontradas no Excel: ${excelHeaders.map(h => `"${h}"`).join(", ")}
          
          Tipo de importação: ${importType}
          
          Mapeie as colunas do Excel para os campos do sistema. Retorne um JSON com:
          {
            "mappings": { "fieldName": "excelColumnName", ... },
            "confidence": { "fieldName": 85, ... },
            "suggestions": ["sugestão 1", "sugestão 2"]
          }
          
          Responda APENAS com o JSON válido, sem explicações adicionais.`,
        },
      ],
    });

    // Extrair resposta do LLM
    const responseText = response.choices[0]?.message.content || "{}";
    
    // Tentar fazer parse do JSON
    let result: HeaderRecognitionResult;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      // Se falhar, fazer parse mais tolerante
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: usar reconhecimento simples
        result = fallbackHeaderRecognition(excelHeaders, importType);
      }
    }

    // Validar resultado
    if (!result.mappings) result.mappings = {};
    if (!result.confidence) result.confidence = {};
    if (!result.suggestions) result.suggestions = [];

    return result;
  } catch (error) {
    console.error("[HeaderRecognition] Error:", error);
    // Fallback em caso de erro
    return fallbackHeaderRecognition(excelHeaders, importType);
  }
}

/**
 * Reconhecimento de cabeçalhos com fallback (sem IA)
 * Usa algoritmo simples de string matching
 */
function fallbackHeaderRecognition(
  excelHeaders: string[],
  importType: "clients" | "sales" | "products"
): HeaderRecognitionResult {
  const fieldsMap = {
    clients: {
      name: ["nome", "name", "cliente", "client", "razão", "razao", "empresa"],
      type: ["tipo", "type", "categoria", "category", "tipo_cliente"],
      email: ["email", "e-mail", "mail"],
      phone: ["telefone", "phone", "celular", "tel"],
      address: ["endereço", "endereco", "address", "rua"],
      city: ["cidade", "city", "município", "municipio"],
      state: ["estado", "state", "uf", "estado"],
      zipCode: ["cep", "zip", "zipcode"],
      region: ["região", "regiao", "region"],
      representativeId: ["representante", "representative", "vendedor", "seller"],
      contactPerson: ["contato", "contact", "pessoa_contato"],
      annualBudget: ["orçamento", "orcamento", "budget", "limite"],
    },
    sales: {
      clientName: ["cliente", "client", "nome_cliente"],
      representativeName: ["representante", "representative", "vendedor", "seller"],
      amount: ["valor", "amount", "total", "preço", "preco"],
      saleDate: ["data", "date", "data_venda", "saledate"],
      product: ["produto", "product", "item"],
      quantity: ["quantidade", "quantity", "qtd"],
      productCategory: ["categoria", "category", "tipo_produto"],
      notes: ["notas", "notes", "observações", "observacoes"],
    },
    products: {
      name: ["nome", "name", "produto", "product"],
      category: ["categoria", "category", "tipo", "type"],
      description: ["descrição", "descricao", "description"],
      price: ["preço", "preco", "price", "valor"],
      unit: ["unidade", "unit", "un"],
      supplier: ["fornecedor", "supplier"],
      sku: ["sku", "código", "codigo"],
    },
  };

  const fieldMap = fieldsMap[importType];
  const mappings: Record<string, string> = {};
  const confidence: Record<string, number> = {};

  // Para cada campo esperado
  for (const [field, keywords] of Object.entries(fieldMap)) {
    // Procurar por coluna que corresponda
    for (const excelHeader of excelHeaders) {
      const headerLower = excelHeader.toLowerCase().trim();
      
      for (const keyword of keywords) {
        if (headerLower.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(headerLower)) {
          mappings[field] = excelHeader;
          // Calcular confiança baseada em similaridade
          const similarity = Math.min(
            headerLower.length,
            keyword.length
          ) / Math.max(headerLower.length, keyword.length);
          confidence[field] = Math.round(similarity * 100);
          break;
        }
      }
      
      if (mappings[field]) break;
    }
  }

  return {
    mappings,
    confidence,
    suggestions: [
      "Verifique os mapeamentos com baixa confiança (<70%)",
      "Colunas não mapeadas podem precisar de ajuste manual",
    ],
  };
}

/**
 * Encontrar correspondências fuzzy para clientes/representantes
 * Útil para resolver nomes ligeiramente diferentes
 */
export function findFuzzyMatch(
  searchTerm: string,
  candidates: string[],
  threshold: number = 0.7
): { match: string | null; score: number } {
  if (!searchTerm || candidates.length === 0) {
    return { match: null, score: 0 };
  }

  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const score = calculateStringSimilarity(searchTerm.toLowerCase(), candidate.toLowerCase());
    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }

  if (bestScore >= threshold) {
    return { match: bestMatch, score: bestScore };
  }

  return { match: null, score: bestScore };
}

/**
 * Calcular similaridade entre duas strings (Levenshtein distance)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calcular distância de edição (Levenshtein)
 */
function getEditDistance(str1: string, str2: string): number {
  const costs: number[] = [];

  for (let i = 0; i <= str1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= str2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (str1.charAt(i - 1) !== str2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[str2.length] = lastValue;
  }

  return costs[str2.length];
}
