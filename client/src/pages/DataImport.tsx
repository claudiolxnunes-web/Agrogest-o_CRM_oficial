import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import SmartImportExcel from "@/components/SmartImportExcel";
import ClearDatabaseDialog from "@/components/ClearDatabaseDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, AlertCircle, CheckCircle, FileText, Settings, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ImportLog {
  id: string;
  type: "clients" | "sales" | "products";
  filename: string;
  timestamp: Date;
  status: "success" | "error" | "pending";
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  errors: Array<{ row: number; error: string }>;
}

export default function DataImport() {
  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
  const [activeTab, setActiveTab] = useState("clients");
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [protheuConfig, setProtheuConfig] = useState({
    apiUrl: "",
    apiKey: "",
    company: "",
  });

  const handleImportComplete = (type: "clients" | "sales" | "products") => (result: any) => {
    const newLog: ImportLog = {
      id: `import_${Date.now()}`,
      type,
      filename: `Importação de ${type}`,
      timestamp: new Date(),
      status: result.errors?.length === 0 ? "success" : "pending",
      recordsProcessed: result.importedCount || 0,
      recordsCreated: result.importedCount || 0,
      recordsUpdated: 0,
      errors: result.errors || [],
    };

    setImportLogs([newLog, ...importLogs]);
    toast.success(`${result.importedCount} registros importados com sucesso`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Importação de Dados</h1>
            <p className="text-gray-600 mt-2">
              Importe dados de Excel ou integre com sistemas externos como Protheus
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={() => setClearDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Limpar Base de Dados
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="clients">Clientes</TabsTrigger>
            <TabsTrigger value="sales">Vendas</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="protheus">Protheus</TabsTrigger>
          </TabsList>

          {/* Clientes */}
          <TabsContent value="clients" className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription>
                <strong>IA Inteligente:</strong> O sistema reconhecerá automaticamente os cabeçalhos do seu Excel e mapeará as colunas para os campos corretos.
              </AlertDescription>
            </Alert>
            <SmartImportExcel 
              importType="clients" 
              onImportComplete={handleImportComplete("clients")}
            />
          </TabsContent>

          {/* Vendas */}
          <TabsContent value="sales" className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription>
                <strong>Fuzzy Matching:</strong> O sistema encontrará clientes e representantes mesmo com variações no nome.
              </AlertDescription>
            </Alert>
            <SmartImportExcel 
              importType="sales" 
              onImportComplete={handleImportComplete("sales")}
            />
          </TabsContent>

          {/* Produtos */}
          <TabsContent value="products" className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription>
                <strong>Gestão de Produtos:</strong> Importe produtos e categorias com suporte a SKU e preços.
              </AlertDescription>
            </Alert>
            <SmartImportExcel 
              importType="products" 
              onImportComplete={handleImportComplete("products")}
            />
          </TabsContent>

          {/* Protheus */}
          <TabsContent value="protheus" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Integração Protheus
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Configure as credenciais do seu sistema Protheus para importação automática
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">URL da API</label>
                    <input
                      type="text"
                      placeholder="https://seu-protheus.com/api"
                      value={protheuConfig.apiUrl}
                      onChange={(e) => setProtheuConfig({ ...protheuConfig, apiUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">API Key</label>
                    <input
                      type="password"
                      placeholder="Sua API Key"
                      value={protheuConfig.apiKey}
                      onChange={(e) => setProtheuConfig({ ...protheuConfig, apiKey: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Empresa</label>
                    <input
                      type="text"
                      placeholder="Código da empresa"
                      value={protheuConfig.company}
                      onChange={(e) => setProtheuConfig({ ...protheuConfig, company: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">Testar Conexão</Button>
                    <Button className="flex-1">Importar Dados</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Histórico de Importações */}
        {importLogs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Histórico de Importações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {importLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border">
                    <div className="mt-1">
                      {log.status === "success" ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{log.filename}</p>
                          <p className="text-sm text-gray-600">
                            {log.timestamp.toLocaleString("pt-BR")}
                          </p>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {log.type}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Processados</p>
                          <p className="font-semibold">{log.recordsProcessed}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Criados</p>
                          <p className="font-semibold text-green-600">{log.recordsCreated}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Erros</p>
                          <p className="font-semibold text-red-600">{log.errors.length}</p>
                        </div>
                      </div>
                      {log.errors.length > 0 && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs max-h-24 overflow-y-auto">
                          {log.errors.slice(0, 5).map((err, i) => (
                            <p key={i} className="text-red-700">
                              Linha {err.row}: {err.error}
                            </p>
                          ))}
                          {log.errors.length > 5 && (
                            <p className="text-red-600 italic">... e mais {log.errors.length - 5} erros</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dialog de Limpeza */}
        <ClearDatabaseDialog 
          open={clearDialogOpen} 
          onOpenChange={setClearDialogOpen} 
        />
      </div>
    </DashboardLayout>
  );
}
