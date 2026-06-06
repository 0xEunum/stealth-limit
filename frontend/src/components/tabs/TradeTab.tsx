import { useEffect, useMemo, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import {
  Lock,
  Loader2,
  X,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Wallet,
  Inbox,
} from "lucide-react";
import {
  CONTRACTS,
  STEALTH_LIMIT_ORDER_ABI,
  ORDER_SIDE,
  ORDER_STATUS,
  type OrderMeta,
  mapContractError,
  BASE_SEPOLIA_CHAIN_ID,
} from "@/lib/contracts";
import { getCofheClient, scaleTo1e8, type EncryptStepLabel, STEP_LABELS } from "@/lib/cofhe";
import { useCofheConnection } from "@/hooks/useCofheConnection";
import { EncryptionStepBar } from "@/components/EncryptionStepBar";

type Side = "buy" | "sell";

export function TradeTab() {
  const { isConnected, address, chainId } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="surface-card max-w-md p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-(--accent-teal-dim)">
            <Wallet className="h-6 w-6 text-(--accent-teal)" />
          </div>
          <h2 className="mt-5 font-display text-2xl text-(--text-primary)">
            Connect Wallet to Trade
          </h2>
          <p className="mt-2 text-sm text-(--text-secondary)">
            StealthLimit requires an EVM wallet on Base Sepolia (chainId 84532)
            to encrypt and submit your confidential orders.
          </p>
          <div className="mt-6 flex justify-center">
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 pb-10 lg:grid-cols-[400px_1fr]">
      <OrderPlacementPanel onPlaced={() => undefined} />
      <OrdersPanel address={address!} enabled={chainId === BASE_SEPOLIA_CHAIN_ID} />
    </div>
  );
}

/* -------------------- Order placement -------------------- */

