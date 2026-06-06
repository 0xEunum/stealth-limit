import { Cpu, Server, Database, Droplets } from "lucide-react";

export function AboutTab() {
  return (
    <div className="mx-auto max-w-4xl space-y-12 pb-10">
      <section className="pt-8">
        <p className="text-xs tracking-[0.2em] text-[var(--accent-teal)] uppercase">
          About the protocol
        </p>
        <h1 className="mt-3 font-display text-4xl text-[var(--text-primary)]">
          Fhenix CoFHE, applied to limit orders
        </h1>
        <p className="mt-4 max-w-2xl text-[var(--text-secondary)]">
          StealthLimit is a privacy-first limit-order protocol that uses
          <span className="text-[var(--accent-teal)]"> Fully Homomorphic Encryption </span>
          to keep your trading intent invisible. Targets and sizes are encrypted in
          the browser with the official <code className="text-[var(--text-primary)]">@cofhe/sdk</code>,
          submitted to the contract as ciphertext handles, and never decrypted —
          even by the keeper that triggers execution.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-[var(--text-primary)]">How execution works without seeing the inputs</h2>
        <p className="text-[var(--text-secondary)]">
          The smart contract receives two <code>InEuint64</code> ciphertexts per order: the
          encrypted target price and the encrypted amount. To decide whether a
          buy/sell condition is met, the contract performs FHE comparisons
          (<code className="text-[var(--accent-teal)]">FHE.lte</code> for buys,{" "}
          <code className="text-[var(--accent-teal)]">FHE.gte</code> for sells) against the
          current mock pool spot price. The result is itself a ciphertext boolean
          that the Fhenix coprocessor decrypts only at the precise moment of
          execution — yielding an opaque yes/no without ever exposing the user's
          number to chain observers or to the contract operator.
        </p>
        <p className="text-[var(--text-secondary)]">
          Because the inputs are <span className="text-[var(--text-primary)]">euint64</span>{" "}
          variables, raw decimal prices are scaled by{" "}
          <code className="text-[var(--accent-teal)]">1e8</code> client-side before
          encryption, mirroring the integer arithmetic the contract performs on
          ciphertext.
        </p>
      </section>

      <section>
        <h2 className="mb-4 font-display text-2xl text-[var(--text-primary)]">Architecture</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              icon: Cpu,
              title: "Frontend",
              body: "Encrypts price + amount via @cofhe/sdk web worker. Submits ciphertext tuples to StealthLimitOrder. Never sees plaintext after submission.",
            },
            {
              icon: Database,
              title: "Smart Contract (StealthLimitOrder)",
              body: "Stores ciphertext handles. Exposes createBuyOrder / createSellOrder / cancelOrder / getMyOrderIds / getOrderMeta. Performs FHE comparisons against MockPool spot.",
            },
            {
              icon: Server,
              title: "Off-chain Keeper",
              body: "Polls candidate orders, requests an FHE conditional decrypt from Fhenix CoFHE, fires execute() when (and only when) the encrypted condition resolves true.",
            },
            {
              icon: Droplets,
              title: "MockPool",
              body: "Quotes the public spot for mUSDC / mBaseETH and settles the matched leg. The pool sees the executed leg but never the original target nor untriggered orders.",
            },
          ].map((c) => (
            <div key={c.title} className="surface-card p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--accent-teal-dim)]">
                <c.icon className="h-4 w-4 text-[var(--accent-teal)]" />
              </div>
              <h3 className="mt-3 font-display text-lg text-[var(--text-primary)]">{c.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">{c.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
