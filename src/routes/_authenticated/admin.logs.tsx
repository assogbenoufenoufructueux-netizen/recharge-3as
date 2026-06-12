import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/admin/logs")({
  component: LogsPage,
});

function LogsPage() {
  const { data } = useQuery({
    queryKey: ["admin-logs"],
    queryFn: async () => {
      const { data } = await supabase.from("admin_logs").select("*").order("created_at", { ascending: false }).limit(200);
      return data ?? [];
    },
  });

  const labels: Record<string, string> = {
    validate_transaction: "Validation",
    reject_transaction: "Rejet",
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-2">
      {(!data || data.length === 0) && <p className="text-center text-sm text-muted-foreground py-10">Aucun log</p>}
      {data?.map((l) => (
        <Card key={l.id} className="shadow-card">
          <CardContent className="p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{labels[l.action] ?? l.action}</span>
              <span className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(l.created_at), { locale: fr, addSuffix: true })}
              </span>
            </div>
            {l.details && (
              <div className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
                {JSON.stringify(l.details)}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
