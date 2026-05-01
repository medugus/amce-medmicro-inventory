import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/common/EmptyState";
import { ScrollText } from "lucide-react";
import { useAuditTrail, useDataReady } from "@/lib/useLiveData";

export function AuditTrailPage() {
  const ready = useDataReady();
  const rows = useAuditTrail();
  return (
    <div>
      <Header
        helpTopic="auditTrail"
        title="Audit Trail"
        description="Record of every action recorded on this computer, with the named user, before/after values, and reason."
      />
      <div className="p-6">
        {!ready ? (
          <div className="text-sm text-muted-foreground">Loading local database…</div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="Audit trail is empty."
            description="Audit entries are created automatically when you record a stock movement, accept or reject a batch, quarantine, release, discard, or update a supply record."
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
