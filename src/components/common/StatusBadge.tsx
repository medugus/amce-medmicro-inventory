import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "destructive" | "info" | "muted";

const TONE: Record<Tone, string> = {
  neutral: "bg-secondary text-secondary-foreground border-border",
  success: "bg-success/10 text-success border-success/30",
  warning: "bg-warning/15 text-warning-foreground border-warning/40",
  destructive: "bg-destructive/10 text-destructive border-destructive/30",
  info: "bg-info/10 text-info border-info/30",
  muted: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ label, tone = "neutral", className }: { label: string; tone?: Tone; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border whitespace-nowrap",
        TONE[tone],
        className
      )}
    >
      {label}
    </span>
  );
}

export function toneForSupplyStatus(s: string): Tone {
  switch (s) {
    case "Supplied": return "success";
    case "Partially supplied": return "warning";
    case "Ordered": case "Under review": return "info";
    case "Delayed": case "Pending procurement": case "Requires clarification": return "warning";
    case "Not supplied": case "Cancelled": return "destructive";
    default: return "neutral";
  }
}

export function toneForProcurementStatus(s: string): Tone {
  switch (s) {
    case "Delivered": case "Closed": case "Approved": return "success";
    case "Partially delivered": case "Quotation received": case "Ordered": case "Delivery pending": return "info";
    case "Delayed": case "Awaiting approval": case "Awaiting quotation": case "Requires procurement update": return "warning";
    case "Rejected": return "destructive";
    default: return "neutral";
  }
}

export function toneForBatchStatus(s: string): Tone {
  switch (s) {
    case "Accepted": return "success";
    case "Pending acceptance": return "info";
    case "Quarantined": return "warning";
    case "Rejected": case "Expired": case "Discarded": return "destructive";
    case "Consumed": return "muted";
    default: return "neutral";
  }
}

export function toneForCriticality(c: string): Tone {
  switch (c) {
    case "Critical": return "destructive";
    case "High": return "warning";
    case "Medium": return "info";
    case "Low": return "muted";
    default: return "neutral";
  }
}
