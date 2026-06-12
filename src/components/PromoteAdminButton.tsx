import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { bootstrapFirstAdmin } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Shield, Loader2 } from "lucide-react";

/** Visible uniquement si aucun admin n'existe (vérification serveur via RPC sécurisée). */
export function PromoteAdminButton() {
  const { user, refreshRole, role } = useAuth();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const bootstrap = useServerFn(bootstrapFirstAdmin);

  const { data: noAdmin } = useQuery({
    queryKey: ["any-admin"],
    enabled: !!user,
    queryFn: async () => {
      // bootstrap_first_admin renvoie false si un admin existe déjà ; on évite
      // d'exposer la liste user_roles côté client.
      const { count } = await supabase
        .from("user_roles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "admin");
      return (count ?? 0) === 0;
    },
  });

  if (!noAdmin || role === "admin") return null;

  const promote = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await bootstrap({});
      if (!res.promoted) {
        toast.error("Un administrateur existe déjà");
      } else {
        toast.success("Vous êtes maintenant administrateur");
        await refreshRole();
      }
      qc.invalidateQueries({ queryKey: ["any-admin"] });
    } catch (e: any) {
      toast.error("Impossible de devenir admin", { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
        <Shield className="h-4 w-4" />
        Configuration initiale
      </div>
      <p className="text-xs text-muted-foreground">
        Aucun administrateur n'est encore défini. Vous pouvez devenir le premier admin.
      </p>
      <Button onClick={promote} disabled={loading} size="sm" className="w-full">
        {loading && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
        Devenir administrateur
      </Button>
    </div>
  );
}
