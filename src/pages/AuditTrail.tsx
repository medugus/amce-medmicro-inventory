import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/common/EmptyState";
import { ScrollText } from "lucide-react";
import { AMCE_AUDIT_TRAIL } from "@/data/amceAuditTrail";

export function AuditTrailPage() {
  const rows = AMCE_AUDIT_TRAIL;
  return (
    <div>
      <Header
        title="Audit Trail"
        description="Record of user actions across modules. Persistent audit logging is enabled once the system is connected to a backend."
      />
      <div className="p-6">
        {rows.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="Audit trail is empty."
            description="Audit entries will be recorded automatically once user authentication and database persistence are enabled."
          />
        ) : (
          <div className="border border-border rounded-md overflow-x-auto bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-2">Date / time</th>
                  <th className="p-2">User</th>
                  <th className="p-2">Module</th>
                  <th className="p-2">Action</th>
                  <th className="p-2">Entity</th>
                  <th className="p-2">Previous</th>
                  <th className="p-2">New</th>
                  <th className="p-2">Reason</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-2 text-xs">{new Date(e.dateTime).toLocaleString()}</td>
                    <td className="p-2 text-xs">{e.user}</td>
                    <td className="p-2 text-xs">{e.module}</td>
                    <td className="p-2 text-xs">{e.action}</td>
                    <td className="p-2 text-xs">{e.entityId}</td>
                    <td className="p-2 text-xs">{e.previousValue ?? ""}</td>
                    <td className="p-2 text-xs">{e.newValue ?? ""}</td>
                    <td className="p-2 text-xs">{e.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
