import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Componentes
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Eye } from "lucide-react";

// Layout
import Layout from "@/components/Layout";

// Tipos
type Order = {
  id: number;
  userId: number;
  totalPoints: number;
  status: "pending" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
};

type OrderWithUser = Order & {
  user: {
    id: number;
    username: string;
    displayName: string | null;
    email: string;
  };
};

type OrderItem = {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  pointsCost: number;
  product: {
    id: number;
    name: string;
    description: string;
    imageUrl: string | null;
    pointsCost: number;
  };
};

type OrderDetails = {
  order: Order;
  items: OrderItem[];
};

export default function OrdersPage() {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  // Consulta para obter todos os pedidos
  const { data: orders, isLoading: isOrdersLoading } = useQuery<OrderWithUser[]>({
    queryKey: ["/api/admin/orders"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/orders");
      return await res.json();
    },
  });

  // Consulta para obter detalhes de um pedido específico
  const { data: orderDetails, isLoading: isDetailsLoading } = useQuery<OrderDetails>({
    queryKey: ["/api/admin/orders", selectedOrder],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/orders/${selectedOrder}`);
      return await res.json();
    },
    enabled: selectedOrder !== null,
  });

  // Mutação para atualizar o status do pedido
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/orders/${orderId}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      if (selectedOrder) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/orders", selectedOrder] });
      }
      toast({
        title: "Status atualizado",
        description: "O status do pedido foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handler para visualizar detalhes do pedido
  const handleViewDetails = (orderId: number) => {
    setSelectedOrder(orderId);
    setIsDetailsDialogOpen(true);
  };

  // Handler para alterar o status do pedido
  const handleStatusChange = (orderId: number, status: string) => {
    updateStatusMutation.mutate({ orderId, status });
  };

  // Função auxiliar para formatar o status em português
  const formatStatus = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "completed":
        return "Concluído";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  // Função auxiliar para determinar a variante do badge baseado no status
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "warning";
      case "completed":
        return "success";
      case "cancelled":
        return "destructive";
      default:
        return "default";
    }
  };

  if (isOrdersLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Gerenciar Pedidos</h1>

        {orders && orders.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableCaption>Lista de pedidos realizados</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Total de Pontos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>#{order.id}</TableCell>
                      <TableCell>
                        {order.user.displayName || order.user.username}
                        <div className="text-xs text-muted-foreground">{order.user.email}</div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{order.totalPoints} pts</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(order.status) as any}>
                          {formatStatus(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(order.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Detalhes
                          </Button>
                          <Select
                            defaultValue={order.status}
                            onValueChange={(value) => handleStatusChange(order.id, value)}
                            disabled={updateStatusMutation.isPending}
                          >
                            <SelectTrigger className="w-[120px] h-9">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="completed">Concluído</SelectItem>
                              <SelectItem value="cancelled">Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Nenhum pedido encontrado</CardTitle>
              <CardDescription>
                Ainda não há pedidos registrados no sistema.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>

      {/* Dialog de Detalhes do Pedido */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido #{selectedOrder}</DialogTitle>
            <DialogDescription>
              Informações detalhadas sobre o pedido selecionado.
            </DialogDescription>
          </DialogHeader>

          {isDetailsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : orderDetails ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Data do Pedido</h3>
                  <p>
                    {format(new Date(orderDetails.order.createdAt), "dd/MM/yyyy HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <Badge variant={getStatusVariant(orderDetails.order.status) as any}>
                    {formatStatus(orderDetails.order.status)}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Total de Pontos</h3>
                  <p>{orderDetails.order.totalPoints} pts</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Alterar Status</h3>
                  <Select
                    defaultValue={orderDetails.order.status}
                    onValueChange={(value) => handleStatusChange(orderDetails.order.id, value)}
                    disabled={updateStatusMutation.isPending}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Itens do Pedido</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Pontos (un.)</TableHead>
                      <TableHead>Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderDetails.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.product.name}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {item.product.description}
                          </div>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.pointsCost} pts</TableCell>
                        <TableCell>{item.quantity * item.pointsCost} pts</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Não foi possível carregar os detalhes do pedido.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}