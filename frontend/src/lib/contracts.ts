import type { Abi } from "viem";

export const CONTRACTS = {
  MockUSDC: "0xeb2c9000e6acdb5b661bb143dbf30856f2a655e9",
  MockBaseETH: "0x861fbba0ca51ffde6a2f306f3a03ac1da363a8da",
  MockPool: "0xae35f226c3e86c5c4fca2df59b84394008bb539f",
  StealthLimitOrder: "0x8d3116ab88851ee65c3eb28b059e9b75c92eb217",
} as const;

export const BASE_SEPOLIA_CHAIN_ID = 84532;

export const STEALTH_LIMIT_ORDER_ABI = [
  {
    type: "function",
    name: "createBuyOrder",
    inputs: [
      {
        name: "encryptedTargetPrice",
        type: "tuple",
        components: [
          { name: "ctHash", type: "uint256" },
          { name: "securityZone", type: "uint8" },
          { name: "utype", type: "uint8" },
          { name: "signature", type: "bytes" },
        ],
      },
      {
        name: "encryptedAmount",
        type: "tuple",
        components: [
          { name: "ctHash", type: "uint256" },
          { name: "securityZone", type: "uint8" },
          { name: "utype", type: "uint8" },
          { name: "signature", type: "bytes" },
        ],
      },
    ],
    outputs: [{ name: "orderId", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "createSellOrder",
    inputs: [
      {
        name: "encryptedTargetPrice",
        type: "tuple",
        components: [
          { name: "ctHash", type: "uint256" },
          { name: "securityZone", type: "uint8" },
          { name: "utype", type: "uint8" },
          { name: "signature", type: "bytes" },
        ],
      },
      {
        name: "encryptedAmount",
        type: "tuple",
        components: [
          { name: "ctHash", type: "uint256" },
          { name: "securityZone", type: "uint8" },
          { name: "utype", type: "uint8" },
          { name: "signature", type: "bytes" },
        ],
      },
    ],
    outputs: [{ name: "orderId", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "cancelOrder",
    inputs: [{ name: "orderId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getMyOrderIds",
    inputs: [],
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getOrderMeta",
    inputs: [{ name: "orderId", type: "uint256" }],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "user", type: "address" },
      { name: "side", type: "uint8" },
      { name: "status", type: "uint8" },
      { name: "createdAt", type: "uint256" },
      { name: "executedAt", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "OrderCreated",
    inputs: [
      { name: "orderId", type: "uint256", indexed: true },
      { name: "user", type: "address", indexed: true },
      { name: "side", type: "uint8", indexed: false },
    ],
  },
  {
    type: "event",
    name: "OrderExecuted",
    inputs: [
      { name: "orderId", type: "uint256", indexed: true },
      { name: "user", type: "address", indexed: true },
      { name: "marketPrice", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "OrderCancelled",
    inputs: [
      { name: "orderId", type: "uint256", indexed: true },
      { name: "user", type: "address", indexed: true },
    ],
  },
] as const satisfies Abi;

export const ORDER_SIDE = { Buy: 0, Sell: 1 } as const;
export const ORDER_STATUS = { Open: 0, Executed: 1, Cancelled: 2 } as const;

export type OrderMeta = {
  id: bigint;
  user: `0x${string}`;
  side: number;
  status: number;
  createdAt: bigint;
  executedAt: bigint;
};

// Map custom contract errors to friendly messages
export const CONTRACT_ERROR_MESSAGES: Record<string, string> = {
  StealthLimitOrder__DecryptFailed: "FHE decryption failed onchain. Try again.",
  InvalidOrder: "Invalid order parameters.",
  NotOrderOwner: "You are not the owner of this order.",
  OrderNotOpen: "This order is no longer open.",
};

export function mapContractError(err: unknown): string {
  const msg = (err as Error)?.message ?? String(err);
  for (const key of Object.keys(CONTRACT_ERROR_MESSAGES)) {
    if (msg.includes(key)) return CONTRACT_ERROR_MESSAGES[key];
  }
  if (msg.includes("User rejected")) return "Transaction rejected.";
  if (msg.length > 180) return msg.slice(0, 180) + "…";
  return msg || "Unknown error";
}
