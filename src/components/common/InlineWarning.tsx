import { AlertTriangle, Info } from "lucide-react";

interface InlineWarningProps {
  children: React.ReactNode;
  tone?: "warning" | "info";
  className?: string;
}

/** Inline guardrail shown inside dialogs/forms when the user is about to do
 * something risky or unusual. Non-blocking — just informs. */
export function InlineWarning({ children, tone = "warning", className = "" }: InlineWarningProps) {
  const Icon = tone === "warning" ? AlertTriangle : Info;
  const styles =
    tone === "warning"
      ? "border-warning/40 bg-warning/10 text-foreground"
      : "border-info/40 bg-info/10 text-foreground";
  return (
    <div className={`flex items-start gap-2 rounded-md border p-2.5 text-xs ${styles} ${className}`}>
      <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}
