import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function ExportButton() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0}>
            <Button variant="outline" size="sm" disabled className="gap-2">
              <Download className="h-4 w-4" /> Export
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>Export will be enabled after database integration.</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
