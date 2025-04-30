import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute, AdminRoute } from "@/lib/protected-route";
import { queryClient } from "@/lib/queryClient";

// Páginas
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import ProductsPage from "@/pages/ProductsPage";
import MyPointsPage from "@/pages/MyPointsPage";
import MyOrdersPage from "@/pages/MyOrdersPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProductsPage from "@/pages/admin/ProductsPage";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="min-h-screen flex flex-col">
            <main className="flex-grow">
              <Switch>
                {/* Rota de autenticação (pública) */}
                <Route path="/auth" component={AuthPage} />
                
                {/* Rotas protegidas (apenas usuários autenticados) */}
                <ProtectedRoute path="/" component={ProductsPage} />
                <ProtectedRoute path="/my-points" component={MyPointsPage} />
                <ProtectedRoute path="/my-orders" component={MyOrdersPage} />
                
                {/* Rotas administrativas (apenas administradores) */}
                <AdminRoute path="/admin" component={AdminDashboard} />
                <AdminRoute path="/admin/products" component={AdminProductsPage} />
                
                {/* Página não encontrada */}
                <Route component={NotFound} />
              </Switch>
            </main>
          </div>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
