import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Ticket, 
  PlusCircle, 
  CreditCard, 
  Settings, 
  HelpCircle, 
  LogOut,
  Menu,
  X,
  User
} from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Ticket, label: "Minhas Rifas", path: "/rifas" },
  { icon: PlusCircle, label: "Criar Rifa", path: "/criar-rifa" },
  { icon: CreditCard, label: "Pagamentos", path: "/pagamentos" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
  { icon: HelpCircle, label: "Suporte", path: "/suporte" },
];

const bottomNavItems = [
  { icon: LayoutDashboard, label: "Início", path: "/dashboard" },
  { icon: PlusCircle, label: "Criar", path: "/criar-rifa" },
  { icon: Ticket, label: "Rifas", path: "/rifas" },
  { icon: CreditCard, label: "Pagamentos", path: "/pagamentos" },
  { icon: User, label: "Perfil", path: "/configuracoes" },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full w-72 bg-card border-r-2 border-border/50 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="flex items-center justify-between mb-8">
            <Logo />
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={24} />
            </Button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
                  isActive(item.path)
                    ? "gradient-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Logout Button */}
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 font-medium"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen pb-16 sm:pb-20 lg:pb-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-lg border-b-2 border-border/50 px-3 sm:px-4 py-3 sm:py-4 lg:px-8">
          <div className="flex items-center justify-between gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden h-9 w-9 sm:h-10 sm:w-10"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} className="sm:hidden" />
              <Menu size={24} className="hidden sm:block" />
            </Button>
            <div className="lg:hidden">
              <Logo size="sm" />
            </div>
            <div className="hidden lg:block">
              <h2 className="text-lg font-bold text-foreground">
                {menuItems.find(item => isActive(item.path))?.label || "Dashboard"}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm sm:text-base">
                U
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-8">
          {children}
        </main>
      </div>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t-2 border-border/50 z-40 lg:hidden safe-area-bottom">
        <div className="flex items-center justify-around py-1.5 sm:py-2 px-1">
          {bottomNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-0.5 py-1.5 px-2 sm:px-3 rounded-lg sm:rounded-xl transition-all duration-200 min-w-0",
                isActive(item.path)
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon size={20} className={isActive(item.path) ? "animate-bounce-soft" : ""} />
              <span className="text-[10px] sm:text-xs font-medium truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};
