# StealthLimit

StealthLimit is a confidential limit order application built on **Base Sepolia** using **Fhenix CoFHE** for client-side encryption and confidential smart contract execution. Users place private buy and sell orders where `targetPrice` and `amount` are encrypted on the frontend before submission.[cite:365][cite:504]

## Overview

The project has three core parts:

- **Smart contracts** for order creation, encrypted order storage, and mock settlement.
- **Keeper service** for off-chain automation of order execution based on ETH price.[cite:490][cite:487]
- **Frontend** for wallet connection, encryption, and order submission using CoFHE.[cite:365][cite:504]

CoFHE’s client SDK is built for an encrypt-then-submit workflow, where plaintext values are encrypted into `InE*` inputs on the client and then passed into Solidity contract calls.[cite:365][cite:504]

## Architecture

### Smart Contracts

The contracts layer contains:

- `MockUSDC.sol` — mintable ERC-20 token with 6 decimals.
- `MockBaseETH.sol` — mintable ERC-20 token with 18 decimals.
- `MockPool.sol` — mock settlement pool and ETH price holder.
- `StealthLimitOrder.sol` — confidential order book contract using CoFHE encrypted inputs and encrypted state.

The Solidity side stores encrypted values as `euint64` and accepts encrypted client input as `InEuint64`, which is the expected CoFHE contract pattern.[cite:365][cite:70]

### Keeper Service

The keeper is a lightweight Node.js worker, not a full backend API. Since smart contracts cannot fetch off-chain prices or self-trigger on a timer, the keeper follows the standard off-chain automation flow: fetch ETH/USD price, read open orders, and call `executeOrder(orderId, currentPrice)` when conditions are met.[cite:490][cite:487]

### Frontend

The frontend is responsible for:

- connecting a real wallet,
- enforcing Base Sepolia,
- encrypting `targetPrice` and `amount` using `@cofhe/sdk`,
- and submitting encrypted inputs to `StealthLimitOrder`.[cite:365][cite:504]

No dummy wallets, mock order placement, or fake balances should be used in the final app.

## Deployed Contracts

Network: **Base Sepolia**

| Contract | Address |
|---------|---------|
| MockUSDC | `0xeb2c9000e6acdb5b661bb143dbf30856f2a655e9` |
| MockBaseETH | `0x861fbba0ca51ffde6a2f306f3a03ac1da363a8da` |
| MockPool | `0xae35f226c3e86c5c4fca2df59b84394008bb539f` |
| StealthLimitOrder | `0x8d3116ab88851ee65c3eb28b059e9b75c92eb217` |

## Frontend

Frontend link:

## Project Structure

    contracts/
    ├── src/
    │   ├── core/
    │   │   └── StealthLimitOrder.sol
    │   └── mocks/
    │       ├── MockUSDC.sol
    │       ├── MockBaseETH.sol
    │       └── MockPool.sol
    ├── script/
    │   ├── DeployStealthLimitOrder.s.sol
    │   └── SeedPool.s.sol
    └── foundry.toml

    server/
    ├── config.js
    ├── keeper.js
    ├── package.json
    └── .env

    frontend/
    └── wallet-connected React app with CoFHE encryption

## Smart Contract Flow

### Order Creation

1. User connects wallet on the frontend.
2. User selects **Buy** or **Sell**.
3. User enters `targetPrice` and `amount`.
4. Frontend converts values into integer units.
5. Frontend encrypts both values with CoFHE.
6. Frontend submits `createBuyOrder(...)` or `createSellOrder(...)` with encrypted inputs.[cite:365][cite:504]

### Order Execution

1. Keeper fetches ETH/USD from CoinGecko.
2. Keeper converts the price into 6-decimal USDC units.
3. Keeper fetches open orders from `StealthLimitOrder`.
4. Keeper calls `executeOrder(orderId, currentPrice)`.
5. Contract checks encrypted trigger conditions and settles through `MockPool`.[cite:490][cite:487]

## Units and Decimals

Correct unit handling matters throughout the app:

- `MockUSDC` uses 6 decimals.[cite:515]
- `MockBaseETH` uses 18 decimals.[cite:515]
- `targetPrice` should be stored as USDC-per-ETH with 6 decimal precision.

Examples:

- `2500.12 USD` → `2500120000`
- `100 USDC` → `100000000`
- `0.5 mBETH` → `500000000000000000`

## Local Development

### Contracts

Install dependencies and build:

    npm install
    forge build

Deploy locally with Anvil:

    forge script script/DeployStealthLimitOrder.s.sol:DeployStealthLimitOrder \
      --rpc-url http://127.0.0.1:8545 \
      --broadcast

Seed pool liquidity:

    forge script script/SeedPool.s.sol:SeedPool \
      --rpc-url http://127.0.0.1:8545 \
      --broadcast

### Keeper

Inside `server/`, install dependencies:

    npm install

Create `.env`:

    RPC_URL=https://sepolia.base.org
    PRIVATE_KEY=your_keeper_private_key
    ORDER_BOOK_ADDRESS=0x8d3116ab88851ee65c3eb28b059e9b75c92eb217

Start the keeper:

    npm start

### Frontend

Frontend requirements:

- React + TypeScript
- wagmi + viem
- Base Sepolia wallet connection
- CoFHE encryption before order submission
- no dummy wallets or fake data

## Verification and Deployment Notes

Contracts were deployed and verified on **Base Sepolia**. Foundry verification commonly uses explorer-specific API keys and Etherscan-compatible verification endpoints for supported networks like Base Sepolia.[cite:439][cite:438]

## Keeper Notes

A traditional backend API is not required for the MVP. The frontend can interact directly with contracts, while the keeper runs separately as a small automation worker.[cite:494][cite:487]

## Current Status

- Smart contracts written and deployed
- Contracts verified on Base Sepolia
- Mock pool seeded with liquidity
- Keeper service created
- Frontend pending / in progress

## Future Improvements

- Add full frontend order UX and order history views
- Improve on-chain and off-chain indexing
- Add stronger keeper retry and rate-limit handling
- Add encrypted order lifecycle tests
- Replace mock settlement with production-ready liquidity routing
