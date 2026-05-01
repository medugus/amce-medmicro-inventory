import { useState } from "react";
import { HelpCircle, AlertTriangle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { HELP, type HelpEntry } from "@/lib/helpContent";

interface HelpButtonProps {
  topic: keyof typeof HELP;
  /** Optional override if you want to pass custom content instead of the registry entry. */
  entry?: HelpEntry;
}

export function HelpButton({ topic, entry }: HelpButtonProps) {
  const [open, setOpen] = useState(false);
  const content = entry ?? HELP[topic];
  if (!content) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={`How to use ${content.title}`}
          className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{content.title} — how to use</SheetTitle>
          <SheetDescription>{content.purpose}</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-5 text-sm">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Steps
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-foreground">
              {content.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </section>
          {content.warnings && content.warnings.length > 0 && (
            <section className="rounded-md border border-warning/40 bg-warning/10 p-3">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-warning-foreground mb-2">
                <AlertTriangle className="h-3.5 w-3.5" /> Watch out
              </h3>
              <ul className="list-disc list-inside space-y-1.5 text-foreground">
                {content.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
