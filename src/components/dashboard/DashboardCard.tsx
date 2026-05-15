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
  const isFilled = tone !== "default";
  const bg =
    tone === "destructive" ? "bg-red-600 border-red-600"
    : tone === "warning" ? "bg-orange-500 border-orange-500"
    : tone === "success" ? "bg-green-600 border-green-600"
    : tone === "info" ? "bg-blue-500 border-blue-500"
    : "bg-card border-border";

  const labelCls = cn(
    "text-[11px] uppercase tracking-wider",
    isFilled ? "text-white/90 font-bold" : "text-muted-foreground"
  );
  const valueCls = cn(
    "text-2xl mt-1 tabular-nums",
    isFilled ? "text-white font-bold" : "font-semibold text-foreground"
  );
  const hintCls = cn(
    "text-[11px] mt-1",
    isFilled ? "text-white/80" : "text-muted-foreground"
  );

  const content = (
    <>
      <div className={labelCls}>{label}</div>
      <div className={valueCls}>{value}</div>
      {hint && <div className={hintCls}>{hint}</div>}
    </>
  );

  const base = cn(
    "border rounded-md px-4 py-3 shadow-sm block",
    bg,
    to && "hover:shadow-md hover:brightness-110 transition-all cursor-pointer"
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
