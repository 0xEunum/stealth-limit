import { useAccount, useSwitchChain } from "wagmi";
import { BASE_SEPOLIA_CHAIN_ID } from "@/lib/contracts";
import { AlertTriangle } from "lucide-react";

export function NetworkGuard() {
  const { isConnected, chainId } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  if (!isConnected || chainId === BASE_SEPOLIA_CHAIN_ID) return null;
  return (
    <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div className="surface-card flex max-w-xl items-center gap-4 px-5 py-4 shadow-2xl glow-teal">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[rgba(239,68,68,0.12)]">
          <AlertTriangle className="h-4 w-4 text-[var(--sell-red)]" />
        </div>
        <div className="flex-1 text-sm">
          <p className="text-[var(--text-primary)]">Wrong network detected</p>
          <p className="text-xs text-[var(--text-secondary)]">
            StealthLimit operates on Base Sepolia (chainId 84532).
          </p>
        </div>
        <button
          disabled={isPending}
          onClick={() => switchChain({ chainId: BASE_SEPOLIA_CHAIN_ID })}
          className="rounded-md bg-[var(--accent-teal)] px-4 py-2 text-xs font-medium text-[var(--bg-base)] transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Switching…" : "Switch to Base Sepolia"}
        </button>
      </div>
    </div>
  );
}
