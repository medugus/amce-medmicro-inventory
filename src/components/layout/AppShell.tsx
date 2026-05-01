import { Sidebar } from "./Sidebar";
import { UserPicker } from "./UserPicker";
import { InstallAppButton } from "./InstallAppButton";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col">
        <div className="border-b border-border bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-end gap-2 px-6 py-2 print:hidden">
            <InstallAppButton />
            <UserPicker />
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
