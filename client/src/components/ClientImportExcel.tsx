import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, CheckCircle, AlertCircle, Loader, ChevronRight } from "lucide-react";
import * as XLSX from "xlsx";
import { trpc } from "@/lib/trpc";

interface ClientRow {
  name: string;
  type: "farm" | "factory";
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  region: string;
  representativeId: number;
  annualBudget?: number;
  contactPerson?: string;
}

interface ColumnMapping {
  [key: string]: string | null; // field -> column header
}

const REQUIRED_FIELDS = ["name", "region", "representativeId"];
const OPTIONAL_FIELDS = ["type", "email", "phone", "address", "city", "state", "zipCode", "annualBudget", "contactPerson"];

export default function ClientImportExcel() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>("");
  const [importedCount, setImportedCount] = useState(0);
  const [step, setStep] = useState<"upload" | "mapping" | "result">("upload");
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [excelPreview, setExcelPreview] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});

  const createClientMutation = trpc.clients.create.useMutation();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls") && !selectedFile.name.endsWith(".csv")) {
        setError("Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV");
        return;
      }

      try {
        const reader = new FileReader();
        reader.onload = (e) => {
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
            setExcelPreview(rows.slice(0, 5)); // Preview das 5 primeiras linhas
            setFile(selectedFile);
            setError("");
            setSuccess(false);
            setStep("mapping");

            // Auto-mapear colunas com nomes similares
            const autoMapping: ColumnMapping = {};
            const allFields = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];
            
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

  const handleColumnMappingChange = (field: string, column: string | null) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: column
    }));
  };

  const handleImport = async () => {
    // Validar mapeamento
    for (const field of REQUIRED_FIELDS) {
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
          const errors: string[] = [];

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];

            try {
              const clientData: any = {};

              // Mapear campos usando o mapeamento definido
              for (const [field, column] of Object.entries(columnMapping)) {
                if (column && row[column] !== undefined && row[column] !== null && row[column] !== "") {
                  clientData[field] = row[column];
                }
              }

              // Validar campos obrigatórios
              if (!clientData.name || !clientData.region) {
                errors.push(`Linha ${i + 2}: Faltam dados em campos obrigatórios`);
                errorCount++;
                continue;
              }

              // Converter tipos de dados
              const clientToCreate: any = {
                name: String(clientData.name),
                type: (clientData.type || "farm") as "farm" | "factory",
                region: String(clientData.region),
                representativeId: Number(clientData.representativeId) || 1,
              };

              // Adicionar campos opcionais se disponíveis
              if (clientData.email) clientToCreate.email = String(clientData.email);
              if (clientData.phone) clientToCreate.phone = String(clientData.phone);
              if (clientData.address) clientToCreate.address = String(clientData.address);
              if (clientData.city) clientToCreate.city = String(clientData.city);
              if (clientData.state) clientToCreate.state = String(clientData.state);
              if (clientData.zipCode) clientToCreate.zipCode = String(clientData.zipCode);
              if (clientData.annualBudget) clientToCreate.annualBudget = Number(clientData.annualBudget);
              if (clientData.contactPerson) clientToCreate.contactPerson = String(clientData.contactPerson);

              await createClientMutation.mutateAsync(clientToCreate);
              successCount++;
            } catch (err: any) {
              errors.push(`Linha ${i + 2}: ${err.message}`);
              errorCount++;
            }
          }

          setImportedCount(successCount);
          setStep("result");

          if (successCount > 0) {
            setSuccess(true);
            setFile(null);
          }

          if (errors.length > 0) {
            setError(`${successCount} clientes importados com sucesso. ${errorCount} erros encontrados:\n${errors.slice(0, 5).join("\n")}${errors.length > 5 ? `\n... e mais ${errors.length - 5} erros` : ""}`);
          }
        } catch (err: any) {
          setError(`Erro ao processar arquivo: ${err.message}`);
        } finally {
          setLoading(false);
        }
      };
      reader.readAsBinaryString(file!);
    } catch (err: any) {
      setError(`Erro ao ler arquivo: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Importar Clientes por Excel
        </CardTitle>
        <CardDescription>
          Carregue um arquivo Excel com os dados dos clientes. O formato não precisa ser exato - você mapeará as colunas.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* STEP 1: Upload */}
        {step === "upload" && (
          <>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-accent transition">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
                id="excel-upload"
                disabled={loading}
              />
              <label htmlFor="excel-upload" className="cursor-pointer">
                <div className="space-y-2">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                  <div>
                    <p className="font-medium">Clique para selecionar arquivo</p>
                    <p className="text-sm text-muted-foreground">ou arraste um arquivo Excel aqui</p>
                  </div>
                </div>
              </label>
            </div>

            {error && (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {/* STEP 2: Column Mapping */}
        {step === "mapping" && (
          <>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="font-medium text-blue-900 mb-2">Mapeamento de Colunas</p>
                <p className="text-sm text-blue-800">Selecione qual coluna do seu arquivo corresponde a cada campo:</p>
              </div>

              {/* Required Fields */}
              <div className="space-y-3">
                <p className="font-medium text-sm">Campos Obrigatórios *</p>
                {REQUIRED_FIELDS.map(field => (
                  <div key={field} className="flex items-center gap-2">
                    <label className="w-32 text-sm font-medium">{field}</label>
                    <select
                      value={columnMapping[field] || ""}
                      onChange={(e) => handleColumnMappingChange(field, e.target.value || null)}
                      className="flex-1 px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="">-- Selecione coluna --</option>
                      {excelColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Optional Fields */}
              <div className="space-y-3">
                <p className="font-medium text-sm">Campos Opcionais</p>
                {OPTIONAL_FIELDS.map(field => (
                  <div key={field} className="flex items-center gap-2">
                    <label className="w-32 text-sm font-medium">{field}</label>
                    <select
                      value={columnMapping[field] || ""}
                      onChange={(e) => handleColumnMappingChange(field, e.target.value || null)}
                      className="flex-1 px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="">-- Não mapear --</option>
                      {excelColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Preview */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="font-medium text-sm mb-2">Preview dos dados (primeiras 5 linhas):</p>
                <div className="overflow-x-auto">
                  <table className="text-xs w-full">
                    <thead>
                      <tr className="border-b">
                        {excelColumns.map(col => (
                          <th key={col} className="px-2 py-1 text-left">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {excelPreview.map((row, idx) => (
                        <tr key={idx} className="border-b">
                          {excelColumns.map(col => (
                            <td key={col} className="px-2 py-1">{String(row[col] || "").substring(0, 20)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-800 text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
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
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <ChevronRight className="w-4 h-4 mr-2" />
                      Importar Clientes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* STEP 3: Result */}
        {step === "result" && (
          <>
            {success && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  ✅ {importedCount} cliente(s) importado(s) com sucesso!
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-800 whitespace-pre-wrap text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={() => {
                setStep("upload");
                setFile(null);
                setColumnMapping({});
                setError("");
                setSuccess(false);
              }}
              className="w-full"
            >
              Importar Outro Arquivo
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
