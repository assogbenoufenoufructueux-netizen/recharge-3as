import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Loader2, Upload, Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";

const schema = z.object({
  id_1xbet: z.string().trim().min(3, "ID 1XBET invalide").max(30),
  amount: z.coerce.number().min(100, "Montant minimum 100 FCFA").max(10_000_000),
  payment_method_id: z.string().uuid("Choisissez un moyen de paiement"),
  tx_id: z.string().trim().min(3, "ID translation requis").max(80),
});

export const Route = createFileRoute("/_authenticated/recharge")({
  component: RechargePage,
});

function RechargePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const { data: methods } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const { data } = await supabase.from("payment_methods").select("*").eq("active", true).order("name");
      return data ?? [];
    },
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { id_1xbet: "", amount: 0, payment_method_id: "", tx_id: "" },
  });

  const selectedMethod = methods?.find((m) => m.id === form.watch("payment_method_id"));

  const onSubmit = async (values: z.infer<typeof schema>) => {
    if (!user) return;
    setSubmitting(true);

    let proof_url: string | null = null;
    if (file) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("payment-proofs").upload(path, file);
      if (upErr) {
        setSubmitting(false);
        toast.error("Échec du téléversement", { description: upErr.message });
        return;
      }
      proof_url = path;
    }

    const method = methods?.find((m) => m.id === values.payment_method_id);
    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: "recharge",
      id_1xbet: values.id_1xbet,
      amount: values.amount,
      payment_method_id: values.payment_method_id,
      payment_method_label: method?.name ?? "Inconnu",
      tx_id: values.tx_id,
      proof_url,
      status: "pending",
    });

    setSubmitting(false);
    if (error) {
      toast.error("Erreur", { description: error.message });
      return;
    }
    toast.success("Demande envoyée !", { description: "Votre recharge est en attente de validation." });
    navigate({ to: "/historique" });
  };

  return (
    <div className="px-4 py-5 max-w-md mx-auto space-y-4">
      <PageHeader title="Nouvelle recharge" subtitle="Vers votre compte 1XBET" />

      {selectedMethod && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
              <Info className="h-3.5 w-3.5" />
              Code à composer ({selectedMethod.name})
            </div>
            <div className="text-xl font-bold text-foreground tracking-wider">
              *880*41*{selectedMethod.agent_number}*{form.watch("amount") || "montant"}#
            </div>
            <p className="text-xs text-muted-foreground">
              Remplacez "montant" par le montant souhaité, composez le code, puis renseignez l'ID de la transaction ci-dessous.
            </p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Card className="shadow-card">
          <CardContent className="p-4 space-y-4">
            <Field label="ID 1XBET du client" error={form.formState.errors.id_1xbet?.message}>
              <Input inputMode="numeric" placeholder="Ex : 123456789" {...form.register("id_1xbet")} />
            </Field>

            <Field label="Montant (FCFA)" error={form.formState.errors.amount?.message}>
              <Input type="number" inputMode="numeric" placeholder="1000" {...form.register("amount")} />
            </Field>

            <Field label="Moyen de paiement" error={form.formState.errors.payment_method_id?.message}>
              <Select value={form.watch("payment_method_id")} onValueChange={(v) => form.setValue("payment_method_id", v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Choisir un moyen" /></SelectTrigger>
                <SelectContent>
                  {methods?.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="ID de la transaction (preuve)" error={form.formState.errors.tx_id?.message}>
              <Input placeholder="Référence MTN / Moov / Celtiis" {...form.register("tx_id")} />
            </Field>

            <Field label="Capture de la preuve (optionnel)">
              <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input p-4 cursor-pointer hover:border-primary transition-colors">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground text-center">
                  {file ? file.name : "Cliquez pour téléverser une image"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </Field>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-12 bg-gradient-brand font-semibold" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Envoyer la demande
        </Button>
      </form>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
