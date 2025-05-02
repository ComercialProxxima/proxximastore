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
import { Loader2, ShoppingCart, Tag, Package } from "lucide-react";

export default function ProductsPage() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  // Não precisamos mais desses estados já que usamos a página de checkout

  // Buscar produtos
  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Função para redirecionar para a página de checkout
  const openPurchaseDialog = (product: Product) => {
    navigate(`/checkout/${product.id}`);
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
    </Layout>
  );
}