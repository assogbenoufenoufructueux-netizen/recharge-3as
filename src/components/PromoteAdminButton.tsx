import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shield, Loader2 } from "lucide-react";

/** Visible uniquement si aucun admin n'existe : permet au premier compte de devenir administrateur. */
export function PromoteAdminButton() {
  const { user, refreshRole, role } = useAuth();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);

  const { data: noAdmin } = useQuery({
    queryKey: ["any-admin"],
    queryFn: async () => {
      const { count } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");
      return (count ?? 0) === 0;
    },
  });

  if (!noAdmin || role === "admin") return null;

  const promote = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("user_roles").insert({ user_id: user.id, role: "admin" });
    setLoading(false);
    if (error) {
      toast.error("Impossible de devenir admin", { description: error.message });
      return;
    }
    toast.success("Vous êtes maintenant administrateur");
    await refreshRole();
    qc.invalidateQueries({ queryKey: ["any-admin"] });
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
