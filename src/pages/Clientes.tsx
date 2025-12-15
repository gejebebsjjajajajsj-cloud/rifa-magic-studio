import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  Search, 
  Mail, 
  Phone,
  Loader2,
  UserCircle,
  Ticket
} from "lucide-react";

interface ClientData {
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  raffle_name: string;
  total_purchases: number;
  total_spent: number;
}

const Clientes = () => {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    const loadClients = async () => {
      if (!user) return;

      try {
        // Get all raffles owned by the user
        const { data: raffles, error: rafflesError } = await supabase
          .from('raffles')
          .select('id, name')
          .eq('user_id', user.id);

        if (rafflesError) throw rafflesError;

        if (!raffles || raffles.length === 0) {
          setClients([]);
          setLoading(false);
          return;
        }

        const raffleIds = raffles.map(r => r.id);
        const raffleMap = Object.fromEntries(raffles.map(r => [r.id, r.name]));

        // Get all purchases for those raffles
        const { data: purchases, error: purchasesError } = await supabase
          .from('raffle_purchases')
          .select('*')
          .in('raffle_id', raffleIds)
          .eq('payment_status', 'confirmed');

        if (purchasesError) throw purchasesError;

        // Aggregate by email
        const clientMap = new Map<string, ClientData>();

        purchases?.forEach(purchase => {
          const existing = clientMap.get(purchase.buyer_email);
          if (existing) {
            existing.total_purchases += purchase.quantity;
            existing.total_spent += Number(purchase.total_amount);
          } else {
            clientMap.set(purchase.buyer_email, {
              buyer_name: purchase.buyer_name,
              buyer_email: purchase.buyer_email,
              buyer_phone: purchase.buyer_phone,
              raffle_name: raffleMap[purchase.raffle_id] || 'Rifa',
              total_purchases: purchase.quantity,
              total_spent: Number(purchase.total_amount),
            });
          }
        });

        setClients(Array.from(clientMap.values()));
      } catch (error) {
        console.error('Error loading clients:', error);
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, [user]);

  const filteredClients = clients.filter(client => 
    client.buyer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.buyer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.buyer_phone && client.buyer_phone.includes(searchTerm))
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Users size={20} />
            Clientes
          </h1>
          <p className="text-xs text-muted-foreground">
            Todos os compradores das suas rifas
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Buscar por nome, email ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-primary">{clients.length}</p>
              <p className="text-xs text-muted-foreground">Total de clientes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-primary">
                R$ {clients.reduce((acc, c) => acc + c.total_spent, 0).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">Total em vendas</p>
            </CardContent>
          </Card>
        </div>

        {/* Client List */}
        {filteredClients.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <UserCircle size={48} className="mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                {clients.length === 0 
                  ? "Nenhum cliente ainda. Quando alguém comprar números das suas rifas, aparecerá aqui!"
                  : "Nenhum cliente encontrado com esse termo de busca."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredClients.map((client, index) => (
              <Card key={index}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {client.buyer_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm text-foreground truncate">
                          {client.buyer_name}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail size={10} />
                          <span className="truncate">{client.buyer_email}</span>
                        </div>
                        {client.buyer_phone && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone size={10} />
                            <span>{client.buyer_phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-primary">
                        R$ {client.total_spent.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                        <Ticket size={10} />
                        {client.total_purchases} números
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Clientes;
