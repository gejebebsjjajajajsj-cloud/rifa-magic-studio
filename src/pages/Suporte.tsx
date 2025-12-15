import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MessageCircle, 
  HelpCircle,
  ExternalLink
} from "lucide-react";

const Suporte = () => {
  const whatsappNumber = "5511919367563";
  const whatsappLink = `https://wa.me/${whatsappNumber}`;

  const faqs = [
    {
      question: "Como criar minha primeira rifa?",
      answer: "Clique em 'Criar Rifa' no menu e siga o passo a passo para configurar sua rifa.",
    },
    {
      question: "Qual é o valor da taxa de publicação?",
      answer: "A taxa varia de acordo com a quantidade de números: R$ 97 (até 10mil), R$ 149 (até 50mil) ou R$ 197 (até 100mil).",
    },
    {
      question: "Como recebo os pagamentos das vendas?",
      answer: "Os pagamentos são processados automaticamente via Mercado Pago e vão direto para sua conta.",
    },
    {
      question: "Posso editar uma rifa após publicar?",
      answer: "Sim, você pode editar a descrição e imagens. O número de participantes e preço não podem ser alterados.",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground">Suporte</h1>
          <p className="text-muted-foreground">Como podemos ajudar?</p>
        </div>

        {/* WhatsApp Contact */}
        <Card className="animate-fade-in">
          <CardContent className="p-6">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 bg-green-500/10 hover:bg-green-500/20 rounded-2xl transition-all duration-300"
            >
              <div className="h-14 w-14 bg-green-500 rounded-2xl flex items-center justify-center">
                <MessageCircle size={28} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-lg">WhatsApp</h3>
                <p className="text-muted-foreground">(11) 91936-7563</p>
              </div>
              <ExternalLink size={20} className="text-muted-foreground" />
            </a>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="animate-fade-in stagger-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle size={20} />
              Perguntas Frequentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="p-4 bg-muted/30 rounded-xl"
              >
                <h4 className="font-semibold text-foreground mb-2">{faq.question}</h4>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default Suporte;