function OrderPlacementPanel({ onPlaced }: { onPlaced: () => void }) {
  const [side, setSide] = useState<Side>("buy");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<EncryptStepLabel>("idle");
  const [busy, setBusy] = useState(false);
  const { state: fheState } = useCofheConnection();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const qc = useQueryClient();
  const { address } = useAccount();

  const ready = fheState === "connected" && !busy;

  async function submit() {
    if (!walletClient || !publicClient) return;
    if (!price || !amount) {
      toast.error("Enter price and amount");
      return;
    }
    let scaledPrice: bigint;
    let scaledAmount: bigint;
    try {
      scaledPrice = scaleTo1e8(price);
      scaledAmount = scaleTo1e8(amount);
      if (scaledPrice <= 0n || scaledAmount <= 0n) throw new Error("Must be > 0");
    } catch (e) {
      toast.error((e as Error).message);
      return;
    }

    setBusy(true);
    setStep("initTfhe");
    try {
      const client = await getCofheClient();
      const { Encryptable } = await import("@cofhe/sdk");

      const encrypted = await client
        .encryptInputs([
          Encryptable.uint64(scaledPrice),
          Encryptable.uint64(scaledAmount),
        ])
        .onStep((s: string, ctx: any) => {
          const map: Record<string, EncryptStepLabel> = {
            initTfhe: "initTfhe",
            fetchKeys: "fetchKeys",
            pack: "pack",
            prove: "prove",
            verify: "verify",
            submitting: "submitting",
            done: "done"
          };
          const mapped = map[s];
          if (mapped && ctx?.isStart) setStep(mapped);
        })
        .execute();

      const [encPrice, encAmount] = encrypted as unknown as Array<{
        ctHash: bigint;
        securityZone: number;
        utype: number;
        signature: `0x${string}`;
      }>;

      setStep("submitting");
      const hash = await walletClient.writeContract({
        abi: STEALTH_LIMIT_ORDER_ABI,
        address: CONTRACTS.StealthLimitOrder,
        functionName: side === "buy" ? "createBuyOrder" : "createSellOrder",
        args: [
          {
            ctHash: encPrice.ctHash,
            securityZone: encPrice.securityZone,
            utype: encPrice.utype,
            signature: encPrice.signature,
          },
          {
            ctHash: encAmount.ctHash,
            securityZone: encAmount.securityZone,
            utype: encAmount.utype,
            signature: encAmount.signature,
          },
        ],
        // FORCE HIGHER GAS UNIT CEILING TO PROCESS THE CIPHERTEXT VERIFICATION PROCESS
        gas: 15_000_000n,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setStep("done");
      toast.success(`${side === "buy" ? "Buy" : "Sell"} order submitted`, {
        description: "Encrypted ciphertext stored onchain.",
      });
      setPrice("");
      setAmount("");
      qc.invalidateQueries({ queryKey: ["orders", address] });
      onPlaced();
    } catch (e) {
      console.error(e);
      toast.error("Order failed", { description: mapContractError(e) });
    } finally {
      setTimeout(() => setStep("idle"), 1200);
      setBusy(false);
    }
  }

  return (
    <div className="surface-card flex h-fit flex-col p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-[0.2em] text-(--text-muted) uppercase">
            Order terminal
          </p>
          <h2 className="mt-1 font-display text-xl text-(--text-primary)">
            Place limit order
          </h2>
        </div>
        <span className="rounded-md border border-(--border) bg-(--bg-surface) px-2 py-0.5 text-[10px] text-(--text-secondary)">
          mUSDC / mBaseETH
        </span>
      </div>

      {/* Side toggle */}
      <div className="mt-5 grid grid-cols-2 gap-1 rounded-md border border-(--border) bg-(--bg-base) p-1">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={`rounded-sm py-2 text-sm transition-colors ${
              side === s
                ? s === "buy"
                  ? "bg-[rgba(34,197,94,0.15)] text-(--buy-green)"
                  : "bg-[rgba(239,68,68,0.15)] text-(--sell-red)"
                : "text-(--text-secondary)"
            }`}
          >
            {s === "buy" ? "Buy mBaseETH" : "Sell mBaseETH"}
          </button>
        ))}
      </div>

      <NumInput
        label="Target price (mUSDC)"
        sublabel="Will be encrypted 🔒"
        value={price}
        onChange={setPrice}
        placeholder="3250.55"
      />
      <NumInput
        label="Order volume (mBaseETH)"
        sublabel="Will be encrypted 🔒"
        value={amount}
        onChange={setAmount}
        placeholder="0.25"
      />

      <EncryptionStepBar step={step} />

      <button
        disabled={!ready}
        onClick={submit}
        className={`mt-4 flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-medium transition-all ${
          side === "buy"
            ? "bg-(--buy-green) text-(--bg-base) hover:opacity-90"
            : "bg-(--sell-red) text-(--text-primary) hover:opacity-90"
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
        {busy ? STEP_LABELS[step] : fheState !== "connected" ? "Initializing FHE…" : `Encrypt & ${side === "buy" ? "Buy" : "Sell"}`}
      </button>
      <p className="mt-2 text-center text-[10px] text-(--text-muted)">
        Inputs are scaled by 1e8 then encrypted as euint64 ciphertext.
      </p>
    </div>
  );
}

function NumInput({
  label,
  sublabel,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  sublabel: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="mt-4">
      <div className="mb-1.5 flex items-baseline justify-between">
        <label className="text-xs text-(--text-secondary)">{label}</label>
        <span className="text-[10px] text-(--accent-teal)">{sublabel}</span>
      </div>
      <input
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
        placeholder={placeholder}
        className="w-full rounded-md border border-(--border) bg-(--bg-base) px-3 py-2.5 font-mono text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--accent-teal) focus:outline-none"
      />
    </div>
  );
}

/* -------------------- Orders panel -------------------- */

function OrdersPanel({ address, enabled }: { address: `0x${string}`; enabled: boolean }) {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const qc = useQueryClient();
  const [cancellingId, setCancellingId] = useState<bigint | null>(null);

  const query = useQuery({
    queryKey: ["orders", address],
    enabled: enabled && !!publicClient && !!address,
    refetchInterval: 8_000,
    queryFn: async (): Promise<OrderMeta[]> => {
      const ids = (await publicClient!.readContract({
        abi: STEALTH_LIMIT_ORDER_ABI,
        address: CONTRACTS.StealthLimitOrder,
        functionName: "getMyOrderIds",
        account: address,
      })) as bigint[];
      if (!ids.length) return [];
      const metas = await Promise.all(
        ids.map(async (id) => {
          const r = (await publicClient!.readContract({
            abi: STEALTH_LIMIT_ORDER_ABI,
            address: CONTRACTS.StealthLimitOrder,
            functionName: "getOrderMeta",
            args: [id],
          })) as readonly [bigint, `0x${string}`, number, number, bigint, bigint];
          return {
            id: r[0],
            user: r[1],
            side: Number(r[2]),
            status: Number(r[3]),
            createdAt: r[4],
            executedAt: r[5],
          } satisfies OrderMeta;
        }),
      );
      return metas.sort((a, b) => Number(b.createdAt - a.createdAt));
    },
  });

  const open = useMemo(
    () => (query.data ?? []).filter((o) => o.status === ORDER_STATUS.Open),
    [query.data],
  );
  const history = useMemo(
    () => (query.data ?? []).filter((o) => o.status !== ORDER_STATUS.Open),
    [query.data],
  );

  async function cancel(id: bigint) {
    if (!walletClient || !publicClient) return;
    setCancellingId(id);
    try {
      const hash = await walletClient.writeContract({
        abi: STEALTH_LIMIT_ORDER_ABI,
        address: CONTRACTS.StealthLimitOrder,
        functionName: "cancelOrder",
        args: [id],
        gas: 3_000_000n, // Explicit safe limit for order cancellations
      });
      await publicClient.waitForTransactionReceipt({ hash });
      toast.success("Order cancelled");
      qc.invalidateQueries({ queryKey: ["orders", address] });
    } catch (e) {
      toast.error("Cancel failed", { description: mapContractError(e) });
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <OrdersTable
        title="Open Orders"
        empty="No active confidential orders found"
        loading={query.isLoading}
        orders={open}
        renderAction={(o) => (
          <button
            disabled={cancellingId === o.id}
            onClick={() => cancel(o.id)}
            className="inline-flex items-center gap-1 rounded-md border border-(--border) bg-(--bg-surface) px-2.5 py-1 text-xs text-(--text-secondary) hover:border-(--sell-red) hover:text-(--sell-red) disabled:opacity-50"
          >
            {cancellingId === o.id ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <X className="h-3 w-3" />
            )}
            Cancel
          </button>
        )}
      />
      <OrdersTable
        title="Transaction History"
        empty="No closed orders yet"
        loading={query.isLoading}
        orders={history}
        renderAction={(o) =>
          o.status === ORDER_STATUS.Executed ? (
            <span className="inline-flex items-center gap-1 text-xs text-(--buy-green)">
              <CheckCircle2 className="h-3.5 w-3.5" /> Filled
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-(--text-muted)">
              <XCircle className="h-3.5 w-3.5" /> Voided
            </span>
          )
        }
      />
    </div>
  );
}

function OrdersTable({
  title,
  empty,
  orders,
  loading,
  renderAction,
}: {
  title: string;
  empty: string;
  orders: OrderMeta[];
  loading: boolean;
  renderAction: (o: OrderMeta) => React.ReactNode;
}) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-(--border) px-5 py-3.5">
        <h3 className="font-display text-base text-(--text-primary)">{title}</h3>
        <span className="text-[10px] text-(--text-muted)">
          {orders.length} {orders.length === 1 ? "order" : "orders"}
        </span>
      </div>

      {loading ? (
        <div className="space-y-2 p-5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded-md bg-(--bg-surface)"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-5 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-(--bg-surface)">
            <Inbox className="h-5 w-5 text-(--text-muted)" />
          </div>
          <p className="text-sm text-(--text-secondary)">{empty}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--border) text-left text-[10px] tracking-[0.18em] text-(--text-muted) uppercase">
                <th className="px-5 py-2.5">ID</th>
                <th className="px-5 py-2.5">Side</th>
                <th className="px-5 py-2.5">Pair</th>
                <th className="px-5 py-2.5">Status</th>
                <th className="px-5 py-2.5">Created</th>
                <th className="px-5 py-2.5">Target / Volume</th>
                <th className="px-5 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id.toString()}
                  className="border-b border-(--border) last:border-0 hover:bg-(--bg-card-hover)"
                >
                  <td className="px-5 py-3.5 font-mono text-xs text-(--text-secondary)">
                    #{o.id.toString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <SidePill side={o.side} />
                  </td>
                  <td className="px-5 py-3.5 text-xs text-(--text-secondary)">
                    mUSDC/mBaseETH
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusPill status={o.status} />
                  </td>
                  <td className="px-5 py-3.5 text-xs text-(--text-muted)">
                    {formatTs(o.createdAt)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-(--accent-teal)/40 bg-(--accent-teal-dim) px-2 py-0.5 text-xs text-(--accent-teal)">
                      <Lock className="h-3 w-3" /> Encrypted
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">{renderAction(o)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SidePill({ side }: { side: number }) {
  const isBuy = side === ORDER_SIDE.Buy;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs ${
        isBuy
          ? "bg-[rgba(34,197,94,0.15)] text-(--buy-green)"
          : "bg-[rgba(239,68,68,0.15)] text-(--sell-red)"
      }`}
    >
      <ArrowUpRight className={`h-3 w-3 ${isBuy ? "" : "rotate-90"}`} />
      {isBuy ? "Buy" : "Sell"}
    </span>
  );
}

function StatusPill({ status }: { status: number }) {
  const map: Record<number, { text: string; cls: string }> = {
    [ORDER_STATUS.Open]: { text: "Open", cls: "text-(--accent-teal) bg-(--accent-teal-dim)" },
    [ORDER_STATUS.Executed]: { text: "Executed", cls: "text-(--buy-green) bg-[rgba(34,197,94,0.12)]" },
    [ORDER_STATUS.Cancelled]: { text: "Cancelled", cls: "text-(--text-muted) bg-(--bg-surface)" },
  };
  const m = map[status] ?? map[ORDER_STATUS.Cancelled];
  return (
    <span className={`inline-flex rounded-sm px-2 py-0.5 text-xs ${m.cls}`}>{m.text}</span>
  );
}

function formatTs(ts: bigint) {
  const d = new Date(Number(ts) * 1000);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}