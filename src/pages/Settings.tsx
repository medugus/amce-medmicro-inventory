import { Header } from "@/components/layout/Header";
import { AMCE_SECTIONS } from "@/data/amceSections";
import { AMCE_USERS } from "@/data/amceUsers";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  useMaintWindowDays,
  setMaintWindowDays,
  useProcurementRecipients,
  setLabManagerEmail,
  setHeadOfUnitEmail,
} from "@/lib/settings";

export function SettingsPage() {
  const maintDays = useMaintWindowDays();
  const { labManager, headOfUnit } = useProcurementRecipients();
  return (
    <div>
      <Header helpTopic="settings" title="Settings" description="Sections, leads and user roles for AMCE Microbiology." />
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="lg:col-span-2">
          <h2 className="text-sm font-semibold mb-2">Thresholds</h2>
          <div className="border border-border rounded-md bg-card px-3 py-3 flex flex-wrap items-center gap-3">
            <label htmlFor="maint-window" className="text-sm font-medium">Maintenance / calibration warning window</label>
            <input
              id="maint-window"
              type="number"
              min={1}
              max={365}
              value={maintDays}
              onChange={(e) => setMaintWindowDays(Math.max(1, Number(e.target.value) || 1))}
              className="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm"
            />
            <span className="text-xs text-muted-foreground">days before due date — equipment is flagged on the dashboard within this window.</span>
          </div>
        </section>
        <section>
          <h2 className="text-sm font-semibold mb-2">Laboratory sections</h2>
          <div className="border border-border rounded-md bg-card divide-y divide-border">
            {AMCE_SECTIONS.map((s) => (
              <div key={s.id} className="px-3 py-2 flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.description}</div>
                </div>
                <div className="text-xs text-right whitespace-nowrap">Lead: {s.leads.join(", ")}</div>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-sm font-semibold mb-2">Users and roles</h2>
          <div className="border border-border rounded-md bg-card divide-y divide-border">
            {AMCE_USERS.map((u) => (
              <div key={u.id} className="px-3 py-2 flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{u.name}</div>
                  <div className="text-xs text-muted-foreground">{u.title}</div>
                </div>
                <StatusBadge label={u.role} tone="info" />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Role-based access enforcement will be applied once the system is connected to a backend with authentication.
          </p>
        </section>
      </div>
    </div>
  );
}
