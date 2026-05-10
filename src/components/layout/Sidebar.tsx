import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  AlertTriangle,
  PhoneCall,
  Hourglass,
  TrendingDown,
  ClipboardList,
  ScrollText,
  ShieldAlert,
  Trash2,
  BookOpen,
  Menu,
  X,
  ScanLine,
  QrCode,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV: { to: string; label: string; group: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { to: "/", label: "Dashboard", group: "AMCE Microbiology", icon: LayoutDashboard },
  { to: "/critical-actions", label: "Critical Actions", group: "AMCE Microbiology", icon: AlertTriangle },
  { to: "/scan", label: "Scan QR / Barcode", group: "AMCE Microbiology", icon: ScanLine },
  { to: "/qr-labels", label: "QR Labels (Print)", group: "AMCE Microbiology", icon: QrCode },

  { to: "/supply-status", label: "Supply Status", group: "Supply and Procurement", icon: PackageSearch },
  { to: "/purchase-requests", label: "Purchase Requests", group: "Supply and Procurement", icon: ShoppingCart },
  { to: "/section-forecasting", label: "Section Forecasting", group: "Supply and Procurement", icon: TrendingUp },
  { to: "/procurement-followup", label: "Procurement Follow-up", group: "Supply and Procurement", icon: PhoneCall },

  { to: "/inventory-master", label: "Inventory Master", group: "Inventory Control", icon: Boxes },
  { to: "/batch-register", label: "Batch / Lot Register", group: "Inventory Control", icon: Layers },
  { to: "/stock-movements", label: "Stock Movements", group: "Inventory Control", icon: ArrowLeftRight },
  { to: "/expiry-fefo", label: "Expiry and FEFO", group: "Inventory Control", icon: Hourglass },
  { to: "/low-stock-reorder", label: "Low Stock and Reorder", group: "Inventory Control", icon: TrendingDown },

  { to: "/acceptance-testing", label: "Acceptance Testing", group: "Quality and Compliance", icon: ClipboardCheck },
  { to: "/data-quality-review", label: "Data Quality Review", group: "Quality and Compliance", icon: ClipboardList },
  { to: "/audit-trail", label: "Audit Trail", group: "Quality and Compliance", icon: ScrollText },
  { to: "/quarantined-stock", label: "Rejected / Quarantined Stock", group: "Quality and Compliance", icon: ShieldAlert },
  { to: "/expired-wasted-stock", label: "Expired / Wasted Stock", group: "Quality and Compliance", icon: Trash2 },

  { to: "/equipment-register", label: "Equipment Register", group: "Equipment and Assets", icon: Cpu },
  { to: "/durables-register", label: "Durables Register", group: "Equipment and Assets", icon: Hammer },
  { to: "/maintenance-calibration", label: "Maintenance and Calibration", group: "Equipment and Assets", icon: Wrench },

  { to: "/reports", label: "Reports", group: "Oversight", icon: FileBarChart2 },
  { to: "/readiness-audit", label: "Readiness Audit", group: "Oversight", icon: ShieldCheck },
  { to: "/training", label: "Training Guide", group: "Oversight", icon: BookOpen },
  { to: "/settings", label: "Settings", group: "Oversight", icon: SettingsIcon },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const groups = Array.from(new Set(NAV.map((n) => n.group)));
  return (
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
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors",
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
  );
}

function SidebarHeader() {
  return (
    <div className="p-4 border-b border-sidebar-border">
      <div className="text-[11px] uppercase tracking-wider text-sidebar-foreground/60">AMCE Abuja</div>
      <div className="font-semibold leading-tight mt-1">Medical Microbiology Lab Inventory</div>
      <div className="text-xs text-sidebar-foreground/70 mt-0.5">Supply and Stock Management</div>
    </div>
  );
}

function SidebarFooter() {
  return (
    <div className="p-3 border-t border-sidebar-border text-[11px] text-sidebar-foreground/60">
      Department of Medical Microbiology and Immunology
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Auto-close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  return (
    <>
      {/* Mobile top bar with hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-3 py-2 bg-sidebar text-sidebar-foreground border-b border-sidebar-border">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="p-2 rounded-md hover:bg-sidebar-accent"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60 leading-none">AMCE Abuja</div>
          <div className="text-sm font-semibold truncate leading-tight mt-0.5">Med Micro Inventory</div>
        </div>
      </div>
      {/* Spacer so content doesn't slide under fixed mobile bar */}
      <div className="md:hidden h-12 shrink-0" aria-hidden />

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex-col h-screen sticky top-0">
        <SidebarHeader />
        <NavList />
        <SidebarFooter />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <>
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/60"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="md:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col shadow-2xl">
            <div className="flex items-start justify-between gap-2 border-b border-sidebar-border">
              <div className="flex-1 min-w-0">
                <SidebarHeader />
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="m-2 p-2 rounded-md hover:bg-sidebar-accent shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavList onNavigate={() => setOpen(false)} />
            <SidebarFooter />
          </aside>
        </>
      )}
    </>
  );
}
