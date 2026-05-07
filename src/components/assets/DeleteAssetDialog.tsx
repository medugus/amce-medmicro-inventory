import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function DeleteAssetDialog<T extends { id: string }>({
  asset,
  label,
  description,
  onClose,
  onDelete,
}: {
  asset: T | null;
  label: string;
  description: string;
  onClose: () => void;
  onDelete: (id: string, reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");

  async function confirm() {
    if (!asset) return;
    try {
      await onDelete(asset.id, reason);
      toast.success(`${label} deleted.`);
      setReason("");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    }
  }

  return (
    <AlertDialog open={!!asset} onOpenChange={(o) => { if (!o) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {label}?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div>
          <Label>Reason (audit trail)</Label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
