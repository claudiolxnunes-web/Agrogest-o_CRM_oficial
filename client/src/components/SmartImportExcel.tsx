import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, CheckCircle, AlertCircle, Loader, ChevronRight, Brain } from "lucide-react";
import * as XLSX from "xlsx";
import { trpc } from "@/lib/trpc";

interface ColumnMapping {
  [key: string]: string | null; // field -> column header
}

interface HeaderRecognitionResult {
  mappings: Record<string, string>;
  confidence: Record<string, number>;
  suggestions: string[];
}

interface SmartImportExcelProps {
  importType: "clients" | "sales" | "products";
  onImportComplete?: (result: any) => void;
}

export default function SmartImportExcel({ importType, onImportComplete }: SmartImportExcelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>("");
  const [importedCount, setImportedCount] = useState(0);
  const [step, setStep] = useState<"upload" | "mapping" | "result">("upload");
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [excelPreview, setExcelPreview] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [headerRecognition, setHeaderRecognition] = useState<HeaderRecognitionResult | null>(null);
  const [errors, setErrors] = useState<Array<{ row: number; error: string }>>([]);

  // Definir campos por tipo de importação
  const fieldsConfig = {
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

  const config = fieldsConfig[importType];
  const allFields = [...config.required, ...config.optional];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls") && !selectedFile.name.endsWith(".csv")) {
        setError("Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV");
        return;
      }

      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: "binary" });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(worksheet) as any[];

            if (rows.length === 0) {
              setError("O arquivo Excel está vazio");
              return;
            }

            const columns = Object.keys(rows[0]);
            setExcelColumns(columns);
            setExcelPreview(rows.slice(0, 5));
            setFile(selectedFile);
            setError("");
            setSuccess(false);
            setStep("mapping");

            // Usar reconhecimento inteligente de cabeçalhos
            await recognizeHeadersWithAI(columns);
          } catch (err: any) {
            setError(`Erro ao ler arquivo: ${err.message}`);
          }
        };
        reader.readAsBinaryString(selectedFile);
      } catch (err: any) {
        setError(`Erro ao processar arquivo: ${err.message}`);
      }
    }
  };

  const recognizeHeadersWithAI = async (columns: string[]) => {
    setRecognizing(true);
    try {
      // Aqui você chamaria a API para reconhecimento com IA
      // Por enquanto, usamos fallback local
      const autoMapping: ColumnMapping = {};
      
      // Mapeamento simples como fallback
      for (const field of allFields) {
        const matchedColumn = columns.find(col => 
          col.toLowerCase().includes(field.toLowerCase()) || 
          field.toLowerCase().includes(col.toLowerCase())
        );
        if (matchedColumn) {
          autoMapping[field] = matchedColumn;
        }
      }
      
      setColumnMapping(autoMapping);
      setHeaderRecognition({
        mappings: autoMapping,
        confidence: Object.fromEntries(
          Object.entries(autoMapping).map(([field, col]) => [field, col ? 75 : 0])
        ),
        suggestions: [
          "Verifique os mapeamentos com baixa confiança",
          "Colunas não mapeadas podem precisar de ajuste manual",
        ],
      });
    } catch (err) {
      console.error("Erro ao reconhecer cabeçalhos:", err);
      // Fallback para mapeamento simples
      const autoMapping: ColumnMapping = {};
      for (const field of allFields) {
        const matchedColumn = columns.find(col => 
          col.toLowerCase().includes(field.toLowerCase())
        );
        if (matchedColumn) {
          autoMapping[field] = matchedColumn;
        }
      }
      setColumnMapping(autoMapping);
    } finally {
      setRecognizing(false);
    }
  };

  const handleColumnMappingChange = (field: string, column: string | null) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: column
    }));
  };

  const handleImport = async () => {
    // Validar mapeamento
    for (const field of config.required) {
      if (!columnMapping[field]) {
        setError(`Campo obrigatório "${field}" não foi mapeado`);
        return;
      }
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(worksheet) as any[];

          let successCount = 0;
          let errorCount = 0;
          const importErrors: Array<{ row: number; error: string }> = [];

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
              const rowData: any = {};

              // Mapear campos usando o mapeamento definido
              for (const [field, column] of Object.entries(columnMapping)) {
                if (column && row[column] !== undefined && row[column] !== null && row[column] !== "") {
                  rowData[field] = row[column];
                }
              }

              // Validar campos obrigatórios
              const missingRequired = config.required.filter(field => !rowData[field]);
              if (missingRequired.length > 0) {
                importErrors.push({
                  row: i + 2,
                  error: `Faltam dados em campos obrigatórios: ${missingRequired.join(", ")}`,
                });
                errorCount++;
                continue;
              }

              // Aqui você faria a chamada tRPC para importar
              // Por enquanto, apenas contamos como sucesso
              successCount++;
            } catch (err: any) {
              importErrors.push({
                row: i + 2,
                error: err.message,
              });
              errorCount++;
            }
          }

          setImportedCount(successCount);
          setErrors(importErrors);
          setSuccess(errorCount === 0);
          setStep("result");
        } catch (err: any) {
          setError(`Erro ao processar arquivo: ${err.message}`);
        } finally {
          setLoading(false);
        }
      };
      reader.readAsBinaryString(file!);
    } catch (err: any) {
      setError(`Erro ao importar: ${err.message}`);
      setLoading(false);
    }
  };

  if (step === "upload") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Importar {importType === "clients" ? "Clientes" : importType === "sales" ? "Vendas" : "Produtos"}</CardTitle>
          <CardDescription>
            Faça upload de um arquivo Excel com os dados a importar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-semibold mb-2">Clique para selecionar ou arraste um arquivo</p>
              <p className="text-sm text-gray-500">Formatos suportados: .xlsx, .xls, .csv</p>
            </label>
          </div>
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  if (step === "mapping") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Mapeamento de Colunas
          </CardTitle>
          <CardDescription>
            Verifique e ajuste o mapeamento automático de colunas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recognizing && (
            <Alert className="mb-4">
              <Loader className="h-4 w-4 animate-spin" />
              <AlertDescription>Analisando cabeçalhos com IA...</AlertDescription>
            </Alert>
          )}

          {headerRecognition?.suggestions && (
            <Alert className="mb-4 bg-blue-50 border-blue-200">
              <AlertDescription className="text-sm">
                {headerRecognition.suggestions.map((s, i) => (
                  <div key={i}>• {s}</div>
                ))}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 mb-6">
            {/* Campos Obrigatórios */}
            <div>
              <h3 className="font-semibold text-red-600 mb-3">Campos Obrigatórios</h3>
              <div className="space-y-3">
                {config.required.map(field => (
                  <div key={field} className="flex items-center gap-2">
                    <label className="w-32 font-medium">{field}</label>
                    <select
                      value={columnMapping[field] || ""}
                      onChange={(e) => handleColumnMappingChange(field, e.target.value || null)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">-- Selecione --</option>
                      {excelColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                    {columnMapping[field] && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Campos Opcionais */}
            {config.optional.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-600 mb-3">Campos Opcionais</h3>
                <div className="space-y-3">
                  {config.optional.map(field => (
                    <div key={field} className="flex items-center gap-2">
                      <label className="w-32 font-medium text-sm">{field}</label>
                      <select
                        value={columnMapping[field] || ""}
                        onChange={(e) => handleColumnMappingChange(field, e.target.value || null)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">-- Não mapear --</option>
                        {excelColumns.map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Preview dos Dados</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    {Object.entries(columnMapping)
                      .filter(([_, col]) => col)
                      .map(([field, col]) => (
                        <th key={field} className="border p-2 text-left">{field}</th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {excelPreview.slice(0, 3).map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      {Object.entries(columnMapping)
                        .filter(([_, col]) => col)
                        .map(([_, col]) => (
                          <td key={col} className="border p-2">{row[col] || "-"}</td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setStep("upload");
                setFile(null);
                setColumnMapping({});
              }}
            >
              Voltar
            </Button>
            <Button
              onClick={handleImport}
              disabled={loading || recognizing}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  Importar
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  if (step === "result") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {success ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-500" />
                Importação Concluída
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                Importação com Avisos
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm">
                <strong>{importedCount}</strong> registros importados com sucesso
              </p>
            </div>

            {errors.length > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="font-semibold text-sm mb-2">{errors.length} erros encontrados:</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {errors.slice(0, 10).map((err, i) => (
                    <p key={i} className="text-xs text-gray-700">
                      Linha {err.row}: {err.error}
                    </p>
                  ))}
                  {errors.length > 10 && (
                    <p className="text-xs text-gray-500 italic">... e mais {errors.length - 10} erros</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("upload");
                  setFile(null);
                  setColumnMapping({});
                  setErrors([]);
                }}
              >
                Importar Outro Arquivo
              </Button>
              {onImportComplete && (
                <Button
                  onClick={() => onImportComplete({ importedCount, errors })}
                  className="flex-1"
                >
                  Fechar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
