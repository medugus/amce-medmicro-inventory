import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PrintButtonProps {
  label?: string;
}

export function PrintButton({ label = "Print" }: PrintButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => window.print()}
      className="print:hidden"
    >
      <Printer className="mr-1.5 h-4 w-4" />
      {label}
    </Button>
  );
}
