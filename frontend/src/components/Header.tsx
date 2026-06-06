import { useQuery } from "@tanstack/react-query";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { fetchEthPriceUsd } from "@/lib/price";
import { useCofheConnection } from "@/hooks/useCofheConnection";
import { Activity, Lock, RefreshCw } from "lucide-react";
import { BASE_SEPOLIA_CHAIN_ID } from "@/lib/contracts";

type Tab = "home" | "about" | "matrix" | "trade";

export function Header({
  active,
  onSelect,
}: {
  active: Tab;
  onSelect: (t: Tab) => void;
}) {
  const { chainId, isConnected } = useAccount();
  const { state: fheState } = useCofheConnection();

  const priceQ = useQuery({
    queryKey: ["eth-price"],
    queryFn: fetchEthPriceUsd,
    refetchInterval: 10_000,
    refetchOnWindowFocus: false,
    retry: 0,
  });

  const onCorrectChain = chainId === BASE_SEPOLIA_CHAIN_ID;
  const tabs: { id: Tab; label: string }[] = [
    { id: "home", label: "Home" },
    { id: "about", label: "About" },
    { id: "matrix", label: "Confidentiality" },
    { id: "trade", label: "Trade" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[rgba(10,10,15,0.78)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-3.5">
        <button
          onClick={() => onSelect("home")}
          className="group flex items-center gap-2.5"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--accent-teal-dim)] glow-teal">
            <Lock className="h-4 w-4 text-[var(--accent-teal)]" />
          </div>
          <span className="font-display text-xl tracking-tight text-[var(--text-primary)]">
            Stealth<span className="text-[var(--accent-teal)]">Limit</span>
          </span>
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                active === t.id
                  ? "bg-[var(--accent-teal-dim)] text-[var(--accent-teal)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {/* Price badge */}
          <div className="hidden items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-xs sm:flex">
            {priceQ.data != null ? (
              <>
                <span className="live-dot" />
                <span className="text-[var(--text-muted)]">ETH/USD</span>
                <span className="font-mono text-[var(--text-primary)]">
                  ${priceQ.data.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </>
            ) : priceQ.isLoading ? (
              <span className="text-[var(--text-muted)]">Loading price…</span>
            ) : (
              <button
                onClick={() => priceQ.refetch()}
                className="flex items-center gap-1.5 text-[var(--sell-red)]"
              >
                <RefreshCw className="h-3 w-3" /> Price data unavailable
              </button>
            )}
          </div>

          {/* Network telemetry */}
          <div className="hidden items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1.5 text-xs lg:flex">
            <Activity
              className={`h-3 w-3 ${
                isConnected && onCorrectChain
                  ? "text-[var(--accent-teal)]"
                  : "text-[var(--text-muted)]"
              }`}
            />
            <span className="text-[var(--text-muted)]">Base Sepolia</span>
            <span
              className={`ml-1 rounded-sm px-1.5 text-[10px] ${
                fheState === "connected"
                  ? "bg-[var(--accent-teal-dim)] text-[var(--accent-teal)]"
                  : "bg-[var(--bg-surface)] text-[var(--text-muted)]"
              }`}
            >
              FHE {fheState}
            </span>
          </div>

          <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
        </div>
      </div>

      {/* Mobile tabs */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-[var(--border)] px-4 py-2 md:hidden">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`rounded-md px-3 py-1.5 text-xs whitespace-nowrap ${
              active === t.id
                ? "bg-[var(--accent-teal-dim)] text-[var(--accent-teal)]"
                : "text-[var(--text-secondary)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
