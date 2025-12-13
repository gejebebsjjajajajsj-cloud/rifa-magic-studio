import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Ticket, 
  Check, 
  Clock, 
  Eye, 
  Edit, 
  Trash2, 
  PlusCircle,
  Search,
  Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface Raffle {
  id: number;
  name: string;
  status: "draft" | "pending" | "published";
  sold: number;
  total: number;
  price: number;
  endDate: string;
}

const MinhasRifas = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "pending" | "draft">("all");

  const raffles: Raffle[] = [
    { id: 1, name: "Rifa do iPhone 15 Pro Max", status: "published", sold: 45, total: 100, price: 15, endDate: "2024-02-15" },
    { id: 2, name: "Kit Maquiagem Completo", status: "pending", sold: 0, total: 50, price: 10, endDate: "2024-02-20" },
    { id: 3, name: "Vale Compras R$500", status: "published", sold: 80, total: 100, price: 8, endDate: "2024-02-10" },
    { id: 4, name: "Airpods Pro 2", status: "draft", sold: 0, total: 80, price: 12, endDate: "2024-03-01" },
    { id: 5, name: "Smart TV 55 polegadas", status: "published", sold: 120, total: 200, price: 20, endDate: "2024-02-25" },
  ];

  const getStatusBadge = (status: Raffle["status"]) => {
    const styles = {
      published: "bg-mint text-foreground",
      pending: "bg-lavender text-foreground",
      draft: "bg-muted text-muted-foreground",
    };
    const labels = {
      published: "Publicada",
      pending: "Pendente",
      draft: "Rascunho",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getStatusIcon = (status: Raffle["status"]) => {
    switch (status) {
      case "published":
        return <Check size={20} className="text-foreground" />;
      case "pending":
        return <Clock size={20} className="text-foreground" />;
      default:
        return <Edit size={20} className="text-muted-foreground" />;
    }
  };

  const filteredRaffles = raffles.filter((raffle) => {
    const matchesSearch = raffle.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || raffle.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Minhas Rifas</h1>
            <p className="text-muted-foreground">Gerencie todas as suas rifas</p>
          </div>
          <Link to="/criar-rifa">
            <Button>
              <PlusCircle size={18} />
              Nova Rifa
            </Button>
          </Link>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3 animate-fade-in stagger-1">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              placeholder="Buscar rifas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12"
            />
          </div>
          <div className="flex gap-2">
            {[
              { key: "all", label: "Todas" },
              { key: "published", label: "Publicadas" },
              { key: "pending", label: "Pendentes" },
              { key: "draft", label: "Rascunhos" },
            ].map((f) => (
              <Button
                key={f.key}
                variant={filter === f.key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f.key as typeof filter)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Raffles List */}
        <div className="space-y-4">
          {filteredRaffles.length === 0 ? (
            <Card className="animate-fade-in">
              <CardContent className="p-12 text-center">
                <Ticket size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Nenhuma rifa encontrada
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? "Tente buscar por outro termo." : "Crie sua primeira rifa agora!"}
                </p>
                <Link to="/criar-rifa">
                  <Button>
                    <PlusCircle size={18} />
                    Criar Rifa
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            filteredRaffles.map((raffle, index) => (
              <Card
                key={raffle.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Icon */}
                    <div
                      className={`h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        raffle.status === "published"
                          ? "bg-mint"
                          : raffle.status === "pending"
                          ? "bg-lavender"
                          : "bg-muted"
                      }`}
                    >
                      {getStatusIcon(raffle.status)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">
                          {raffle.name}
                        </h3>
                        {getStatusBadge(raffle.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          {raffle.sold}/{raffle.total} vendidos
                        </span>
                        <span>R$ {raffle.price.toFixed(2)}/número</span>
                        <span>Encerra: {new Date(raffle.endDate).toLocaleDateString("pt-BR")}</span>
                      </div>
                      {raffle.status === "published" && (
                        <div className="mt-2 w-full max-w-xs">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full gradient-primary transition-all duration-500"
                              style={{ width: `${(raffle.sold / raffle.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <Eye size={16} />
                        <span className="sm:hidden lg:inline">Ver</span>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <Edit size={16} />
                        <span className="sm:hidden lg:inline">Editar</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MinhasRifas;
