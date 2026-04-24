import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ClearDatabaseDialog from "@/components/ClearDatabaseDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Database, Settings, Trash2, Shield } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Loader } from "lucide-react";

export default function AdminPanel() {
  const { user } = useAuth();
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const getDatabaseStats = trpc.admin.getDatabaseStats.useQuery();

  // Qualquer usuario logado pode acessar o painel

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="w-8 h-8" />
            Painel de Administração
          </h1>
          <p className="text-gray-600 mt-2">
            Ferramentas administrativas e configurações do sistema
          </p>
        </div>

        {/* Alert de Segurança */}
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Atenção:</strong> As operações nesta página podem ser destrutivas e irreversíveis. 
            Use com cuidado e sempre faça backup antes de operações críticas.
          </AlertDescription>
        </Alert>

        {/* Tabs */}
        <Tabs defaultValue="database" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="database">Banco de Dados</TabsTrigger>
            <TabsTrigger value="system">Sistema</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          {/* Aba: Banco de Dados */}
          <TabsContent value="database" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Estatísticas do Banco de Dados
                </CardTitle>
                <CardDescription>
                  Informações sobre o volume de dados armazenados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {getDatabaseStats.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : getDatabaseStats.data ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-gray-600">Clientes</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {getDatabaseStats.data.clientsCount}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-gray-600">Representantes</p>
                      <p className="text-2xl font-bold text-green-600">
                        {getDatabaseStats.data.representativesCount}
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-sm text-gray-600">Vendas</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {getDatabaseStats.data.salesHistoryCount}
                      </p>
                    </div>
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-gray-600">Produtos</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {getDatabaseStats.data.productsCount}
                      </p>
                    </div>
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-gray-600">Oportunidades</p>
                      <p className="text-2xl font-bold text-red-600">
                        {getDatabaseStats.data.opportunitiesCount}
                      </p>
                    </div>
                    <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <p className="text-sm text-gray-600">Metas</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        {getDatabaseStats.data.goalsCount}
                      </p>
                    </div>
                    <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
                      <p className="text-sm text-gray-600">Atividades</p>
                      <p className="text-2xl font-bold text-cyan-600">
                        {getDatabaseStats.data.activitiesCount}
                      </p>
                    </div>
                    <div className="p-4 bg-pink-50 border border-pink-200 rounded-lg">
                      <p className="text-sm text-gray-600">Alertas</p>
                      <p className="text-2xl font-bold text-pink-600">
                        {getDatabaseStats.data.alertsCount}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-600">Total de Registros</p>
                      <p className="text-2xl font-bold text-gray-600">
                        {getDatabaseStats.data.totalRecords}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">Erro ao carregar estatísticas</p>
                )}
              </CardContent>
            </Card>

            {/* Operações Destrutivas */}
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Trash2 className="w-5 h-5" />
                  Operações Destrutivas
                </CardTitle>
                <CardDescription>
                  Operações que deletam dados permanentemente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="destructive" className="bg-red-100 border-red-300">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Aviso:</strong> As operações abaixo são irreversíveis. 
                    Faça backup antes de prosseguir.
                  </AlertDescription>
                </Alert>

                <div className="p-4 bg-white border border-red-200 rounded-lg">
                  <h3 className="font-semibold text-red-600 mb-2">Limpar Base de Dados</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Deleta TODOS os dados da base (exceto usuários). Esta ação não pode ser desfeita.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => setClearDialogOpen(true)}
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpar Base de Dados
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Sistema */}
          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Sistema</CardTitle>
                <CardDescription>
                  Informações e configurações gerais do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Versão</p>
                    <p className="font-semibold">1.0.0</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ambiente</p>
                    <p className="font-semibold">{process.env.NODE_ENV || "production"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Seu Usuário</p>
                    <p className="font-semibold">{user?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold text-sm">{user?.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Logs */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Logs do Sistema</CardTitle>
                <CardDescription>
                  Histórico de eventos e operações administrativas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertDescription>
                    Os logs são armazenados no servidor. Para acessar logs detalhados, 
                    consulte os arquivos de log do servidor.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de Confirmação */}
      <ClearDatabaseDialog 
        open={clearDialogOpen} 
        onOpenChange={setClearDialogOpen} 
      />
    </DashboardLayout>
  );
}
