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
npm run deploy:localhost
```

This also writes `frontend/.env.local` automatically with the correct contract address.

### 2) Frontend

```bash
cd frontend
npm install
```

If you didn’t use the deploy script, then do:

```bash
copy .env.example .env
```

And set `VITE_LAND_REGISTRY_ADDRESS` to the deployed address.

Run the app:

```bash
npm run dev
```

Open the URL shown (usually `http://localhost:5173`).

## Deploy to Sepolia testnet

### 1) Configure environment

Create `contracts/.env`:

```bash
cd contracts
copy .env.example .env
```

Set:

- `SEPOLIA_RPC_URL` (Alchemy/Infura/your RPC)
- `DEPLOYER_PRIVATE_KEY` (testnet key with Sepolia ETH)

### 2) Deploy

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network sepolia
```

This appends `VITE_LAND_REGISTRY_ADDRESS_11155111=...` into `frontend/.env.local`.

### 3) Run frontend

```bash
cd frontend
npm run dev
```

In MetaMask, switch to **Sepolia**. The UI will use the Sepolia contract automatically.

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

