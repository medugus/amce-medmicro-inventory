import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  PackageSearch,
  Boxes,
  Layers,
  ArrowLeftRight,
  ClipboardCheck,
  ShoppingCart,
  TrendingUp,
  Cpu,
  Wrench,
  Hammer,
  FileBarChart2,
  ShieldCheck,
  Settings as SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV: { to: string; label: string; group: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { to: "/", label: "Dashboard", group: "Overview", icon: LayoutDashboard },
  { to: "/supply-status", label: "Supply Status", group: "Procurement", icon: PackageSearch },
  { to: "/purchase-requests", label: "Purchase Requests", group: "Procurement", icon: ShoppingCart },
  { to: "/section-forecasting", label: "Section Forecasting", group: "Procurement", icon: TrendingUp },
  { to: "/inventory-master", label: "Inventory Master", group: "Inventory", icon: Boxes },
  { to: "/batch-register", label: "Batch / Lot Register", group: "Inventory", icon: Layers },
  { to: "/stock-movements", label: "Stock Movements", group: "Inventory", icon: ArrowLeftRight },
  { to: "/acceptance-testing", label: "Acceptance Testing", group: "Quality", icon: ClipboardCheck },
  { to: "/equipment-register", label: "Equipment Register", group: "Assets", icon: Cpu },
  { to: "/durables-register", label: "Durables Register", group: "Assets", icon: Hammer },
  { to: "/maintenance-calibration", label: "Maintenance & Calibration", group: "Assets", icon: Wrench },
  { to: "/reports", label: "Reports", group: "Oversight", icon: FileBarChart2 },
  { to: "/readiness-audit", label: "Readiness Audit", group: "Oversight", icon: ShieldCheck },
  { to: "/settings", label: "Settings", group: "Oversight", icon: SettingsIcon },
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const groups = Array.from(new Set(NAV.map((n) => n.group)));

  return (
    <aside className="w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-sidebar-border">
        <div className="text-[11px] uppercase tracking-wider text-sidebar-foreground/60">AMCE Abuja</div>
        <div className="font-semibold leading-tight mt-1">Microbiology Inventory</div>
        <div className="text-xs text-sidebar-foreground/70 mt-0.5">Supply &amp; Stock Management</div>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-4">
        {groups.map((g) => (
          <div key={g}>
            <div className="px-2 pb-1 text-[10px] uppercase tracking-wider text-sidebar-foreground/50">{g}</div>
            <ul className="space-y-0.5">
              {NAV.filter((n) => n.group === g).map((n) => {
                const active = pathname === n.to;
                const Icon = n.icon;
                return (
                  <li key={n.to}>
                    <Link
                      to={n.to}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{n.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-sidebar-border text-[11px] text-sidebar-foreground/60">
        Department of Medical Microbiology &amp; Immunology
      </div>
    </aside>
  );
}
