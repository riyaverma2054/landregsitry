# Blockchain-based Land Ownership System

This repo contains:

- `contracts/`: Hardhat + Solidity smart contract for land registration & transfer
- `frontend/`: React dApp (Vite) to interact with the contract

## Prereqs

- Node.js 18+ (recommended 20+)
- Git
- MetaMask (or any injected wallet)

## Quick start (local dev)

### 1) Smart contracts

```bash
cd contracts
npm install
npx hardhat node
```

In a **new** terminal:

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network localhost
```

Copy the deployed contract address printed in the console.

### 2) Frontend

```bash
cd frontend
npm install
copy .env.example .env
```

Edit `frontend/.env` and set:

- `VITE_LAND_REGISTRY_ADDRESS` to the deployed address from step 1

Run the app:

```bash
npm run dev
```

Open the URL shown (usually `http://localhost:5173`).

## Using MetaMask with Hardhat local node

- Network: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency symbol: `ETH`

Import one of the private keys that Hardhat prints when you run `npx hardhat node`.

## Repo structure

```
contracts/  # Solidity + Hardhat
frontend/   # React dApp
```

