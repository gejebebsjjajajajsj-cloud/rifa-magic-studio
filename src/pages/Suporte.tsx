import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageCircle, 
  Mail, 
  Phone, 
  HelpCircle,
  Send,
  ExternalLink
} from "lucide-react";

const Suporte = () => {
  const faqs = [
    {
      question: "Como criar minha primeira rifa?",
      answer: "Clique em 'Criar Rifa' no menu e siga o passo a passo para configurar sua rifa.",
    },
    {
      question: "Qual é o valor da taxa de publicação?",
      answer: "A taxa de publicação é de R$ 9,90 por rifa, paga uma única vez no momento da publicação.",
    },
    {
      question: "Como recebo os pagamentos das vendas?",
      answer: "Os pagamentos são feitos diretamente na sua chave Pix cadastrada, sem intermediários.",
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

        {/* Contact Options */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: MessageCircle, label: "Chat", description: "Fale conosco", color: "gradient-primary" },
            { icon: Mail, label: "Email", description: "suporte@rifafacil.com", color: "bg-lavender" },
            { icon: Phone, label: "WhatsApp", description: "(11) 99999-9999", color: "bg-mint" },
          ].map((contact, index) => (
            <Card
              key={index}
              className="cursor-pointer hover:shadow-glow transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6 text-center">
                <div className={`h-14 w-14 ${contact.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <contact.icon size={24} className="text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{contact.label}</h3>
                <p className="text-sm text-muted-foreground">{contact.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

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

        {/* Contact Form */}
        <Card className="animate-fade-in stagger-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send size={20} />
              Enviar Mensagem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Assunto</label>
              <Input placeholder="Qual é o assunto?" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Mensagem</label>
              <Textarea
                placeholder="Descreva sua dúvida ou problema..."
                rows={5}
                className="rounded-xl border-2 resize-none"
              />
            </div>

            <Button>
              <Send size={18} />
              Enviar mensagem
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Suporte;
