export const landRegistryAbi = [
  {
    "type": "function",
    "name": "nextId",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }]
  },
  {
    "type": "function",
    "name": "registerLand",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "parcelId", "type": "string" },
      { "name": "location", "type": "string" },
      { "name": "areaSqm", "type": "uint256" }
    ],
    "outputs": [{ "name": "id", "type": "uint256" }]
  },
  {
    "type": "function",
    "name": "getLand",
    "stateMutability": "view",
    "inputs": [{ "name": "id", "type": "uint256" }],
    "outputs": [
      {
        "type": "tuple",
        "components": [
          { "name": "id", "type": "uint256" },
          { "name": "parcelId", "type": "string" },
          { "name": "location", "type": "string" },
          { "name": "areaSqm", "type": "uint256" },
          { "name": "owner", "type": "address" },
          { "name": "exists", "type": "bool" }
        ]
      }
    ]
  },
  {
    "type": "function",
    "name": "findByParcelId",
    "stateMutability": "view",
    "inputs": [{ "name": "parcelId", "type": "string" }],
    "outputs": [{ "name": "id", "type": "uint256" }]
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "id", "type": "uint256" },
      { "name": "to", "type": "address" }
    ],
    "outputs": []
  },
  {
    "type": "event",
    "name": "LandRegistered",
    "inputs": [
      { "name": "id", "type": "uint256", "indexed": true },
      { "name": "parcelId", "type": "string", "indexed": false },
      { "name": "owner", "type": "address", "indexed": true }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnershipTransferred",
    "inputs": [
      { "name": "id", "type": "uint256", "indexed": true },
      { "name": "from", "type": "address", "indexed": true },
      { "name": "to", "type": "address", "indexed": true }
    ],
    "anonymous": false
  }
] as const;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function getLandRegistryAddressForChain(
  chainId: number | undefined
): { address: `0x${string}` | null; error: string | null } {
  const id = chainId ?? 31337;
  const envKey = `VITE_LAND_REGISTRY_ADDRESS_${id}` as const;
  const raw = ((import.meta as any).env?.[envKey] as string | undefined)?.trim();

  if (!raw) {
    return {
      address: null,
      error: `Missing ${envKey}. Deploy contracts to this network and set the address (deploy script auto-appends it to frontend/.env.local).`
    };
  }
  if (!raw.startsWith("0x") || raw.length !== 42) {
    return { address: null, error: `${envKey} is not a valid address.` };
  }
  if (raw.toLowerCase() === ZERO_ADDRESS) {
    return { address: null, error: `${envKey} is still the placeholder zero-address. Deploy the contract and set the address.` };
  }
  return { address: raw as `0x${string}`, error: null };
}

