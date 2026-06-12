import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle } from "lucide-react";

export function StatusBadge({ status }: { status: "pending" | "validated" | "rejected" }) {
  if (status === "pending")
    return (
      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 gap-1">
        <Clock className="h-3 w-3" /> En attente
      </Badge>
    );
  if (status === "validated")
    return (
      <Badge variant="outline" className="bg-success/10 text-success border-success/30 gap-1">
        <CheckCircle2 className="h-3 w-3" /> Validée
      </Badge>
    );
  return (
    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 gap-1">
      <XCircle className="h-3 w-3" /> Rejetée
    </Badge>
  );
}

export function TypeBadge({ type }: { type: "recharge" | "withdrawal" }) {
  return (
    <Badge variant="secondary" className="text-[10px]">
      {type === "recharge" ? "Recharge" : "Retrait"}
    </Badge>
  );
}
