import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useServerFn } from "@tanstack/react-start";
import { validateTransaction, rejectTransaction } from "@/lib/admin.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge, TypeBadge } from "@/components/StatusBadge";
import { ChevronLeft, CheckCircle2, XCircle, Loader2, User, Phone, Hash, CreditCard, FileText, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/demandes/$id")({
  component: DemandeDetail,
});

function DemandeDetail() {
  const { id } = useParams({ from: "/_authenticated/admin/demandes/$id" });
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState("");
  const [proofUrl, setProofUrl] = useState<string | null>(null);

  const { data: tx, isLoading } = useQuery({
    queryKey: ["transaction", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*, profiles!transactions_user_id_fkey(full_name, phone)")
        .eq("id", id)
        .single();
      return data as any;
    },
  });

  useEffect(() => {
    if (!tx?.proof_url) return;
    supabase.storage.from("payment-proofs").createSignedUrl(tx.proof_url, 3600).then(({ data }) => {
      setProofUrl(data?.signedUrl ?? null);
    });
  }, [tx?.proof_url]);

  const validateFn = useServerFn(validateTransaction);
  const rejectFn = useServerFn(rejectTransaction);

  const validate = useMutation({
    mutationFn: async () => {
      await validateFn({ data: { id } });
    },
    onSuccess: () => {
      toast.success("Demande validée");
      qc.invalidateQueries({ queryKey: ["admin-transactions"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
      navigate({ to: "/admin/demandes" });
    },
    onError: (e: any) => toast.error("Erreur", { description: e.message }),
  });

  const reject = useMutation({
    mutationFn: async () => {
      if (!reason.trim()) throw new Error("Motif requis");
      await rejectFn({ data: { id, reason: reason.trim() } });
    },
    onSuccess: () => {
      toast.success("Demande rejetée");
      qc.invalidateQueries({ queryKey: ["admin-transactions"] });
      navigate({ to: "/admin/demandes" });
    },
    onError: (e: any) => toast.error("Erreur", { description: e.message }),
  });

  if (isLoading || !tx) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <button onClick={() => navigate({ to: "/admin/demandes" })} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="h-4 w-4" /> Retour
      </button>

      <Card className="shadow-elevated">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <TypeBadge type={tx.type} />
              <StatusBadge status={tx.status} />
            </div>
          </div>
          <div className="text-3xl font-black text-foreground">
            {Number(tx.amount).toLocaleString("fr-FR")} <span className="text-sm font-medium text-muted-foreground">FCFA</span>
          </div>

          <div className="space-y-2 pt-2 border-t border-border">
            <Row icon={User} label="Client" value={tx.profiles?.full_name ?? "—"} />
            <Row icon={Phone} label="Téléphone" value={tx.profiles?.phone ?? "—"} />
            <Row icon={Hash} label="ID 1XBET" value={tx.id_1xbet} mono />
            <Row icon={CreditCard} label="Moyen" value={tx.payment_method_label} />
            {tx.tx_id && <Row icon={FileText} label={tx.type === "recharge" ? "ID translation" : "Code retrait"} value={tx.tx_id} mono />}
            {tx.recipient_number && <Row icon={Phone} label="Numéro réception" value={tx.recipient_number} mono />}
          </div>

          {proofUrl && (
            <div className="pt-2 border-t border-border space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <ImageIcon className="h-3.5 w-3.5" /> Preuve de paiement
              </div>
              <a href={proofUrl} target="_blank" rel="noopener noreferrer">
                <img src={proofUrl} alt="Preuve" className="rounded-lg border border-border max-h-80 w-full object-contain bg-muted" />
              </a>
            </div>
          )}

          {tx.status === "rejected" && tx.rejection_reason && (
            <div className="text-xs text-destructive bg-destructive/5 rounded p-3">
              <span className="font-semibold">Motif rejet : </span>{tx.rejection_reason}
            </div>
          )}
        </CardContent>
      </Card>

      {tx.status === "pending" && !rejectMode && (
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-12 border-destructive text-destructive hover:bg-destructive/10" onClick={() => setRejectMode(true)}>
            <XCircle className="h-4 w-4 mr-2" /> Rejeter
          </Button>
          <Button className="h-12 bg-success text-success-foreground hover:bg-success/90" onClick={() => validate.mutate()} disabled={validate.isPending}>
            {validate.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Valider
          </Button>
        </div>
      )}

      {tx.status === "pending" && rejectMode && (
        <Card className="border-destructive/30">
          <CardContent className="p-4 space-y-3">
            <div className="text-sm font-semibold">Motif du rejet</div>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Expliquez la raison du rejet…" rows={3} />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setRejectMode(false)}>Annuler</Button>
              <Button variant="destructive" onClick={() => reject.mutate()} disabled={reject.isPending || !reason.trim()}>
                {reject.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Confirmer rejet
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({ icon: Icon, label, value, mono }: { icon: typeof User; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 flex items-baseline justify-between gap-2 min-w-0">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`text-sm font-medium text-foreground truncate ${mono ? "font-mono" : ""}`}>{value}</span>
      </div>
    </div>
  );
}
