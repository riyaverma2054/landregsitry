import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract
} from "wagmi";
import { isAddress } from "viem";
import { getLandRegistryAddressForChain, landRegistryAbi } from "../contracts/landRegistry";

function shortAddr(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function storageKey(chainId: number | undefined) {
  return `landRegistryAddress:${chainId ?? 31337}`;
}

type DemoLand = {
  id: number;
  parcelId: string;
  location: string;
  areaSqm: number;
  owner: string;
};

function demoKey(chainId: number | undefined) {
  return `demoLands:${chainId ?? 31337}`;
}

function loadDemo(chainId: number | undefined): DemoLand[] {
  try {
    const raw = localStorage.getItem(demoKey(chainId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DemoLand[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveDemo(chainId: number | undefined, lands: DemoLand[]) {
  localStorage.setItem(demoKey(chainId), JSON.stringify(lands));
}

function Card(props: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-sm">
      <div className="mb-4 text-sm font-semibold tracking-wide text-slate-200">{props.title}</div>
      {props.children}
    </div>
  );
}

function Label(props: { children: React.ReactNode }) {
  return <div className="mb-1 text-xs font-medium text-slate-300">{props.children}</div>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-slate-100",
        "placeholder:text-slate-500 outline-none focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/20",
        props.className ?? ""
      ].join(" ")}
    />
  );
}

function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  const variant = props.variant ?? "primary";
  const cls =
    variant === "primary"
      ? "bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-400"
      : "bg-transparent hover:bg-slate-800/60 border border-slate-800 disabled:text-slate-500";
  return (
    <button
      {...props}
      className={[
        "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
        cls,
        props.className ?? ""
      ].join(" ")}
    />
  );
}

export function App() {
  const { address, chain } = useAccount();
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();

  const [manualContractAddress, setManualContractAddress] = useState<string>("");
  const [manualSavedForChain, setManualSavedForChain] = useState<`0x${string}` | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(storageKey(chain?.id)) ?? "";
      setManualContractAddress(v);
      setManualSavedForChain(isAddress(v) ? (v as `0x${string}`) : null);
    } catch {
      setManualContractAddress("");
      setManualSavedForChain(null);
    }
  }, [chain?.id]);

  const contractCfg = useMemo(() => getLandRegistryAddressForChain(chain?.id), [chain?.id]);
  const contractAddress = manualSavedForChain ?? contractCfg.address;

  const [parcelId, setParcelId] = useState("");
  const [location, setLocation] = useState("");
  const [areaSqm, setAreaSqm] = useState("100");

  const [lookupParcelId, setLookupParcelId] = useState("");
  const [lookupId, setLookupId] = useState("");

  const [transferId, setTransferId] = useState("");
  const [transferTo, setTransferTo] = useState("");

  const contractReady = !!contractAddress;
  const supportedChain = chain?.id === 31337 || chain?.id === 11155111;
  const canPromptSwitch = !!address && (!supportedChain || !contractReady);

  const { writeContractAsync, isPending: isWriting } = useWriteContract();
  const [txMsg, setTxMsg] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<`0x${string}` | null>(null);
  const [pendingAction, setPendingAction] = useState<"register" | "transfer" | null>(null);

  const { isLoading: isWaiting, isSuccess: txMined, isError: txFailed } = useWaitForTransactionReceipt({
    hash: lastTxHash ?? undefined
  });

  const registerDisabledReason = !address
    ? "Connect MetaMask."
    : !supportedChain
      ? "Switch network to Hardhat (31337) or Sepolia (11155111)."
      : !contractReady && !demoMode
        ? "Deploy the contract to this network and set the contract address."
        : !parcelId.trim() || !location.trim() || !(Number.isFinite(Number(areaSqm)) && Number(areaSqm) > 0)
          ? "Fill Parcel ID, Location and Area."
          : isWaiting || isWriting
            ? "Transaction pending…"
            : null;

  const { data: nextId } = useReadContract({
    address: contractAddress ?? "0x0000000000000000000000000000000000000000",
    abi: landRegistryAbi,
    functionName: "nextId",
    query: { enabled: contractReady }
  });

  const {
    data: foundId,
    refetch: refetchFoundId,
    error: findErr,
    isFetching: isFinding
  } = useReadContract({
    address: contractAddress ?? "0x0000000000000000000000000000000000000000",
    abi: landRegistryAbi,
    functionName: "findByParcelId",
    args: lookupParcelId ? [lookupParcelId] : undefined,
    query: { enabled: false }
  });

  const {
    data: land,
    refetch: refetchLand,
    error: landErr,
    isFetching: isFetchingLand
  } = useReadContract({
    address: contractAddress ?? "0x0000000000000000000000000000000000000000",
    abi: landRegistryAbi,
    functionName: "getLand",
    args: /^\d+$/.test(lookupId.trim()) ? [BigInt(lookupId.trim())] : undefined,
    query: { enabled: false }
  });

  useEffect(() => {
    if (!lastTxHash) return;
    if (txMined) {
      setTxMsg(
        pendingAction === "register"
          ? "Confirmed. Your land is registered. Now use Find/Get to read it from the contract."
          : "Confirmed. Ownership transfer completed."
      );
      setPendingAction(null);
    } else if (txFailed) {
      setTxMsg("Transaction failed or was rejected. Check MetaMask for the exact reason.");
      setPendingAction(null);
    }
  }, [lastTxHash, pendingAction, txFailed, txMined]);

  const canRegister =
    (demoMode || contractReady) &&
    !!address &&
    supportedChain &&
    parcelId.trim().length > 0 &&
    location.trim().length > 0 &&
    Number.isFinite(Number(areaSqm)) &&
    Number(areaSqm) > 0 &&
    !isWriting &&
    !isWaiting;

  async function onRegister() {
    setTxMsg(null);
    if (demoMode) {
      const lands = loadDemo(chain?.id);
      const trimmed = parcelId.trim();
      const exists = lands.some((l) => l.parcelId.toLowerCase() === trimmed.toLowerCase());
      if (exists) {
        setTxMsg("Demo: This Parcel ID is already registered.");
        return;
      }
      const newId = lands.length ? Math.max(...lands.map((l) => l.id)) + 1 : 1;
      const land: DemoLand = {
        id: newId,
        parcelId: trimmed,
        location: location.trim(),
        areaSqm: Math.floor(Number(areaSqm)),
        owner: address!
      };
      const next = [...lands, land];
      saveDemo(chain?.id, next);
      setTxMsg(`Demo: Successfully registered. ID = ${newId}`);
      setLookupParcelId(trimmed);
      setLookupId(String(newId));
      setParcelId("");
      setLocation("");
      return;
    }
    setPendingAction("register");
    const hash = (await writeContractAsync({
      address: contractAddress!,
      abi: landRegistryAbi,
      functionName: "registerLand",
      args: [parcelId.trim(), location.trim(), BigInt(Math.floor(Number(areaSqm)))]
    })) as `0x${string}`;
    setLastTxHash(hash);
    setTxMsg(`Transaction sent. Waiting for confirmation… (${hash.slice(0, 10)}…)`);
    setParcelId("");
    setLocation("");
  }

  async function onFind() {
    setTxMsg(null);
    if (!lookupParcelId.trim()) return;
    if (demoMode) {
      const lands = loadDemo(chain?.id);
      const hit = lands.find((l) => l.parcelId.toLowerCase() === lookupParcelId.trim().toLowerCase());
      if (!hit) {
        setTxMsg("Demo: Parcel not found.");
        return;
      }
      setLookupId(String(hit.id));
      setTxMsg(`Demo: Found ID = ${hit.id}`);
      return;
    }
    if (!contractReady) return;
    await refetchFoundId();
  }

  async function onGetLand() {
    setTxMsg(null);
    if (!/^\d+$/.test(lookupId.trim())) return;
    if (demoMode) {
      const lands = loadDemo(chain?.id);
      const id = Number(lookupId.trim());
      const hit = lands.find((l) => l.id === id);
      if (!hit) {
        setTxMsg("Demo: Land not found.");
        return;
      }
      setTxMsg(`Demo: Verified Parcel ${hit.parcelId} (Owner ${shortAddr(hit.owner)})`);
      return;
    }
    if (!contractReady) return;
    await refetchLand();
  }

  const canTransfer =
    contractReady &&
    !!address &&
    supportedChain &&
    transferId.trim().length > 0 &&
    isAddress(transferTo.trim()) &&
    !isWriting &&
    !isWaiting;

  async function onTransfer() {
    setTxMsg(null);
    setPendingAction("transfer");
    const hash = (await writeContractAsync({
      address: contractAddress!,
      abi: landRegistryAbi,
      functionName: "transferOwnership",
      args: [BigInt(transferId.trim()), transferTo.trim() as `0x${string}`]
    })) as `0x${string}`;
    setLastTxHash(hash);
    setTxMsg(`Transaction sent. Waiting for confirmation… (${hash.slice(0, 10)}…)`);
    setTransferId("");
    setTransferTo("");
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-3 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/60 to-slate-950/60 p-6">
            <div className="flex flex-col gap-1">
              <div className="text-2xl font-semibold tracking-tight">Land Registry</div>
              <div className="text-sm text-slate-300">
                Register land parcels and transfer ownership on-chain (Hardhat local or Sepolia testnet).
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-300">
                <div>
                  <span className="text-slate-400">Contract</span>{" "}
                  <span className="font-mono text-slate-200">
                    {contractAddress ? shortAddr(contractAddress) : "Not configured"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Next ID</span>{" "}
                  <span className="font-mono text-slate-200">{nextId?.toString?.() ?? "-"}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!address ? (
                  <>
                    {connectors.map((c) => (
                      <Button
                        key={c.uid}
                        onClick={() => connect({ connector: c })}
                        disabled={isConnecting}
                      >
                        Connect wallet
                      </Button>
                    ))}
                  </>
                ) : (
                  <>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm">
                      <div className="text-xs text-slate-400">Connected</div>
                      <div className="font-mono">{shortAddr(address)}</div>
                      <div className="text-xs text-slate-400">{chain?.name ?? "Unknown network"}</div>
                    </div>
                    <Button variant="ghost" onClick={() => disconnect()}>
                      Disconnect
                    </Button>
                  </>
                )}
              </div>
            </div>

            {txMsg ? (
              <div className="rounded-2xl border border-indigo-700/40 bg-indigo-950/20 px-4 py-3 text-sm text-indigo-200">
                {txMsg}
              </div>
            ) : null}

            {!contractReady ? (
              <div className="rounded-2xl border border-amber-700/40 bg-amber-950/20 px-4 py-3 text-sm text-amber-100">
                <div>{contractCfg.error}</div>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div>
                    <div className="mb-1 text-xs font-medium text-amber-100/90">
                      Set contract address for this network (saved in your browser)
                    </div>
                    <Input
                      value={manualContractAddress}
                      onChange={(e) => setManualContractAddress(e.target.value)}
                      placeholder="0x..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={!isAddress(manualContractAddress)}
                      onClick={() => {
                        const v = manualContractAddress.trim();
                        if (!isAddress(v)) return;
                        localStorage.setItem(storageKey(chain?.id), v);
                        setManualSavedForChain(v as `0x${string}`);
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        localStorage.removeItem(storageKey(chain?.id));
                        setManualContractAddress("");
                        setManualSavedForChain(null);
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="mt-2 text-xs text-amber-100/80">
                  If you just deployed and wrote `frontend/.env.local`, restart `npm run dev` so Vite reloads env vars.
                </div>
                <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-xs text-slate-200">
                  <div className="font-medium text-slate-100">No contract yet? Use Demo mode</div>
                  <div className="mt-1 text-slate-300">
                    Demo mode stores registrations in your browser so you can show “Registered” and “Verified” flows without gas.
                  </div>
                  <label className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={demoMode}
                      onChange={(e) => setDemoMode(e.target.checked)}
                    />
                    <span>Enable Demo mode (local verification)</span>
                  </label>
                </div>
              </div>
            ) : null}
          </header>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card title="Register land">
              <div className="space-y-3">
                <div>
                  <Label>Parcel ID</Label>
                  <Input value={parcelId} onChange={(e) => setParcelId(e.target.value)} placeholder="e.g. PCL-1001" />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Sector 12, City" />
                </div>
                <div>
                  <Label>Area (sqm)</Label>
                  <Input
                    value={areaSqm}
                    onChange={(e) => setAreaSqm(e.target.value)}
                    inputMode="numeric"
                    placeholder="e.g. 250"
                  />
                </div>
                <Button onClick={onRegister} disabled={!canRegister}>
                  {isWriting || (isWaiting && pendingAction === "register") ? "Submitting..." : "Register"}
                </Button>
                {!canRegister && registerDisabledReason ? (
                  <div className="text-xs text-amber-200">{registerDisabledReason}</div>
                ) : null}
                {!contractReady ? <div className="text-xs text-slate-400">Deploy contract and configure address.</div> : null}
                {!address ? <div className="text-xs text-slate-400">Connect wallet to register land.</div> : null}
                {canPromptSwitch ? (
                  <div className="text-xs text-amber-200">
                    <div>
                      {supportedChain
                        ? "Contract not configured for this network. Deploy and set the correct contract address."
                        : "Unsupported network. Switch to Hardhat (31337) or Sepolia (11155111)."}
                    </div>
                    <div className="mt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={isSwitchingChain}
                        onClick={() => switchChain({ chainId: 31337 })}
                      >
                        {isSwitchingChain ? "Switching..." : "Switch network"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="ml-2"
                        disabled={isSwitchingChain}
                        onClick={() => switchChain({ chainId: 11155111 })}
                      >
                        {isSwitchingChain ? "Switching..." : "Switch to Sepolia"}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </Card>

            <Card title="Find / view land">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Find ID by Parcel ID</Label>
                  <div className="flex gap-2">
                    <Input value={lookupParcelId} onChange={(e) => setLookupParcelId(e.target.value)} placeholder="PCL-1001" />
                    <Button variant="ghost" onClick={onFind} disabled={!lookupParcelId || isFinding}>
                      {isFinding ? "..." : "Find"}
                    </Button>
                  </div>
                  {foundId ? (
                    <div className="text-sm text-slate-200">
                      Found ID: <span className="font-mono">{foundId.toString()}</span>
                    </div>
                  ) : findErr ? (
                    <div className="text-xs text-rose-300">Not found (or contract reverted).</div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label>Get land by ID</Label>
                  <div className="flex gap-2">
                    <Input value={lookupId} onChange={(e) => setLookupId(e.target.value)} placeholder="1" />
                    <Button variant="ghost" onClick={onGetLand} disabled={!lookupId || isFetchingLand}>
                      {isFetchingLand ? "..." : "Get"}
                    </Button>
                  </div>
                </div>

                {land ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                      <div className="text-slate-400">ID</div>
                      <div className="font-mono">{land.id.toString()}</div>
                      <div className="text-slate-400">Parcel</div>
                      <div className="font-mono">{land.parcelId}</div>
                      <div className="text-slate-400">Location</div>
                      <div>{land.location}</div>
                      <div className="text-slate-400">Area</div>
                      <div className="font-mono">{land.areaSqm.toString()} sqm</div>
                      <div className="text-slate-400">Owner</div>
                      <div className="font-mono">{shortAddr(land.owner)}</div>
                    </div>
                  </div>
                ) : landErr ? (
                  <div className="text-xs text-rose-300">Not found (or contract reverted).</div>
                ) : (
                  <div className="text-xs text-slate-400">Lookup a parcel to see details here.</div>
                )}
              </div>
            </Card>

            <Card title="Transfer ownership">
              <div className="space-y-3">
                <div>
                  <Label>Land ID</Label>
                  <Input value={transferId} onChange={(e) => setTransferId(e.target.value)} placeholder="1" />
                </div>
                <div>
                  <Label>Transfer to (address)</Label>
                  <Input value={transferTo} onChange={(e) => setTransferTo(e.target.value)} placeholder="0x..." />
                </div>
                <Button onClick={onTransfer} disabled={!canTransfer}>
                  {isWriting ? "Submitting..." : "Transfer"}
                </Button>
                <div className="text-xs text-slate-400">
                  Only the current owner can transfer a land ID.
                </div>
                {canPromptSwitch ? (
                  <div className="text-xs text-amber-200">
                    <div>
                      {supportedChain
                        ? "Contract not configured for this network. Deploy and set the correct contract address."
                        : "Unsupported network. Switch to Hardhat (31337) or Sepolia (11155111)."}
                    </div>
                    <div className="mt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={isSwitchingChain}
                        onClick={() => switchChain({ chainId: 31337 })}
                      >
                        {isSwitchingChain ? "Switching..." : "Switch network"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="ml-2"
                        disabled={isSwitchingChain}
                        onClick={() => switchChain({ chainId: 11155111 })}
                      >
                        {isSwitchingChain ? "Switching..." : "Switch to Sepolia"}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </Card>
          </div>

          <footer className="text-xs text-slate-500">
            Sepolia note: you need Sepolia ETH in your wallet to pay gas, and you must deploy the contract to Sepolia before Register is enabled.
          </footer>
        </div>
      </div>
    </div>
  );
}

