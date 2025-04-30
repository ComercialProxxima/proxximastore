import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/Layout";
import { Product } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShoppingCart, Tag, Package } from "lucide-react";

export default function ProductsPage() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Buscar produtos
  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Função para abrir o modal de compra
  const openPurchaseDialog = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setIsDialogOpen(true);
  };

  // Função para calcular o custo total
  const calculateTotalCost = () => {
    if (!selectedProduct) return 0;
    return selectedProduct.pointsCost * quantity;
  };

  // Verificar se o usuário tem pontos suficientes
  const hasEnoughPoints = () => {
    if (!user || !selectedProduct) return false;
    return user.points >= calculateTotalCost();
  };

  // Função para realizar a compra
  const handlePurchase = async () => {
    if (!selectedProduct) return;

    setIsProcessing(true);

    try {
      const response = await fetch("/api/protected/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              productId: selectedProduct.id,
              quantity,
            },
          ],
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setIsDialogOpen(false);
        // Redirecionar para a página de detalhes do pedido
        navigate(`/my-orders/${result.order.id}`);
      } else {
        const error = await response.json();
        throw new Error(error.message || "Erro ao processar pedido");
      }
    } catch (error) {
      console.error("Erro ao realizar a compra:", error);
      // Em uma aplicação real, mostraríamos o erro para o usuário
    } finally {
      setIsProcessing(false);
    }
  };

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
          <h2 className="text-lg font-medium">Erro ao carregar produtos</h2>
          <p className="text-muted-foreground mt-2">
            Ocorreu um erro ao carregar a lista de produtos. Por favor, tente novamente mais tarde.
          </p>
        </div>
      </Layout>
    );
  }

  // Renderizar lista vazia
  if (!products || products.length === 0) {
    return (
      <Layout>
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-medium">Nenhum produto disponível</h2>
          <p className="mt-2 text-muted-foreground">
            Ainda não há produtos disponíveis para troca por pontos.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Produtos Disponíveis</h1>
          <p className="text-muted-foreground">
            Troque seus pontos ({user?.points || 0} disponíveis) por produtos exclusivos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products
          .filter(product => product.isActive)
          .map((product) => (
            <Card key={product.id} className="overflow-hidden flex flex-col h-full">
              <div className="aspect-square relative bg-muted">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                <Badge 
                  className="absolute top-2 right-2 font-medium" 
                  variant="secondary"
                >
                  <Tag className="h-3.5 w-3.5 mr-1" />
                  {product.pointsCost} pontos
                </Badge>
              </div>
              <CardHeader className="pb-2">
                <CardTitle>{product.name}</CardTitle>
              </CardHeader>
              <CardContent className="pb-2 flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {product.description || 'Sem descrição disponível'}
                </p>
                {product.stock <= 5 && product.stock > 0 && (
                  <Badge variant="outline" className="mt-2 bg-amber-100 text-amber-800 border-amber-200">
                    Apenas {product.stock} em estoque
                  </Badge>
                )}
                {product.stock === 0 && (
                  <Badge variant="outline" className="mt-2 bg-red-100 text-red-800 border-red-200">
                    Esgotado
                  </Badge>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => openPurchaseDialog(product)}
                  disabled={product.stock === 0 || (user?.points || 0) < product.pointsCost}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Trocar por Pontos
                </Button>
              </CardFooter>
            </Card>
          ))}
      </div>

      {/* Modal de confirmação de compra */}
      {selectedProduct && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Troca</DialogTitle>
              <DialogDescription>
                Você está trocando seus pontos pelo seguinte produto:
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="md:w-1/3 bg-muted rounded-md overflow-hidden aspect-square flex items-center justify-center">
                  {selectedProduct.imageUrl ? (
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <Package className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <div className="md:w-2/3">
                  <h3 className="font-medium">{selectedProduct.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedProduct.description || 'Sem descrição disponível'}
                  </p>
                  <div className="mt-2">
                    <Badge variant="outline" className="bg-primary/10">
                      {selectedProduct.pointsCost} pontos por unidade
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="quantity">Quantidade</Label>
                <div className="flex items-center mt-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={selectedProduct.stock}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-16 mx-2 text-center"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(selectedProduct.stock, quantity + 1))}
                    disabled={quantity >= selectedProduct.stock}
                  >
                    +
                  </Button>
                </div>
              </div>
              <div className="bg-muted p-3 rounded-md mt-2">
                <div className="flex justify-between text-sm">
                  <span>Pontos atuais:</span>
                  <span>{user?.points || 0} pontos</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span>Custo total:</span>
                  <span>{calculateTotalCost()} pontos</span>
                </div>
                <div className="flex justify-between font-medium mt-2">
                  <span>Pontos restantes:</span>
                  <span>{(user?.points || 0) - calculateTotalCost()} pontos</span>
                </div>
              </div>
              {!hasEnoughPoints() && (
                <div className="text-red-500 text-sm">
                  Você não tem pontos suficientes para esta troca.
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handlePurchase} 
                disabled={!hasEnoughPoints() || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Confirmar Troca"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  );
}