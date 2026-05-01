import { cn } from "@/lib/utils";

export function DashboardCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "default" | "warning" | "destructive" | "success" | "info";
}) {
  const accent =
    tone === "destructive" ? "border-l-destructive"
    : tone === "warning" ? "border-l-warning"
    : tone === "success" ? "border-l-success"
    : tone === "info" ? "border-l-info"
    : "border-l-primary";
  return (
    <div className={cn("bg-card border border-border border-l-4 rounded-md px-4 py-3 shadow-sm", accent)}>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold text-foreground mt-1 tabular-nums">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}
