import { Contract } from "ethers";
import { ORDER_BOOK_ADDRESS, orderBookAbi, wallet } from "./config.js";

const orderBook = new Contract(ORDER_BOOK_ADDRESS, orderBookAbi, wallet);

async function fetchEthPriceUsd() {
  const url = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`CoinGecko price fetch failed: ${res.status}`);
  }

  const data = await res.json();
  const price = data?.ethereum?.usd;

  if (typeof price !== "number") {
    throw new Error("Invalid ETH price response from CoinGecko");
  }

  return price;
}

function toUsdcPriceUnits(usdPrice) {
  return Math.round(usdPrice * 1e6);
}

async function runKeeperCycle() {
  const ethPriceUsd = await fetchEthPriceUsd();
  const currentPrice = toUsdcPriceUnits(ethPriceUsd);

  console.log(`[keeper] ETH/USD: $${ethPriceUsd} | contractPrice: ${currentPrice}`);

  const openOrderIds = await orderBook.getOpenOrderIds();
  console.log(`[keeper] Open orders: ${openOrderIds.length}`);

  for (const orderId of openOrderIds) {
    try {
      const meta = await orderBook.getOrderMeta(orderId);

      if (Number(meta.status) !== 0) {
        continue;
      }

      const tx = await orderBook.executeOrder(orderId, currentPrice);
      console.log(`[keeper] executeOrder(${orderId}) tx sent: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(`[keeper] executeOrder(${orderId}) mined in block ${receipt.blockNumber}`);
    } catch (err) {
      console.log(`[keeper] order ${orderId} skipped: ${err.reason || err.message}`);
    }
  }
}

async function main() {
  console.log("[keeper] started");

  while (true) {
    try {
      await runKeeperCycle();
    } catch (err) {
      console.error("[keeper] cycle failed:", err.message);
    }

    await new Promise((resolve) => setTimeout(resolve, 15000));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});