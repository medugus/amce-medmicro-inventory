import { HelpButton } from "@/components/common/HelpButton";
import type { HELP } from "@/lib/helpContent";

interface HeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  helpTopic?: keyof typeof HELP;
}

export function Header({ title, description, actions, helpTopic }: HeaderProps) {
  return (
    <div className="border-b border-border bg-card">
      <div className="px-6 py-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {helpTopic && <HelpButton topic={helpTopic} />}
        </div>
      </div>
    </div>
  );
}
