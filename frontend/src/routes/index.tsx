import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Web3Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
import { NetworkGuard } from "@/components/NetworkGuard";
import { HomeTab } from "@/components/tabs/HomeTab";
import { AboutTab } from "@/components/tabs/AboutTab";
import { MatrixTab } from "@/components/tabs/MatrixTab";
import { TradeTab } from "@/components/tabs/TradeTab";
import { Toaster } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StealthLimit — Private Limit Orders on Base Sepolia" },
      {
        name: "description",
        content:
          "Privacy-first limit order protocol on Base Sepolia using Fhenix CoFHE. Encrypted prices and sizes protect against MEV, frontrunning, and strategy leakage.",
      },
      { property: "og:title", content: "StealthLimit — FHE Limit Orders" },
      {
        property: "og:description",
        content: "Confidential onchain limit orders powered by Fhenix CoFHE.",
      },
    ],
  }),
  component: Index,
});

type Tab = "home" | "about" | "matrix" | "trade";

function Index() {
  const [tab, setTab] = useState<Tab>("home");

  return (
    <Web3Providers>
      <div className="min-h-screen bg-(--bg-base) text-(--text-primary) selection:bg-(--accent-teal-dim) selection:text-(--accent-teal)">
        <Header active={tab} onSelect={setTab} />
        
        <main className="mx-auto max-w-7xl px-6">
          {tab === "home" && <HomeTab />}
          {tab === "about" && <AboutTab />}
          {tab === "matrix" && <MatrixTab />}
          {tab === "trade" && <TradeTab />}
        </main>

        <NetworkGuard />
        
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-mono)",
            },
          }}
        />

        <footer className="mt-20 border-t border-(--border) py-8 text-center text-xs text-(--text-muted) font-mono">
          StealthLimit · Base Sepolia (84532) · Fhenix CoFHE
        </footer>
      </div>
    </Web3Providers>
  );
}