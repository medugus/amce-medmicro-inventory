import { Inbox } from "lucide-react";

export function EmptyState({
  title = "No records match the current filters.",
  description,
  icon: Icon = Inbox,
  action,
}: {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 border border-dashed border-border rounded-md bg-muted/30">
      <Icon className="h-8 w-8 text-muted-foreground mb-3" />
      <div className="text-sm font-medium text-foreground">{title}</div>
      {description && <div className="text-xs text-muted-foreground mt-1 max-w-md">{description}</div>}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
