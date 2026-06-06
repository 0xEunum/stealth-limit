export async function fetchEthPriceUsd(): Promise<number> {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
    { headers: { accept: "application/json" } },
  );
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  const json = (await res.json()) as { ethereum?: { usd?: number } };
  const v = json?.ethereum?.usd;
  if (typeof v !== "number") throw new Error("Bad CoinGecko payload");
  return v;
}
