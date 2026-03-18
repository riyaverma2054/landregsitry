import { useMemo, useState } from "react";
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract } from "wagmi";
import { isAddress } from "viem";
import { getLandRegistryAddress, landRegistryAbi } from "../contracts/landRegistry";

function shortAddr(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
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
  const contractAddress = useMemo(() => getLandRegistryAddress(), []);
  const { address, chain } = useAccount();
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  const [parcelId, setParcelId] = useState("");
  const [location, setLocation] = useState("");
  const [areaSqm, setAreaSqm] = useState("100");

  const [lookupParcelId, setLookupParcelId] = useState("");
  const [lookupId, setLookupId] = useState("");

  const [transferId, setTransferId] = useState("");
  const [transferTo, setTransferTo] = useState("");

  const { data: nextId } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: landRegistryAbi,
    functionName: "nextId"
  });

  const {
    data: foundId,
    refetch: refetchFoundId,
    error: findErr,
    isFetching: isFinding
  } = useReadContract({
    address: contractAddress as `0x${string}`,
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
    address: contractAddress as `0x${string}`,
    abi: landRegistryAbi,
    functionName: "getLand",
    args: lookupId ? [BigInt(lookupId)] : undefined,
    query: { enabled: false }
  });

  const { writeContractAsync, isPending: isWriting } = useWriteContract();
  const [txMsg, setTxMsg] = useState<string | null>(null);

  const canRegister =
    !!address && parcelId.trim().length > 0 && location.trim().length > 0 && Number(areaSqm) > 0 && !isWriting;

  async function onRegister() {
    setTxMsg(null);
    const id = await writeContractAsync({
      address: contractAddress as `0x${string}`,
      abi: landRegistryAbi,
      functionName: "registerLand",
      args: [parcelId.trim(), location.trim(), BigInt(Math.floor(Number(areaSqm)))]
    });
    setTxMsg(`Transaction sent: ${id}`);
    setParcelId("");
    setLocation("");
  }

  async function onFind() {
    setTxMsg(null);
    await refetchFoundId();
  }

  async function onGetLand() {
    setTxMsg(null);
    await refetchLand();
  }

  const canTransfer =
    !!address &&
    transferId.trim().length > 0 &&
    isAddress(transferTo.trim()) &&
    !isWriting;

  async function onTransfer() {
    setTxMsg(null);
    const hash = await writeContractAsync({
      address: contractAddress as `0x${string}`,
      abi: landRegistryAbi,
      functionName: "transferOwnership",
      args: [BigInt(transferId.trim()), transferTo.trim() as `0x${string}`]
    });
    setTxMsg(`Transaction sent: ${hash}`);
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
                Register land parcels and transfer ownership on-chain (Hardhat local network).
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-300">
                <div>
                  <span className="text-slate-400">Contract</span>{" "}
                  <span className="font-mono text-slate-200">{shortAddr(contractAddress)}</span>
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
                  {isWriting ? "Submitting..." : "Register"}
                </Button>
                {!address ? (
                  <div className="text-xs text-slate-400">Connect wallet to register land.</div>
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
              </div>
            </Card>
          </div>

          <footer className="text-xs text-slate-500">
            Tip: run `npx hardhat node` + deploy, then set `VITE_LAND_REGISTRY_ADDRESS` in `frontend/.env`.
          </footer>
        </div>
      </div>
    </div>
  );
}

