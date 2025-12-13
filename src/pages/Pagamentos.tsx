import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Receipt, 
  Check, 
  Clock, 
  Download,
  Calendar,
  TrendingUp
} from "lucide-react";

interface Payment {
  id: number;
  type: "taxa" | "arrecadacao";
  description: string;
  amount: number;
  status: "completed" | "pending";
  date: string;
}

const Pagamentos = () => {
  const payments: Payment[] = [
    { id: 1, type: "taxa", description: "Taxa - Rifa do iPhone 15", amount: 9.90, status: "completed", date: "2024-01-15" },
    { id: 2, type: "taxa", description: "Taxa - Kit Maquiagem", amount: 9.90, status: "pending", date: "2024-01-20" },
    { id: 3, type: "taxa", description: "Taxa - Vale Compras", amount: 9.90, status: "completed", date: "2024-01-10" },
    { id: 4, type: "taxa", description: "Taxa - Smart TV", amount: 9.90, status: "completed", date: "2024-01-25" },
  ];

  const stats = [
    { label: "Total de Taxas Pagas", value: "R$ 29,70", icon: Receipt, color: "gradient-primary" },
    { label: "Taxas Pendentes", value: "R$ 9,90", icon: Clock, color: "bg-lavender" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground">Pagamentos</h1>
          <p className="text-muted-foreground">Histórico de taxas e pagamentos</p>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`h-14 w-14 ${stat.color} rounded-2xl flex items-center justify-center`}>
                    <stat.icon size={24} className="text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payments List */}
        <Card className="animate-fade-in stagger-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt size={20} />
              Histórico de Pagamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payments.map((payment, index) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-xl animate-fade-in"
                  style={{ animationDelay: `${(index + 3) * 0.1}s` }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                        payment.status === "completed" ? "bg-mint" : "bg-lavender"
                      }`}
                    >
                      {payment.status === "completed" ? (
                        <Check size={18} className="text-foreground" />
                      ) : (
                        <Clock size={18} className="text-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{payment.description}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar size={14} />
                        <span>{new Date(payment.date).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">
                      R$ {payment.amount.toFixed(2)}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        payment.status === "completed"
                          ? "bg-mint text-foreground"
                          : "bg-lavender text-foreground"
                      }`}
                    >
                      {payment.status === "completed" ? "Pago" : "Pendente"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Pagamentos;
