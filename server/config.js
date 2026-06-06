import "dotenv/config";
import { ethers } from "ethers";

export const RPC_URL = process.env.RPC_URL;
export const PRIVATE_KEY = process.env.PRIVATE_KEY;
export const ORDER_BOOK_ADDRESS = process.env.ORDER_BOOK_ADDRESS;

if (!RPC_URL || !PRIVATE_KEY || !ORDER_BOOK_ADDRESS) {
  throw new Error("Missing RPC_URL, PRIVATE_KEY, or ORDER_BOOK_ADDRESS in .env");
}

export const provider = new ethers.JsonRpcProvider(RPC_URL);
export const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

export const orderBookAbi = [
  "function getOpenOrderIds() external view returns (uint256[] memory)",
  "function getOrderMeta(uint256 orderId) external view returns (uint256 id, address user, uint8 side, uint8 status, uint256 createdAt, uint256 executedAt)",
  "function executeOrder(uint256 orderId, uint256 currentPrice) external returns (bool executed)"
];