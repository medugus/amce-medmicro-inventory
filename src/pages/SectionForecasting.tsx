import { AMCE_FORECASTS } from "@/data/amceForecasts";
import { Header } from "@/components/layout/Header";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge, toneForCriticality } from "@/components/common/StatusBadge";
import { SECTION_NAME } from "@/data/amceSections";

export function SectionForecastingPage() {
  const rows = AMCE_FORECASTS;
  return (
    <div>
      <Header
        helpTopic="sectionForecasting"
        title="Section Forecasting"
        description="Three-month forecasts submitted by bench heads. Used for procurement planning and budget projection."
        actions={<ExportButton />}
      />
      <div className="p-6 space-y-4">
        {rows.length === 0 ? <EmptyState /> : (
          <div className="border border-border rounded-md overflow-x-auto bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-2">Section</th>
                  <th className="p-2">Responsible</th>
                  <th className="p-2">Item</th>
                  <th className="p-2 text-right">Current</th>
                  <th className="p-2 text-right">Avg/mo</th>
                  <th className="p-2 text-right">Need (3 mo)</th>
                  <th className="p-2 text-right">Requesting</th>
                  <th className="p-2">Priority</th>
                  <th className="p-2">Justification</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((f) => (
                  <tr key={f.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-2 text-xs">{SECTION_NAME[f.laboratorySection]}</td>
                    <td className="p-2 text-xs">{f.responsiblePerson}</td>
                    <td className="p-2 font-medium">{f.itemName}</td>
                    <td className="p-2 text-right tabular-nums">{f.currentStock}</td>
                    <td className="p-2 text-right tabular-nums">{f.averageMonthlyUsage}</td>
                    <td className="p-2 text-right tabular-nums">{f.quantityNeededForThreeMonths}</td>
                    <td className="p-2 text-right tabular-nums">{f.requestedQuantity}</td>
                    <td className="p-2"><StatusBadge label={f.priority} tone={toneForCriticality(f.priority)} /></td>
                    <td className="p-2 text-xs">{f.justification}</td>
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
