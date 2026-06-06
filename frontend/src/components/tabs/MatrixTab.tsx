import { Lock } from "lucide-react";

type Row = { param: string; visibility: "private" | "public"; note: string };

const ROWS: Row[] = [
  { param: "Target Price", visibility: "private", note: "Encrypted euint64, scaled by 1e8" },
  { param: "Order Amount", visibility: "private", note: "Encrypted euint64, scaled by 1e8" },
  { param: "Trading Intent", visibility: "private", note: "Trigger condition stays ciphertext" },
  { param: "Order Side", visibility: "public", note: "Buy (0) / Sell (1) — needed for routing" },
  { param: "Trading Pair", visibility: "public", note: "mUSDC / mBaseETH" },
  { param: "Order Status", visibility: "public", note: "Open / Executed / Cancelled" },
  { param: "Pool Spot Reference", visibility: "public", note: "MockPool quote, comparison input" },
];

export function MatrixTab() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-10">
      <section className="pt-8">
        <p className="text-xs tracking-[0.2em] text-[var(--accent-teal)] uppercase">
          Confidentiality matrix
        </p>
        <h1 className="mt-3 font-display text-4xl text-[var(--text-primary)]">
          What chain observers can — and cannot — see
        </h1>
        <p className="mt-4 max-w-2xl text-[var(--text-secondary)]">
          The protocol intentionally publishes the minimum metadata needed for
          routing and accounting. Every value that could leak strategy stays
          ciphertext.
        </p>
      </section>

      <div className="surface-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[10px] tracking-[0.18em] text-[var(--text-muted)] uppercase">
              <th className="px-5 py-3.5">Parameter</th>
              <th className="px-5 py-3.5">Exposure</th>
              <th className="px-5 py-3.5">Notes</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr
                key={r.param}
                className={`border-b border-[var(--border)] last:border-0 ${
                  r.visibility === "private" ? "bg-[var(--accent-teal-dim)]" : ""
                }`}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    {r.visibility === "private" && (
                      <Lock className="h-3.5 w-3.5 text-[var(--accent-teal)]" />
                    )}
                    <span
                      className={
                        r.visibility === "private"
                          ? "text-[var(--accent-teal)]"
                          : "text-[var(--text-primary)]"
                      }
                    >
                      {r.param}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  {r.visibility === "private" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--accent-teal)]/40 bg-[var(--bg-base)]/60 px-2 py-0.5 text-xs text-[var(--accent-teal)]">
                      🔒 Encrypted onchain
                    </span>
                  ) : (
                    <span className="inline-flex rounded-md border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                      Public
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 text-[var(--text-secondary)]">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
