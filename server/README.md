# Server

This folder contains the **StealthLimit keeper service**. It is a lightweight Node.js worker that monitors ETH price and calls the on-chain order execution function when open orders may be executable.[cite:490][cite:487]

## Purpose

The server is not a traditional backend API. It exists only as an automation worker because smart contracts cannot poll CoinGecko or run themselves on a timer.[cite:490][cite:487]

Its responsibilities are:

- fetch ETH/USD from CoinGecko,[cite:392]
- convert the price into the contract’s 6-decimal USDC format,
- read open orders from `StealthLimitOrder`,
- call `executeOrder(orderId, currentPrice)`.

## Files

- `config.js` — loads environment variables and creates the RPC provider and signer.
- `keeper.js` — main loop for fetching price, reading orders, and submitting execution transactions.
- `package.json` — Node.js package definition using ES modules.

## Flow

1. Load RPC URL, private key, and order book address from `.env`.
2. Connect to the deployed `StealthLimitOrder` contract.
3. Fetch ETH/USD price from CoinGecko’s simple price endpoint.[cite:392]
4. Convert the value to 6-decimal USDC units.
5. Fetch open order IDs.
6. Attempt `executeOrder(...)` for each open order.
7. Sleep for a short interval and repeat.

This matches the common off-chain read/check/write automation model used by keeper-style blockchain services.[cite:490][cite:487]

## Setup

Install dependencies:

    npm install

Create `.env`:

    RPC_URL=https://sepolia.base.org
    PRIVATE_KEY=your_keeper_private_key
    ORDER_BOOK_ADDRESS=0x8d3116ab88851ee65c3eb28b059e9b75c92eb217

## Run

Start the keeper:

    npm start

The current package setup uses ES modules, so `package.json` should keep `"type": "module"` for `import` syntax to work correctly in Node.js.[cite:458][cite:465]

## Contract ABI Used

The keeper currently uses these contract functions:

- `getOpenOrderIds()`
- `getOrderMeta(uint256 orderId)`
- `executeOrder(uint256 orderId, uint256 currentPrice)`

## Price Source

The keeper uses CoinGecko’s simple price endpoint for ETH/USD because it is straightforward for a small automation worker. CoinGecko documents a simple `/simple/price` flow for returning prices like `ethereum -> usd`.[cite:392]

## Important Notes

- This service is meant to be run as a worker, not as a user-facing API.
- The frontend can talk directly to the smart contracts without going through this service.[cite:494][cite:487]
- If the keeper is offline, orders will not auto-execute until it comes back online or someone manually calls `executeOrder(...)`.[cite:487]

## Deployment Options

For an MVP, the keeper can run on:

- Railway
- Render
- Fly.io
- a VPS
- a local machine during demos

A persistent worker is enough; no database or HTTP API is required for the current design.[cite:489][cite:487]

## Future Improvements

- Add retry backoff for rate limits and RPC failures.
- Add structured logging.
- Add fallback price sources.
- Add alerts for failed execution cycles.
