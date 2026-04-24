import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  Users,
  Building2,
  Target,
  TrendingUp,
  Bell,
  Map,
  FileText,
  Zap,
  Upload,
  Settings,
  MessageSquare,
  Brain,
  Clock,
  Loader2,
  Briefcase,
} from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

const modules = [
  {
    title: "Dashboard",
    description: "Visão geral com KPIs",
    icon: BarChart3,
    path: "/dashboard",
    color: "bg-blue-500",
  },
  {
    title: "Representantes",
    description: "Gestão de equipe",
    icon: Users,
    path: "/representatives",
    color: "bg-green-500",
  },
  {
    title: "Clientes",
    description: "Carteira de negócios",
    icon: Building2,
    path: "/clients",
    color: "bg-purple-500",
  },
  {
    title: "Oportunidades",
    description: "Pipeline com drag-and-drop",
    icon: TrendingUp,
    path: "/opportunities",
    color: "bg-orange-500",
  },
  {
    title: "Metas",
    description: "Acompanhamento de targets",
    icon: Target,
    path: "/goals",
    color: "bg-red-500",
  },
  {
    title: "Atividades",
    description: "Timeline de interações",
    icon: Clock,
    path: "/activities",
    color: "bg-yellow-500",
  },
  {
    title: "Relatórios",
    description: "Análises e gráficos",
    icon: FileText,
    path: "/reports",
    color: "bg-indigo-500",
  },
  {
    title: "IA Insights",
    description: "Recomendações automáticas",
    icon: Brain,
    path: "/ai-insights",
    color: "bg-pink-500",
  },
  {
    title: "Registro Rápido",
    description: "Formulário mobile",
    icon: MessageSquare,
    path: "/quick-activity",
    color: "bg-cyan-500",
  },
  {
    title: "Mapa Geográfico",
    description: "Visualização de clientes",
    icon: Map,
    path: "/geographic-map",
    color: "bg-emerald-500",
  },
  {
    title: "Alertas Email",
    description: "Configuração de notificações",
    icon: Bell,
    path: "/email-alerts",
    color: "bg-rose-500",
  },
  {
    title: "Notificações",
    description: "Centro com histórico",
    icon: Bell,
    path: "/notification-center",
    color: "bg-violet-500",
  },
  {
    title: "Preferências",
    description: "Cadastro de telefone",
    icon: Settings,
    path: "/notification-preferences",
    color: "bg-slate-500",
  },
  {
    title: "Importar Dados",
    description: "Upload Excel/Protheus",
    icon: Upload,
    path: "/data-import",
    color: "bg-lime-500",
  },
  {
    title: "Analytics Avançada",
    description: "Forecast e análises",
    icon: BarChart3,
    path: "/advanced-analytics",
    color: "bg-teal-500",
  },
  {
    title: "Automações",
    description: "Construtor de workflows",
    icon: Zap,
    path: "/workflow-builder",
    color: "bg-amber-500",
  },
];

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
        <div className="max-w-2xl text-center animate-slide-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            AgroGestão CRM
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Plataforma elegante de gestão comercial para agronegócio
          </p>
          <div className="flex flex-col gap-4 items-center">
            <a href={getLoginUrl()} className="w-full">
              <Button size="lg" className="bg-primary hover:bg-primary/90 w-full">
                Acessar Plataforma
              </Button>
            </a>
            <a href="https://help.manus.im" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Esqueci a Senha
              </Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              Bem-vindo, {user?.name}!
            </h1>
            <p className="text-white/90">
              Plataforma de Gestão Regional - Agronegócio
            </p>
          </div>
          <Button variant="outline" onClick={logout} className="bg-white/20 hover:bg-white/30 text-white border-white/30">
            Sair
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Modules Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Módulos Disponíveis ({modules.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <Card
                  key={module.path}
                  className="hover:shadow-lg transition-all cursor-pointer hover:border-primary group"
                  onClick={() => navigate(module.path)}
                >
                  <CardHeader>
                    <div className={`${module.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-base">{module.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {module.description}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(module.path);
                      }}
                    >
                      Acessar →
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                className="bg-primary hover:bg-primary/90 h-12"
                onClick={() => navigate("/representatives")}
              >
                + Novo Representante
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90 h-12"
                onClick={() => navigate("/clients")}
              >
                + Novo Cliente
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90 h-12"
                onClick={() => navigate("/opportunities")}
              >
                + Nova Oportunidade
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
