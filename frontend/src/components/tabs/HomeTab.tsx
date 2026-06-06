import { Fragment } from "react";
import { ArrowRight, Lock, Eye, Swords, Cpu, Database, Server, Droplets } from "lucide-react";

export function HomeTab() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="relative pt-12 pb-8 text-center md:pt-20">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1 text-[10px] tracking-[0.18em] text-[var(--accent-teal)] uppercase">
          <Lock className="h-3 w-3" /> Powered by Fhenix CoFHE
        </div>
        <h1 className="mt-6 font-display text-5xl leading-[1.05] text-[var(--text-primary)] md:text-7xl">
          Stealth<span className="text-[var(--accent-teal)]">Limit</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-sm text-[var(--text-secondary)] md:text-base">
          Private Limit Orders on Base Sepolia. Target prices and order sizes are
          encrypted client-side and stored onchain as ciphertext — invisible to
          everyone, including the protocol itself.
        </p>
      </section>

      {/* Flow */}
      <section>
        <h2 className="mb-6 text-center font-display text-2xl text-[var(--text-primary)]">
          Lifecycle of a confidential order
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-7 md:items-stretch">
          {[
            { icon: Cpu, label: "Client-side Encryption", sub: "via @cofhe/sdk" },
            { icon: Database, label: "Onchain Ciphertext", sub: "stored as FHE handles" },
            { icon: Server, label: "Keeper Evaluation", sub: "FHE.lte / FHE.gte" },
            { icon: Droplets, label: "Confidential Liquidation", sub: "MockPool settlement" },
          ].map((step, i, arr) => (
            <Fragment key={step.label}>
              <div className="surface-card flex flex-col items-start gap-3 p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--accent-teal-dim)]">
                  <step.icon className="h-4 w-4 text-[var(--accent-teal)]" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-primary)]">{step.label}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{step.sub}</p>
                </div>
              </div>
              {i < arr.length - 1 && (
                <div className="hidden items-center justify-center md:flex">
                  <ArrowRight className="h-4 w-4 text-[var(--text-muted)]" />
                </div>
              )}
            </Fragment>
          ))}
        </div>
      </section>

      {/* Value props */}
      <section>
        <h2 className="mb-6 text-center font-display text-2xl text-[var(--text-primary)]">
          What you stop leaking
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              icon: Swords,
              title: "MEV Sandwich",
              body: "Searchers can't sandwich what they can't read. Target prices remain ciphertext until execution.",
            },
            {
              icon: Eye,
              title: "Frontrunning",
              body: "No mempool oracle of intent. Order side is the only public signal; size and trigger price stay sealed.",
            },
            {
              icon: Lock,
              title: "Strategy Leakage",
              body: "Backtest-grade strategies stay yours. No on-chain breadcrumbs reveal cohort behavior.",
            },
          ].map((v) => (
            <div key={v.title} className="surface-card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--accent-teal-dim)]">
                <v.icon className="h-5 w-5 text-[var(--accent-teal)]" />
              </div>
              <h3 className="mt-4 font-display text-lg text-[var(--text-primary)]">
                {v.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                {v.body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
