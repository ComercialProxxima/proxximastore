import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/Layout";
import { PointTransaction } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, TrendingUp, TrendingDown, Award } from "lucide-react";

export default function MyPointsPage() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [transactionType, setTransactionType] = useState<string>("all");

  // Buscar histórico de pontos
  const { data: transactions, isLoading, error } = useQuery<PointTransaction[]>({
    queryKey: ["/api/protected/points/history"],
  });

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Filtrar transações por tipo
  const filteredTransactions = transactions
    ? transactions.filter((transaction) =>
        transactionType === "all"
          ? true
          : transaction.transactionType === transactionType
      )
    : [];

  // Calcular estatísticas
  const calculateStats = () => {
    if (!transactions) return { earned: 0, spent: 0, adjusted: 0 };

    return transactions.reduce(
      (acc, transaction) => {
        if (transaction.transactionType === "earned") {
          acc.earned += transaction.points;
        } else if (transaction.transactionType === "spent") {
          acc.spent += Math.abs(transaction.points);
        } else if (transaction.transactionType === "adjusted") {
          acc.adjusted += transaction.points;
        }
        return acc;
      },
      { earned: 0, spent: 0, adjusted: 0 }
    );
  };

  const stats = calculateStats();

  // Renderizar estado de carregamento
  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Renderizar estado de erro
  if (error) {
    return (
      <Layout>
        <div className="text-center">
          <h2 className="text-lg font-medium">Erro ao carregar histórico de pontos</h2>
          <p className="text-muted-foreground mt-2">
            Ocorreu um erro ao carregar seu histórico de pontos. Por favor, tente novamente mais tarde.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Meus Pontos</h1>
        <p className="text-muted-foreground">
          Visualize seu saldo de pontos e histórico de transações
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card de saldo atual */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-primary">Saldo Atual</CardTitle>
            <CardDescription>Seus pontos disponíveis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end">
              <span className="text-3xl font-bold text-primary">{user?.points || 0}</span>
              <span className="text-muted-foreground ml-2 mb-1">pontos</span>
            </div>
          </CardContent>
        </Card>

        {/* Card de pontos ganhos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-secondary">Total Ganho</CardTitle>
            <CardDescription>Pontos acumulados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end">
              <span className="text-3xl font-bold text-secondary">{stats.earned}</span>
              <span className="text-muted-foreground ml-2 mb-1">pontos</span>
            </div>
          </CardContent>
        </Card>

        {/* Card de pontos gastos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-primary">Total Gasto</CardTitle>
            <CardDescription>Pontos utilizados em trocas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end">
              <span className="text-3xl font-bold text-primary">{stats.spent}</span>
              <span className="text-muted-foreground ml-2 mb-1">pontos</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-medium bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Histórico de Transações</h2>
          <div className="w-full sm:w-48">
            <Select
              value={transactionType}
              onValueChange={setTransactionType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="earned">Pontos ganhos</SelectItem>
                <SelectItem value="spent">Pontos gastos</SelectItem>
                <SelectItem value="adjusted">Ajustes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center">
            <Award className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Nenhuma transação encontrada</h3>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
              {transactionType === "all"
                ? "Você ainda não possui nenhum histórico de pontos."
                : `Você ainda não possui nenhuma transação do tipo selecionado.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Pontos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(transaction.createdAt.toString())}
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>
                      {transaction.transactionType === "earned" && (
                        <Badge className="bg-opacity-10 bg-secondary text-secondary hover:bg-opacity-20">
                          <TrendingUp className="h-3.5 w-3.5 mr-1" />
                          Recebido
                        </Badge>
                      )}
                      {transaction.transactionType === "spent" && (
                        <Badge className="bg-opacity-10 bg-primary text-primary hover:bg-opacity-20">
                          <TrendingDown className="h-3.5 w-3.5 mr-1" />
                          Gasto
                        </Badge>
                      )}
                      {transaction.transactionType === "adjusted" && (
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                          Ajuste
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span
                        className={
                          transaction.points > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {transaction.points > 0 ? "+" : ""}
                        {transaction.points}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Layout>
  );
}