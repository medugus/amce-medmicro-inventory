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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AiSparkle } from "@/components/icons/AiSparkle";

const NAV: { to: string; label: string; group: string; icon: React.ComponentType<{ className?: string }>; explain: string }[] = [
  { to: "/", label: "Dashboard", group: "AMCE Microbiology", icon: LayoutDashboard, explain: "Live operational view across supply, inventory, quality and equipment." },
  { to: "/critical-actions", label: "Critical Actions", group: "AMCE Microbiology", icon: AlertTriangle, explain: "One triage list of everything across the system that needs attention now." },
  { to: "/scan", label: "Scan QR / Barcode", group: "AMCE Microbiology", icon: ScanLine, explain: "Scan an item, batch or asset QR/barcode to jump straight to its record." },
  { to: "/qr-labels", label: "QR Labels (Print)", group: "AMCE Microbiology", icon: QrCode, explain: "Print QR labels for items, batches and equipment for shelf and bench tagging." },

  { to: "/supply-status", label: "Supply Status", group: "Supply and Procurement", icon: PackageSearch, explain: "Track open supply requests from sections to stores / procurement." },
  { to: "/purchase-requests", label: "Purchase Requests", group: "Supply and Procurement", icon: ShoppingCart, explain: "Raise and track formal procurement requests to finance / supply chain." },
  { to: "/section-forecasting", label: "Section Forecasting", group: "Supply and Procurement", icon: TrendingUp, explain: "Projected consumption per section to plan quarterly procurement." },
  { to: "/procurement-followup", label: "Procurement Follow-up", group: "Supply and Procurement", icon: PhoneCall, explain: "Chase-list for approved requests not yet delivered." },

  { to: "/inventory-master", label: "Inventory Master", group: "Inventory Control", icon: Boxes, explain: "Catalogue of every reagent, consumable and supply item. Add items here first." },
  { to: "/batch-register", label: "Batch / Lot Register", group: "Inventory Control", icon: Layers, explain: "Every physical batch received, with lot number, expiry and quantity." },
  { to: "/stock-movements", label: "Receive / Stock Movements", group: "Inventory Control", icon: ArrowLeftRight, explain: "Receive new stock and record every issue, return, transfer or adjustment." },
  { to: "/expiry-fefo", label: "Expiry and FEFO", group: "Inventory Control", icon: Hourglass, explain: "First-Expire-First-Out view so soonest-to-expire batches get used first." },
  { to: "/low-stock-reorder", label: "Low Stock and Reorder", group: "Inventory Control", icon: TrendingDown, explain: "Items at or below their reorder level. Raise a Purchase Request from here." },

  { to: "/acceptance-testing", label: "Acceptance Testing", group: "Quality and Compliance", icon: ClipboardCheck, explain: "QC step that releases a received batch into usable stock, or quarantines it." },
  { to: "/data-quality-review", label: "Data Quality Review", group: "Quality and Compliance", icon: ClipboardList, explain: "Records with missing critical fields. Fix them for clean dashboards and audits." },
  { to: "/audit-trail", label: "Audit Trail", group: "Quality and Compliance", icon: ScrollText, explain: "Immutable log of every create / update / delete across the system." },
  { to: "/quarantined-stock", label: "Rejected / Quarantined Stock", group: "Quality and Compliance", icon: ShieldAlert, explain: "Batches blocked from use after failed QC or recall. Decide dispose / return / release." },
  { to: "/expired-wasted-stock", label: "Expired / Wasted Stock", group: "Quality and Compliance", icon: Trash2, explain: "Disposal record for stock that expired, was damaged or was wasted." },

  { to: "/equipment-register", label: "Equipment Register", group: "Equipment and Assets", icon: Cpu, explain: "Capital equipment such as analysers and incubators with serial and location." },
  { to: "/durables-register", label: "Durables Register", group: "Equipment and Assets", icon: Hammer, explain: "Reusable durables such as glassware and instruments tracked by location." },
  { to: "/maintenance-calibration", label: "Maintenance and Calibration", group: "Equipment and Assets", icon: Wrench, explain: "Schedule and log maintenance and calibration on each instrument." },

  { to: "/reports", label: "Reports", group: "Oversight", icon: FileBarChart2, explain: "Exportable summaries for management, finance and regulators." },
  { to: "/readiness-audit", label: "Readiness Audit", group: "Oversight", icon: ShieldCheck, explain: "Pre-inspection checklist showing whether the lab is audit-ready." },
  { to: "/welcome", label: "Welcome / Quick Tour", group: "Oversight", icon: Sparkles, explain: "Quick 2-minute walkthrough of the daily workflow." },
  { to: "/training", label: "Training Guide", group: "Oversight", icon: BookOpen, explain: "Step-by-step training guide for each module." },
  { to: "/settings", label: "Settings", group: "Oversight", icon: SettingsIcon, explain: "User identity, app preferences, and data management." },
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
                    title={`${n.label} — ${n.explain}`}
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
