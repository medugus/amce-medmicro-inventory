import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/currentUser";
import { UserCircle2, ChevronDown, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function UserPicker() {
  const { user, setUser, users } = useCurrentUser();
  const [pickerOpen, setPickerOpen] = useState(false);

  // Force-pick on first load if no user is selected.
  useEffect(() => {
    if (!user) setPickerOpen(true);
  }, [user]);

  // Listen for action layers requesting the picker (AuthRequiredError).
  useEffect(() => {
    function open() { setPickerOpen(true); }
    window.addEventListener("amce:request-user-picker", open);
    return () => window.removeEventListener("amce:request-user-picker", open);
  }, []);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
          >
            <UserCircle2 className="h-4 w-4 text-muted-foreground" />
            <span className="max-w-[10rem] truncate">
              {user ? user.name : "Select user…"}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Signed in as
          </DropdownMenuLabel>
          <DropdownMenuLabel className="pb-2">
            {user ? (
              <div>
                <div className="text-sm font-semibold">{user.name}</div>
                <div className="text-xs font-normal text-muted-foreground">{user.role}</div>
              </div>
            ) : (
              <div className="text-sm font-normal text-muted-foreground">No user selected</div>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setPickerOpen(true); }}>
            Switch user…
          </DropdownMenuItem>
          {user && (
            <DropdownMenuItem
              onSelect={(e) => { e.preventDefault(); setUser(null); setPickerOpen(true); }}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={pickerOpen} onOpenChange={(open) => {
        // Don't allow closing if there is no user yet.
        if (!open && !user) return;
        setPickerOpen(open);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Who's using this computer?</DialogTitle>
            <DialogDescription>
              Your name will be stamped on every stock movement, acceptance,
              quarantine, discard and supply update for the audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto">
            {users.map((u) => (
              <Button
                key={u.id}
                variant={user?.id === u.id ? "default" : "outline"}
                className="justify-start h-auto py-3"
                onClick={() => { setUser(u.id); setPickerOpen(false); }}
              >
                <div className="text-left">
                  <div className="text-sm font-semibold">{u.name}</div>
                  <div className="text-xs font-normal opacity-80">{u.role} · {u.title}</div>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
