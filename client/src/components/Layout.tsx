import { ReactNode } from "react";
import Navbar from "./Navbar";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </main>
      <footer className="py-6 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Proxxima Store - Sistema de recompensas
            </p>
            <div className="mt-4 md:mt-0 text-sm text-muted-foreground">
              Desenvolvido para gerenciamento de pontos e produtos
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}