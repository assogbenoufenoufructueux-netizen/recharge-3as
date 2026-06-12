import { Link, useLocation } from "@tanstack/react-router";
import { Home, ArrowDownToLine, ArrowUpFromLine, History, Bell, LogOut, Shield } from "lucide-react";
import { type ReactNode } from "react";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "./NotificationBell";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Accueil", icon: Home },
  { to: "/recharge", label: "Recharge", icon: ArrowDownToLine },
  { to: "/retrait", label: "Retrait", icon: ArrowUpFromLine },
  { to: "/historique", label: "Historique", icon: History },
] as const;

export function MobileLayout({ children }: { children: ReactNode }) {
  const { signOut, role } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 bg-gradient-hero text-primary-foreground pt-safe shadow-elevated">
        <div className="flex items-center justify-between px-4 py-3">
          <Logo />
          <div className="flex items-center gap-1">
            {role === "admin" && (
              <Link to="/admin">
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10">
                  <Shield className="h-5 w-5" />
                </Button>
              </Link>
            )}
            <NotificationBell />
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10" onClick={() => signOut()}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border pb-safe shadow-elevated">
        <div className="grid grid-cols-4 gap-1 px-2 pt-2">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || (to !== "/dashboard" && location.pathname.startsWith(to));
            return (
              <Link key={to} to={to} className="flex flex-col items-center gap-1 py-2 rounded-lg transition-colors">
                <Icon className={cn("h-5 w-5 transition-colors", active ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("text-[11px] font-medium", active ? "text-primary" : "text-muted-foreground")}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
