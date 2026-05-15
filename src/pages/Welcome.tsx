import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  UserCheck,
  PackageSearch,
  ClipboardCheck,
  ArrowLeftRight,
  Hourglass,
  AlertTriangle,
  QrCode,
  BookOpen,
  Sparkles,
  Cloud,
  MousePointer2,
} from "lucide-react";
import { useCurrentUser } from "@/lib/currentUser";
import { AMCE_USERS } from "@/data/amceUsers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const WELCOME_SEEN_KEY = "amce.welcomeSeen.v1";

interface Step {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: React.ReactNode;
}

function StepIdentify() {
  const { user, setUser } = useCurrentUser();
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed">
        Every action you take — receiving a batch, issuing stock, accepting QC,
        discarding expired items — is stamped with your name in the audit trail.
        Pick yourself from the list so the system knows who's at the bench.
      </p>
      <div className="rounded-lg border border-border bg-muted/40 p-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          I am
        </label>
        <div className="mt-2">
          <Select value={user?.id ?? ""} onValueChange={(v) => setUser(v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select your name…" />
            </SelectTrigger>
            <SelectContent>
              {AMCE_USERS.filter((u) => u.active).map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name} — {u.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {user && (
          <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Check className="h-3.5 w-3.5" /> Signed in as {user.name}. You can change this anytime from the top bar.
          </p>
        )}
      </div>
    </div>
  );
}

const STEPS: Step[] = [
  {
    icon: Sparkles,
    title: "Welcome to the AMCE Lab Inventory",
    body: (
      <div className="space-y-3 text-sm leading-relaxed">
        <p>
          This system tracks every reagent, batch, piece of equipment and supply
          request across the Department of Medical Microbiology and Immunology.
        </p>
        <p>
          It's a <span className="font-medium">shared live document</span> — every phone
          and PC with the app sees the same data, and any change you make appears
          on every other device within about a second.
        </p>
        <p>
          The next 7 screens take about 2 minutes and show you the daily workflow.
          You can skip and come back later — the full guide lives under{" "}
          <span className="font-medium">Training</span> in the sidebar.
        </p>
      </div>
    ),
  },
  {
    icon: UserCheck,
    title: "Step 1 — Tell us who you are",
    body: <StepIdentify />,
  },
  {
    icon: PackageSearch,
    title: "Step 2 — Receive a delivery",
    body: (
      <div className="space-y-3 text-sm leading-relaxed">
        <p>When a delivery arrives, open <span className="font-medium">Receive / Stock Movements</span> (or Batch Register) and click <span className="font-medium">Receive new batch</span>:</p>
        <ol className="list-decimal list-inside space-y-1.5 ml-1">
          <li>Pick the item, enter the lot number, expiry date and quantity.</li>
          <li>Save — the new batch goes straight to <span className="font-medium">Acceptance Testing</span>.</li>
        </ol>
        <p className="text-xs text-muted-foreground">
          The batch starts in <span className="font-medium">Pending acceptance</span> — it can't
          be issued until QC clears it. The receive dialog reminds you of this on save.
        </p>
      </div>
    ),
  },
  {
    icon: ClipboardCheck,
    title: "Step 3 — Accept (or quarantine) it",
    body: (
      <div className="space-y-3 text-sm leading-relaxed">
        <p>
          Open <span className="font-medium">Acceptance Testing</span>, review the batch
          documents and physical condition, then mark it:
        </p>
        <ul className="list-disc list-inside space-y-1.5 ml-1">
          <li><span className="font-medium text-emerald-600 dark:text-emerald-400">Accepted</span> — released for use.</li>
          <li><span className="font-medium text-amber-600 dark:text-amber-400">Rejected</span> — sent to Quarantined Stock with a reason.</li>
        </ul>
        <p className="text-xs text-muted-foreground">Never issue stock from a batch that hasn't been accepted.</p>
      </div>
    ),
  },
  {
    icon: ArrowLeftRight,
    title: "Step 4 — Issue stock the FEFO way",
    body: (
      <div className="space-y-3 text-sm leading-relaxed">
        <p>
          Always issue the batch that <span className="font-medium">expires soonest</span> — not the one
          that arrived first. This is FEFO: First Expiry, First Out.
        </p>
        <p>
          On <span className="font-medium">Receive / Stock Movements</span>, the system shows batches in FEFO
          order and warns you if you skip ahead.
        </p>
        <p className="text-xs text-muted-foreground">
          The <span className="font-medium">Expiry & FEFO</span> page gives a daily list of what to
          use next.
        </p>
      </div>
    ),
  },
  {
    icon: QrCode,
    title: "Step 5 — Scan instead of type",
    body: (
      <div className="space-y-3 text-sm leading-relaxed">
        <p>
          Print QR labels from <span className="font-medium">QR Labels</span>, stick one on each
          bottle / box / instrument, then use <span className="font-medium">Scan</span> on your phone
          to jump straight to that record.
        </p>
        <p className="text-xs text-muted-foreground">
          The camera needs HTTPS — open the published link, not localhost. Add the app to your home
          screen for a one-tap icon.
        </p>
      </div>
    ),
  },
  {
    icon: AlertTriangle,
    title: "Step 6 — Start your day at Critical Actions",
    body: (
      <div className="space-y-3 text-sm leading-relaxed">
        <p>
          The <span className="font-medium">Dashboard</span> shows everything at a glance and
          updates live as you and your colleagues work. The <span className="font-medium">Critical Actions</span> page
          is a single, prioritised to-do list pulled from every module — work it top to bottom.
        </p>
        <p>
          Stuck on any page? Click the <span className="font-mono px-1 rounded bg-muted border">?</span> at
          the top right for instructions specific to that screen.
        </p>
      </div>
    ),
  },
  {
    icon: MousePointer2,
    title: "Step 7 — Hover over anything to learn what it is",
    body: (
      <div className="space-y-3 text-sm leading-relaxed">
        <p>
          Every dashboard tile and every sidebar link has a <span className="font-medium">hover tooltip</span>.
          Rest your mouse on it (or long-press on mobile) and a one-line plain-English explanation
          appears — no need to guess what "Pending acceptance" or "Quarantined / rejected" means.
        </p>
        <p className="text-xs text-muted-foreground">
          Pair this with the <span className="font-mono px-1 rounded bg-muted border">?</span> button on each page for the
          full how-to.
        </p>
      </div>
    ),
  },
  {
    icon: Cloud,
    title: "You're ready",
    body: (
      <div className="space-y-3 text-sm leading-relaxed">
        <p>
          That's the full daily loop. Your changes sync to every other device on the team
          automatically — open the app on your phone and your PC, and you'll see the same
          live data on both.
        </p>
        <p className="text-xs text-muted-foreground">
          Want the full reference? Open <span className="font-medium">Training</span> in the sidebar
          for the long-form SOP walkthrough of all 15 modules.
        </p>
      </div>
    ),
  },
];

function markWelcomeSeen() {
  try {
    window.localStorage.setItem(WELCOME_SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function WelcomePage() {
  const [i, setI] = useState(0);
  const navigate = useNavigate();
  const step = STEPS[i];
  const Icon = step.icon;
  const isLast = i === STEPS.length - 1;

  function finish() {
    markWelcomeSeen();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-[calc(100vh-3rem)] flex items-center justify-center p-4 md:p-8 bg-gradient-to-br from-sky-50 via-violet-50 to-pink-50 dark:from-sky-500/10 dark:via-violet-500/10 dark:to-pink-500/10">
      <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-lg overflow-hidden">
        {/* Progress */}
        <div className="h-1.5 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((i + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Step {i + 1} of {STEPS.length}
              </div>
            </div>
            <button
              type="button"
              onClick={finish}
              className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
            >
              Skip
            </button>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-4">{step.title}</h1>
          <div className="min-h-[180px]">{step.body}</div>

          <div className="mt-8 flex items-center justify-between gap-3 pt-5 border-t border-border">
            <button
              type="button"
              onClick={() => setI((n) => Math.max(0, n - 1))}
              disabled={i === 0}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-md border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <div className="flex items-center gap-1.5">
              {STEPS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Go to step ${idx + 1}`}
                  onClick={() => setI(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === i ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                  }`}
                />
              ))}
            </div>

            {isLast ? (
              <button
                type="button"
                onClick={finish}
                className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
              >
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setI((n) => Math.min(STEPS.length - 1, n + 1))}
                className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
              >
                Next <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-4 text-center">
            <Link to="/training" className="text-xs text-muted-foreground hover:text-foreground hover:underline">
              Or read the full Training guide →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
