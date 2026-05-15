import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

export function DashboardCard({
  label,
  value,
  hint,
  tone = "default",
  to,
  explain,
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "default" | "warning" | "destructive" | "success" | "info";
  to?: string;
  /** Plain-language tooltip explaining what this card means and what to do. */
  explain?: string;
}) {
  const accent =
    tone === "destructive" ? "border-l-destructive"
    : tone === "warning" ? "border-l-warning"
    : tone === "success" ? "border-l-success"
    : tone === "info" ? "border-l-info"
    : "border-l-primary";
  const tint =
    tone === "destructive" ? "bg-destructive/10 dark:bg-destructive/20"
    : tone === "warning" ? "bg-warning/10 dark:bg-warning/20"
    : tone === "success" ? "bg-success/10 dark:bg-success/20"
    : tone === "info" ? "bg-info/10 dark:bg-info/20"
    : "";
  const content = (
    <>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold text-foreground mt-1 tabular-nums">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
    </>
  );
  const base = cn(
    "border border-border border-l-4 rounded-md px-4 py-3 shadow-sm block",
    tint || "bg-card",
    accent,
    to && "hover:shadow-md hover:bg-accent/30 transition-all cursor-pointer"
  );
  const ariaLabel = `${label}: ${value}${hint ? `. ${hint}` : ""}`;
  const titleAttr = explain ? `${label} — ${explain}` : undefined;
  if (to) {
    return (
      <Link to={to} className={base} aria-label={ariaLabel} title={titleAttr}>
        {content}
      </Link>
    );
  }
  return (
    <div className={base} role="group" aria-label={ariaLabel} title={titleAttr}>
      {content}
    </div>
  );
}
