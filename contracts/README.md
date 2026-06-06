# Contracts

This folder contains the Foundry smart contracts for **StealthLimit**. The contracts implement confidential limit orders with **Fhenix CoFHE**, using encrypted inputs for `targetPrice` and `amount` and a mock liquidity pool for settlement.[cite:365][cite:70]

## Contracts

- `src/core/StealthLimitOrder.sol` — main confidential order book contract.
- `src/mocks/MockUSDC.sol` — mintable 6-decimal ERC-20 token for USDC-like balances.
- `src/mocks/MockBaseETH.sol` — mintable 18-decimal ERC-20 token representing ETH.
- `src/mocks/MockPool.sol` — mock pool used for price-based settlement.

## Core Idea

The contract accepts encrypted order inputs from the frontend and stores confidential order values on-chain using CoFHE encrypted types. CoFHE’s contract-side pattern uses encrypted types like `euint64` in storage and encrypted client inputs like `InEuint64` for write functions.[cite:365][cite:70]

## Main Flow

### Order Creation

1. User connects wallet in the frontend.
2. Frontend encrypts `targetPrice` and `amount` with CoFHE.
3. Frontend calls `createBuyOrder(...)` or `createSellOrder(...)`.
4. Contract stores encrypted values for the order.

### Order Execution

1. Off-chain keeper fetches ETH price.
2. Keeper calls `executeOrder(orderId, currentPrice)`.
3. Contract checks whether encrypted price condition is satisfied.
4. If valid, the order settles through `MockPool`.

## Deployed Contracts

Network: **Base Sepolia**

| Contract | Address |
|---------|---------|
| MockUSDC | `0xeb2c9000e6acdb5b661bb143dbf30856f2a655e9` |
| MockBaseETH | `0x861fbba0ca51ffde6a2f306f3a03ac1da363a8da` |
| MockPool | `0xae35f226c3e86c5c4fca2df59b84394008bb539f` |
| StealthLimitOrder | `0x8d3116ab88851ee65c3eb28b059e9b75c92eb217` |

## Directory Layout

    src/
    ├── core/
    │   └── StealthLimitOrder.sol
    └── mocks/
        ├── MockUSDC.sol
        ├── MockBaseETH.sol
        └── MockPool.sol

    script/
    ├── DeployStealthLimitOrder.s.sol
    └── SeedPool.s.sol

    foundry.toml
    remappings.txt

## Setup

Install dependencies:

    npm install
    forge install foundry-rs/forge-std

Build contracts:

    forge build

## Local Deployment

Start Anvil in a separate terminal, then run:

    forge script script/DeployStealthLimitOrder.s.sol:DeployStealthLimitOrder \
      --rpc-url http://127.0.0.1:8545 \
      --broadcast

Seed pool liquidity:

    forge script script/SeedPool.s.sol:SeedPool \
      --rpc-url http://127.0.0.1:8545 \
      --broadcast

## Testnet Deployment

Deploy to Base Sepolia:

    forge script script/DeployStealthLimitOrder.s.sol:DeployStealthLimitOrder \
      --rpc-url https://sepolia.base.org \
      --broadcast \
      --verify

Verification generally uses explorer API keys with Etherscan-compatible endpoints for supported testnets such as Base Sepolia.[cite:439][cite:438]

## Important Units

- `MockUSDC` uses 6 decimals.[cite:515]
- `MockBaseETH` uses 18 decimals.[cite:515]
- `targetPrice` is represented as a 6-decimal USDC-per-ETH integer.

Examples:

- `2500.12 USD` → `2500120000`
- `100 USDC` → `100000000`
- `0.5 mBETH` → `500000000000000000`

## Notes

- `StealthLimitOrder` is designed for encrypted order submission from the frontend.
- `MockPool` is only a testing settlement layer and not production liquidity infrastructure.
- Off-chain automation is required for execution because contracts cannot fetch market prices on their own.[cite:490][cite:487]

## Next Improvements

- Add Foundry tests for create, cancel, and execute flows.
- Improve contract events and indexing support.
- Replace mock settlement logic with production-ready routing.
