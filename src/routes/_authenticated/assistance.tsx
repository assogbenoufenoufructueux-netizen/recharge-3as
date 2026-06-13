import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { MessageCircle, Mail, Headphones } from "lucide-react";

export const Route = createFileRoute("/_authenticated/assistance")({
  component: AssistancePage,
});

const WHATSAPP_NUMBER = "2290194989397";
const EMAIL_ADDRESS = "recharge3as@gmail.com";

function AssistancePage() {
  return (
    <div className="px-4 py-5 max-w-md mx-auto space-y-5">
      <PageHeader title="Assistance" subtitle="Contactez-nous en cas de difficulté" back={false} />

      <Card className="bg-gradient-hero text-primary-foreground border-0 shadow-elevated">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Headphones className="h-6 w-6" />
          </div>
          <div>
            <div className="font-bold text-lg">Besoin d'aide ?</div>
            <p className="text-sm opacity-90">Notre équipe est disponible pour vous assister.</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Card className="shadow-card border-border hover:border-primary transition-colors">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-[#25D366]/10 flex items-center justify-center shrink-0">
                <MessageCircle className="h-6 w-6 text-[#25D366]" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-foreground">WhatsApp</div>
                <p className="text-sm text-muted-foreground">+229 01 94 98 93 97</p>
              </div>
              <Button size="sm" variant="outline">Écrire</Button>
            </CardContent>
          </Card>
        </a>

        <a
          href={`mailto:${EMAIL_ADDRESS}`}
          className="block"
        >
          <Card className="shadow-card border-border hover:border-primary transition-colors">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-foreground">Email</div>
                <p className="text-sm text-muted-foreground">{EMAIL_ADDRESS}</p>
              </div>
              <Button size="sm" variant="outline">Envoyer</Button>
            </CardContent>
          </Card>
        </a>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Horaires : Lun–Sam, 08h–20h
      </p>
    </div>
  );
}
