import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

export function DashboardCard({
  label,
  value,
  hint,
  tone = "default",
  to,
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "default" | "warning" | "destructive" | "success" | "info";
  to?: string;
}) {
  const accent =
    tone === "destructive" ? "border-l-destructive"
    : tone === "warning" ? "border-l-warning"
    : tone === "success" ? "border-l-success"
    : tone === "info" ? "border-l-info"
    : "border-l-primary";
  const content = (
    <>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold text-foreground mt-1 tabular-nums">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
    </>
  );
  const base = cn(
    "bg-card border border-border border-l-4 rounded-md px-4 py-3 shadow-sm block",
    accent,
    to && "hover:shadow-md hover:bg-accent/30 transition-all cursor-pointer"
  );
  const ariaLabel = `${label}: ${value}${hint ? `. ${hint}` : ""}`;
  if (to) {
    return (
      <Link to={to} className={base} aria-label={ariaLabel}>
        {content}
      </Link>
    );
  }
  return (
    <div className={base} role="group" aria-label={ariaLabel}>
      {content}
    </div>
  );
}
