import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { HelpButton } from "@/components/common/HelpButton";
import { Button } from "@/components/ui/button";
import { refreshFromCloud } from "@/lib/cloudSync";
import type { HELP } from "@/lib/helpContent";

interface HeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  helpTopic?: keyof typeof HELP;
}

export function Header({ title, description, actions, helpTopic }: HeaderProps) {
  const [syncing, setSyncing] = useState(false);
  const [syncedAt, setSyncedAt] = useState<Date | null>(null);

  const onSync = async () => {
    setSyncing(true);
    try {
      await refreshFromCloud();
      setSyncedAt(new Date());
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="border-b border-border bg-card">
      <div className="px-6 py-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <Button
            size="sm"
            variant="outline"
            onClick={onSync}
            disabled={syncing}
            title={syncedAt ? `Last synced ${syncedAt.toLocaleTimeString()}` : "Pull latest from cloud"}
            className="print:hidden"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            <span className="ml-1.5 hidden sm:inline">{syncing ? "Syncing…" : "Sync"}</span>
          </Button>
          {helpTopic && <HelpButton topic={helpTopic} />}
        </div>
      </div>
    </div>
  );
}
