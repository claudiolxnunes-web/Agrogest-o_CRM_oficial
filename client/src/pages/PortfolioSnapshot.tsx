import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Download, FileText, TrendingUp, Users, MapPin, Package } from "lucide-react";

export default function PortfolioSnapshot() {
  const { data: clients } = trpc.clients.getAll.useQuery();
  const { data: orders } = trpc.orders.getAll.useQuery();
  const { data: representatives } = trpc.representatives.getAll.useQuery();

  // Processar dados para o snapshot
  const activeClients = clients?.filter(c => c.isActive).length || 0;
  const totalOrdersValue = orders?.reduce((acc, o) => acc + parseFloat(o.totalValue.toString()), 0) || 0;
  
  // Clientes por região
  const regionData = clients?.reduce((acc: any, client) => {
    const region = client.region || "Outros";
    acc[region] = (acc[region] || 0) + 1;
    return acc;
  }, {});

  const regionChartData = Object.entries(regionData || {}).map(([name, value]) => ({ name, value }));

  // Status dos pedidos
  const statusData = orders?.reduce((acc: any, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  const statusChartData = Object.entries(statusData || {}).map(([name, value]) => ({ name, value }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Snapshot da Carteira</h1>
            <p className="text-gray-600 mt-1">Visão consolidada e métricas de desempenho da carteira</p>
          </div>
          <Button className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar PDF
          </Button>
        </div>

        {/* Resumo Executivo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-blue-100 text-sm">Clientes Ativos</p>
                  <p className="text-3xl font-bold">{activeClients}</p>
                </div>
                <Users className="w-8 h-8 text-blue-200 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-green-100 text-sm">Valor em Carteira</p>
                  <p className="text-3xl font-bold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(totalOrdersValue)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-200 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-purple-100 text-sm">Representantes</p>
                  <p className="text-3xl font-bold">{representatives?.length || 0}</p>
                </div>
                <MapPin className="w-8 h-8 text-purple-200 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-orange-100 text-sm">Pedidos Totais</p>
                  <p className="text-3xl font-bold">{orders?.length || 0}</p>
                </div>
                <Package className="w-8 h-8 text-orange-200 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Distribuição Regional */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Região</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status dos Pedidos */}
          <Card>
            <CardHeader>
              <CardTitle>Status dos Pedidos</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-4">
                {statusChartData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-xs text-gray-600 capitalize">{entry.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Representantes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Desempenho por Representante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Representante</TableHead>
                  <TableHead>Região</TableHead>
                  <TableHead>Clientes</TableHead>
                  <TableHead>Vendas (Total)</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {representatives?.slice(0, 5).map((rep) => (
                  <TableRow key={rep.id}>
                    <TableCell className="font-medium">{rep.name}</TableCell>
                    <TableCell>{rep.region}</TableCell>
                    <TableCell>{rep.activeClients}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(rep.totalSales?.toString() || "0"))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={rep.isActive ? "default" : "secondary"}>
                        {rep.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
