import { Header } from "@/components/layout/Header";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  UserCheck,
  PackageSearch,
  Layers,
  ArrowLeftRight,
  ClipboardCheck,
  ShieldAlert,
  Trash2,
  Hourglass,
  TrendingDown,
  ShoppingCart,
  Cpu,
  ScrollText,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

function Section({
  num,
  icon: Icon,
  title,
  what,
  when,
  how,
  link,
  linkLabel,
}: {
  num: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  what: string;
  when: string;
  how: string[];
  link?: string;
  linkLabel?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="shrink-0 h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
          {num}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-base">{title}</h3>
          </div>
          <div className="mt-3 grid gap-3 text-sm">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">What it is</div>
              <p className="mt-0.5">{what}</p>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">When to use</div>
              <p className="mt-0.5">{when}</p>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">How</div>
              <ol className="mt-1 list-decimal list-inside space-y-0.5 marker:text-muted-foreground">
                {how.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
            {link && (
              <Link
                to={link}
                className="text-xs font-medium text-primary hover:underline self-start"
              >
                Open {linkLabel} →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Rule({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  return (
    <div className="bg-gradient-to-br from-amber-50 to-pink-50 dark:from-amber-500/10 dark:to-pink-500/10 border border-border rounded-lg p-4">
      <div className="flex items-center gap-2">
        <span className="text-xl" aria-hidden>{emoji}</span>
        <div className="font-bold text-sm">{title}</div>
      </div>
      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{body}</p>
    </div>
  );
}

export function TrainingPage() {
  return (
    <div>
      <Header
        title="Training Guide"
        description="Standard operating walkthrough for the AMCE Medical Microbiology team."
      />
      <div className="p-6 max-w-4xl space-y-6">
        {/* Intro */}
        <div className="rounded-lg border border-border bg-gradient-to-r from-sky-100 via-violet-100 to-pink-100 dark:from-sky-500/15 dark:via-violet-500/15 dark:to-pink-500/15 p-5">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="font-bold">Welcome to the lab inventory system 👋</h2>
          </div>
          <p className="text-sm mt-2 leading-relaxed">
            This guide walks you through every part of the system in plain language.
            Take 15 minutes to read it once and you'll know exactly what to do at the bench every day.
            If you ever get stuck on a page, click the <span className="font-mono px-1 rounded bg-background border">?</span> icon at the top right — it has the same instructions for that screen.
          </p>
        </div>

        {/* Golden rules */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" /> Golden rules — read these first
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Rule
              emoji="👤"
              title="Always pick your name first"
              body="Before doing anything, click your name in the top bar. Every action you take (receive, issue, accept, discard) is stamped with your name in the audit trail."
            />
            <Rule
              emoji="📅"
              title="FEFO — First Expiry, First Out"
              body="Always issue the batch that expires soonest, not the one that arrived first. The Expiry & FEFO page shows you exactly what to use next."
            />
            <Rule
              emoji="✅"
              title="Accept before you use"
              body="A new batch is in 'Pending acceptance' until QC checks it. Never issue stock from a batch that hasn't been accepted."
            />
            <Rule
              emoji="🚫"
              title="Expired = quarantine, then discard"
              body="If something is past its expiry date, move it to Quarantined Stock immediately, then record the discard in Expired/Wasted Stock. Don't leave it on the shelf."
            />
          </div>
        </section>

        {/* Daily flow */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">A typical day</h2>
          <div className="bg-card border border-border rounded-lg p-4 text-sm">
            <ol className="space-y-2 list-decimal list-inside">
              <li><span className="font-medium">Open the Dashboard</span> — see what needs attention today (critical risks, expired items, low stock).</li>
              <li><span className="font-medium">Click Critical Actions</span> — the system tells you exactly what to do, in priority order.</li>
              <li><span className="font-medium">Receive any new deliveries</span> — register the batch on Batch Register.</li>
              <li><span className="font-medium">Send pending batches for QC</span> — mark accepted or rejected on Acceptance Testing.</li>
              <li><span className="font-medium">Issue stock to benches</span> — record on Stock Movements (FEFO order).</li>
              <li><span className="font-medium">Raise reorders</span> — anything red on Low Stock & Reorder needs a Purchase Request.</li>
            </ol>
          </div>
        </section>

        {/* Modules */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">The modules — what each page is for</h2>
          <div className="grid gap-3">
            <Section
              num={1}
              icon={UserCheck}
              title="Sign in as yourself"
              what="A drop-down at the top right of every page where you select your name from the team list."
              when="The very first thing you do when you open the app on any device."
              how={[
                "Click the user picker in the top-right of the page.",
                "Select your name from the list.",
                "Your name now stamps every action in the audit trail.",
              ]}
            />
            <Section
              num={2}
              icon={PackageSearch}
              title="Inventory Master"
              what="The catalogue of every reagent, consumable, media, kit and control your lab uses."
              when="When you need to look up an item, change its reorder level, or add something brand new."
              how={[
                "Search by name or category at the top.",
                "Click an item to see all its batches and current stock.",
                "Use 'Add item' only for genuinely new SKUs — never for new batches of an existing item.",
              ]}
              link="/inventory-master"
              linkLabel="Inventory Master"
            />
            <Section
              num={3}
              icon={Layers}
              title="Batch / Lot Register"
              what="Where you record every physical batch that arrives in the lab — lot number, expiry, quantity, supplier."
              when="As soon as a delivery arrives, before it goes on the shelf."
              how={[
                "Click 'Receive batch'.",
                "Pick the inventory item, enter lot number, expiry date and quantity received.",
                "Save — the batch starts in 'Pending acceptance' until QC clears it.",
              ]}
              link="/batch-register"
              linkLabel="Batch Register"
            />
            <Section
              num={4}
              icon={ClipboardCheck}
              title="Acceptance Testing"
              what="The QC step that decides whether a new batch can be released for use."
              when="After every receipt, before any issue. Critical for media, controls and reagents."
              how={[
                "Open Acceptance Testing and pick the pending batch.",
                "Record QC results, dates and the tester's name.",
                "Mark Accepted (released for use) or Rejected (sent to quarantine).",
              ]}
              link="/acceptance-testing"
              linkLabel="Acceptance Testing"
            />
            <Section
              num={5}
              icon={ArrowLeftRight}
              title="Stock Movements"
              what="The log of everything coming in, going out, transferring between benches, or being adjusted."
              when="Every time stock physically moves — issue to a bench, return, transfer, count adjustment."
              how={[
                "Click 'New movement' and pick the type (Issue, Return, Transfer, Adjustment).",
                "Pick the batch — the system will warn you if you skip FEFO order or pick an expired one.",
                "Enter quantity and reason, then save.",
              ]}
              link="/stock-movements"
              linkLabel="Stock Movements"
            />
            <Section
              num={6}
              icon={Hourglass}
              title="Expiry & FEFO"
              what="A live view of every batch sorted by how soon it expires."
              when="Daily — to know exactly which batch to issue next, and which are about to expire."
              how={[
                "Open the page each morning.",
                "Use the batches near the top of the list first.",
                "Anything in red has expired — move to Quarantined Stock today.",
              ]}
              link="/expiry-fefo"
              linkLabel="Expiry & FEFO"
            />
            <Section
              num={7}
              icon={TrendingDown}
              title="Low Stock & Reorder"
              what="A list of items that have dropped to or below their reorder level."
              when="At least once a week, and any time the dashboard shows low-stock alerts."
              how={[
                "Open the page and review the items shown.",
                "For each, click 'Raise request' to create a Purchase Request.",
                "The request goes to Procurement Follow-up automatically.",
              ]}
              link="/low-stock-reorder"
              linkLabel="Low Stock & Reorder"
            />
            <Section
              num={8}
              icon={ShoppingCart}
              title="Purchase Requests & Procurement Follow-up"
              what="The paper trail from 'we need this' to 'it's been delivered'."
              when="Whenever you raise a request, and weekly to chase outstanding orders."
              how={[
                "Raise the request from Low Stock or directly under Purchase Requests.",
                "Track its status (Pending, Approved, Ordered, Partially supplied, Supplied) in Procurement Follow-up.",
                "Mark it Supplied once the goods are received and registered as a batch.",
              ]}
              link="/purchase-requests"
              linkLabel="Purchase Requests"
            />
            <Section
              num={9}
              icon={ShieldAlert}
              title="Quarantined Stock"
              what="The holding bay for any batch that failed QC, expired, or is otherwise unsafe to use."
              when="The moment a batch fails acceptance, expires, or is suspected to be compromised."
              how={[
                "Move the batch to Quarantined Stock with a clear reason.",
                "Tag it physically in the lab so no one issues it.",
                "When ready, record the final disposal on Expired/Wasted Stock.",
              ]}
              link="/quarantined-stock"
              linkLabel="Quarantined Stock"
            />
            <Section
              num={10}
              icon={Trash2}
              title="Expired / Wasted Stock"
              what="The official record of everything you discarded, with the reason and the witness."
              when="When you actually destroy or dispose of a batch (after quarantine)."
              how={[
                "Pick the batch from quarantine.",
                "Enter the disposal date, method and witness.",
                "Save — this updates stock counts and waste reports.",
              ]}
              link="/expired-wasted-stock"
              linkLabel="Expired / Wasted Stock"
            />
            <Section
              num={11}
              icon={Cpu}
              title="Equipment & Maintenance"
              what="The asset register for incubators, BACT/ALERT, GeneXpert, MGIT, MALDI-TOF, etc., plus their service schedules."
              when="When a new piece of equipment arrives, or when maintenance/calibration is due."
              how={[
                "Add new equipment under Equipment Register.",
                "Set the next maintenance and calibration dates.",
                "Tick them off in Maintenance & Calibration when done.",
              ]}
              link="/equipment-register"
              linkLabel="Equipment Register"
            />
            <Section
              num={12}
              icon={AlertTriangle}
              title="Critical Actions"
              what="A single prioritised to-do list pulled from every other module."
              when="Start of every shift, and any time the dashboard count goes up."
              how={[
                "Open Critical Actions.",
                "Work top-to-bottom — items are already sorted by urgency.",
                "Click each row to jump straight to the page you need.",
              ]}
              link="/critical-actions"
              linkLabel="Critical Actions"
            />
            <Section
              num={13}
              icon={ScrollText}
              title="Audit Trail"
              what="A read-only log of who did what, when, on every batch and movement."
              when="During audits, investigations, or to settle 'who issued this?' questions."
              how={[
                "Filter by user, date, item or action type.",
                "Export to share with QA or auditors.",
                "Never edit — the trail is your defence.",
              ]}
              link="/audit-trail"
              linkLabel="Audit Trail"
            />
          </div>
        </section>

        {/* Tips */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">Helpful habits</h2>
          <div className="bg-card border border-border rounded-lg p-4 text-sm space-y-2">
            <p>📱 <span className="font-medium">Use it on your phone.</span> Open the published link and 'Add to Home Screen' for a one-tap app icon.</p>
            <p>❓ <span className="font-medium">Stuck? Hit the ? icon.</span> Every page has its own quick-help panel.</p>
            <p>⚠️ <span className="font-medium">Read the inline warnings.</span> If a yellow box appears in a dialog, slow down — it's flagging something risky.</p>
            <p>🤝 <span className="font-medium">If unsure, ask the bench lead.</span> The dashboard shows the lead for every section in colour.</p>
            <p>🔁 <span className="font-medium">Pull-to-refresh on mobile</span> if a screen looks stale.</p>
          </div>
        </section>

        <div className="text-xs text-muted-foreground text-center pt-2">
          Built for the AMCE Medical Microbiology team — keep this guide open during your first week.
        </div>
      </div>
    </div>
  );
}
