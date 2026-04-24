import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ClearDatabaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ClearDatabaseDialog({ open, onOpenChange }: ClearDatabaseDialogProps) {
  const [step, setStep] = useState<"initial" | "confirm" | "final">("initial");
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [stats, setStats] = useState<any>(null);

  const getDatabaseStats = trpc.admin.getDatabaseStats.useQuery(undefined, {
    enabled: false,
  });

  const clearDatabase = trpc.admin.clearDatabase.useMutation();

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      // Resetar estado ao abrir
      setStep("initial");
      setConfirmText("");
      setStats(null);
      // Carregar estatísticas
      getDatabaseStats.refetch();
    } else {
      // Resetar ao fechar
      setStep("initial");
      setConfirmText("");
      setStats(null);
    }
    onOpenChange(newOpen);
  };

  const handleFirstConfirm = async () => {
    setLoading(true);
    try {
      const result = await getDatabaseStats.refetch();
      if (result.data) {
        setStats(result.data);
        setStep("confirm");
      }
    } catch (error) {
      toast.error("Erro ao carregar estatísticas do banco");
    } finally {
      setLoading(false);
    }
  };

  const handleSecondConfirm = async () => {
    if (confirmText !== "LIMPAR_TUDO") {
      toast.error("Texto de confirmação incorreto");
      return;
    }

    setLoading(true);
    try {
      const result = await clearDatabase.mutateAsync({
        confirmationToken: "CONFIRM_CLEAR_ALL_DATA",
      });

      if (result.success) {
        toast.success(result.message);
        setStep("final");
        setTimeout(() => {
          handleOpenChange(false);
          // Recarregar página após limpeza
          window.location.reload();
        }, 2000);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao limpar banco de dados");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md">
        {step === "initial" && (
          <>
            <AlertDialogHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <AlertDialogTitle>Limpar Base de Dados</AlertDialogTitle>
              </div>
              <AlertDialogDescription>
                Esta ação é irreversível e deletará TODOS os dados da base de dados (exceto usuários).
              </AlertDialogDescription>
            </AlertDialogHeader>

            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                <strong>Atenção:</strong> Esta operação não pode ser desfeita. Todos os clientes, vendas, 
                produtos, metas, oportunidades e atividades serão deletados permanentemente.
              </AlertDescription>
            </Alert>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleFirstConfirm}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  "Continuar"
                )}
              </Button>
            </AlertDialogFooter>
          </>
        )}

        {step === "confirm" && (
          <>
            <AlertDialogHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <AlertDialogTitle>Confirmação Final</AlertDialogTitle>
              </div>
              <AlertDialogDescription>
                Confirme que deseja limpar a base de dados. Esta é a última oportunidade de cancelar.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4">
              {stats && (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription className="text-sm">
                    <strong>Dados que serão deletados:</strong>
                    <ul className="mt-2 space-y-1 text-xs">
                      {stats.clientsCount > 0 && <li>• {stats.clientsCount} clientes</li>}
                      {stats.representativesCount > 0 && <li>• {stats.representativesCount} representantes</li>}
                      {stats.salesHistoryCount > 0 && <li>• {stats.salesHistoryCount} vendas</li>}
                      {stats.productsCount > 0 && <li>• {stats.productsCount} produtos</li>}
                      {stats.opportunitiesCount > 0 && <li>• {stats.opportunitiesCount} oportunidades</li>}
                      {stats.goalsCount > 0 && <li>• {stats.goalsCount} metas</li>}
                      {stats.activitiesCount > 0 && <li>• {stats.activitiesCount} atividades</li>}
                      {stats.alertsCount > 0 && <li>• {stats.alertsCount} alertas</li>}
                      {stats.aiInsightsCount > 0 && <li>• {stats.aiInsightsCount} insights de IA</li>}
                      <li className="font-semibold text-blue-900 mt-2">
                        Total: {stats.totalRecords} registros
                      </li>
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  Digite <strong>"LIMPAR_TUDO"</strong> para confirmar:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Digite LIMPAR_TUDO"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                  disabled={loading}
                />
              </div>

              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-800 text-xs">
                  Depois de confirmar, a página será recarregada e todos os dados serão deletados.
                </AlertDescription>
              </Alert>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleSecondConfirm}
                disabled={loading || confirmText !== "LIMPAR_TUDO"}
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Limpando...
                  </>
                ) : (
                  "Limpar Base de Dados"
                )}
              </Button>
            </AlertDialogFooter>
          </>
        )}

        {step === "final" && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-green-600">Base de Dados Limpa</AlertDialogTitle>
              <AlertDialogDescription>
                A base de dados foi limpa com sucesso. A página será recarregada em breve.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                ✓ Todos os dados foram deletados com sucesso.
              </AlertDescription>
            </Alert>

            <AlertDialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Fechar</Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
