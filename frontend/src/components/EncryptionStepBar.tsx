import { STEP_LABELS, type EncryptStepLabel } from "@/lib/cofhe";
import { Check, Loader2 } from "lucide-react";

const ORDER: EncryptStepLabel[] = [
  "initTfhe",
  "fetchKeys",
  "pack",
  "prove",
  "verify",
  "submitting",
];

export function EncryptionStepBar({ step }: { step: EncryptStepLabel }) {
  const activeIdx = ORDER.indexOf(step);
  return (
    <div className="surface-card mt-4 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
          FHE Execution Engine
        </span>
        <span className="text-xs text-[var(--accent-teal)]">{STEP_LABELS[step]}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {ORDER.map((s, i) => {
          const done = activeIdx > i || step === "done";
          const active = activeIdx === i && step !== "done";
          return (
            <div key={s} className="flex flex-1 items-center gap-1.5">
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                  done
                    ? "border-[var(--accent-teal)] bg-[var(--accent-teal)] text-[var(--bg-base)]"
                    : active
                      ? "border-[var(--accent-teal)] text-[var(--accent-teal)]"
                      : "border-[var(--border)] text-[var(--text-muted)]"
                }`}
              >
                {done ? (
                  <Check className="h-3 w-3" />
                ) : active ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  i + 1
                )}
              </div>
              {i < ORDER.length - 1 && (
                <div
                  className={`h-px flex-1 ${
                    done ? "bg-[var(--accent-teal)]" : "bg-[var(--border)]"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
