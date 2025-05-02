import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  ShoppingCart, 
  Menu,
  X, 
  User, 
  LogOut, 
  LayoutDashboard,
  Users,
  Award,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";

export default function Sidebar() {
  const [location, navigate] = useLocation();
  const { user, isAdmin, logoutMutation } = useAuth();
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Função para gerar as iniciais do nome
  const getInitials = () => {
    if (!user?.displayName) return user?.username.charAt(0).toUpperCase() || "U";
    
    const nameParts = user.displayName.split(" ");
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  // Função para realizar logout
  const handleLogout = () => {
    logoutMutation.mutate();
    navigate("/auth");
  };

  // Determinar estilo da barra lateral com base no estado
  const sidebarClass = `
    ${isMobile ? 
      `fixed inset-y-0 left-0 z-50 bg-background border-r transform ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-200 ease-in-out w-64` 
      : 
      `min-h-screen sticky top-0 border-r ${
        isCollapsed ? 'w-20' : 'w-64'
      } transition-all duration-300 ease-in-out`
    }
  `;

  // Se for visão mobile, adicionar botão de menu
  const mobileMenuButton = isMobile && (
    <Button 
      variant="outline" 
      size="icon" 
      className="fixed top-4 left-4 z-40"
      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
    >
      {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </Button>
  );

  // Links do menu com seus ícones e destinos
  const mainMenuItems = [
    {
      href: isAdmin ? "/admin" : "/",
      icon: isAdmin ? <LayoutDashboard className="h-5 w-5" /> : <Package className="h-5 w-5" />,
      label: isAdmin ? "Dashboard" : "Produtos",
      active: location === "/" || (isAdmin && location === "/admin")
    },
    {
      href: "/my-points",
      icon: <Award className="h-5 w-5" />,
      label: "Meus Pontos",
      active: location === "/my-points"
    },
    {
      href: "/my-orders",
      icon: <ShoppingCart className="h-5 w-5" />,
      label: "Meus Pedidos",
      active: location === "/my-orders"
    },
    {
      href: "/account",
      icon: <User className="h-5 w-5" />,
      label: "Meu Perfil",
      active: location === "/account"
    }
  ];

  // Menu de administrador
  const adminMenuItems = isAdmin ? [
    {
      href: "/admin",
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: "Dashboard",
      active: location === "/admin"
    },
    {
      href: "/admin/products",
      icon: <Package className="h-5 w-5" />,
      label: "Gerenciar Produtos",
      active: location === "/admin/products"
    },
    {
      href: "/admin/employees",
      icon: <Users className="h-5 w-5" />,
      label: "Gerenciar Funcionários",
      active: location === "/admin/employees"
    },
    {
      href: "/admin/orders",
      icon: <ShoppingCart className="h-5 w-5" />,
      label: "Gerenciar Pedidos",
      active: location === "/admin/orders"
    }
  ] : [];

  // Renderizar um item do menu
  const renderMenuItem = (item: any, className = "") => (
    <Link href={item.href} key={item.href}>
      <div 
        className={`
          flex items-center py-3 px-4 rounded-md cursor-pointer
          ${item.active ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'}
          ${className}
        `}
        onClick={() => isMobile && setIsMobileMenuOpen(false)}
      >
        <div className={`${isCollapsed ? 'mx-auto' : 'mr-3'} text-secondary`}>
          {item.icon}
        </div>
        {!isCollapsed && <span className="font-medium">{item.label}</span>}
      </div>
    </Link>
  );

  return (
    <>
      {mobileMenuButton}
      <div className={sidebarClass}>
        <div className="flex flex-col h-full">
          {/* Header com logo */}
          <div className={`p-4 ${isCollapsed ? 'items-center justify-center' : ''} flex border-b`}>
            <Link href={isAdmin ? "/admin" : "/"}>
              <div className={`flex ${isCollapsed ? 'justify-center' : 'items-center space-x-2'} cursor-pointer`}>
                <Package className="h-6 w-6 text-secondary" />
                {!isCollapsed && (
                  <span className="font-bold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Proxxima
                  </span>
                )}
              </div>
            </Link>
            {!isMobile && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="ml-auto"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                {isCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
              </Button>
            )}
          </div>

          {/* Perfil do usuário */}
          <div className={`px-4 py-6 border-b ${isCollapsed ? 'text-center' : ''}`}>
            <div className={`${isCollapsed ? 'flex flex-col items-center' : 'flex items-center space-x-3'}`}>
              <Avatar className={`${isCollapsed ? 'mx-auto mb-3' : ''} h-10 w-10`}>
                {user?.profileImageUrl ? (
                  <AvatarImage src={user.profileImageUrl} alt="Foto de perfil" />
                ) : (
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                )}
              </Avatar>
              {!isCollapsed && (
                <div>
                  <p className="font-medium text-sm">{user?.displayName || user?.username}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  {user?.unit && (
                    <p className="text-xs mt-1 bg-muted inline-block px-2 py-0.5 rounded-sm">
                      {user.unit}
                    </p>
                  )}
                  <div className="flex items-center mt-1">
                    <Award className="w-4 h-4 mr-1 text-secondary" />
                    <span className="text-xs font-medium">{user?.points || 0} pontos</span>
                  </div>
                  {isAdmin && <Badge variant="secondary" className="mt-2">Admin</Badge>}
                </div>
              )}
              {isCollapsed && isAdmin && (
                <Badge variant="secondary" className="mt-1">Admin</Badge>
              )}
            </div>
          </div>

          {/* Menu principal */}
          <div className="flex-1 py-4 overflow-y-auto">
            <nav className="space-y-1 px-2">
              {mainMenuItems.filter(item => !(isAdmin && item.href === "/")).map(item => renderMenuItem(item))}
            </nav>

            {/* Menu do administrador */}
            {isAdmin && adminMenuItems.length > 0 && (
              <div className="mt-6">
                <div className={`px-4 mb-2 ${isCollapsed ? 'text-center' : ''}`}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {isCollapsed ? 'ADMIN' : 'ADMINISTRAÇÃO'}
                  </p>
                </div>
                <nav className="space-y-1 px-2">
                  {adminMenuItems.map(item => renderMenuItem(item, "text-primary"))}
                </nav>
              </div>
            )}
          </div>

          {/* Botão de logout */}
          <div className="p-4 border-t">
            <Button 
              variant="ghost" 
              className={`${isCollapsed ? 'justify-center w-full p-2' : 'justify-start w-full'}`}
              onClick={handleLogout}
            >
              <LogOut className={`${isCollapsed ? '' : 'mr-2'} h-5 w-5`} />
              {!isCollapsed && <span>Sair</span>}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}