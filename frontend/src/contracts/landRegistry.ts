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

export function getLandRegistryAddress() {
  const addr = import.meta.env.VITE_LAND_REGISTRY_ADDRESS as string | undefined;
  if (!addr) throw new Error("Missing VITE_LAND_REGISTRY_ADDRESS in frontend/.env");
  return addr;
}

