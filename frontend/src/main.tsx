import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import { WagmiProvider, createConfig, http } from "wagmi";
import { hardhat, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./ui/App";
import { ErrorBoundary } from "./ui/ErrorBoundary";

const rpcHardhat =
  (import.meta.env.VITE_RPC_URL_31337 as string | undefined)?.trim() || "http://127.0.0.1:8545";
const rpcSepolia = (import.meta.env.VITE_RPC_URL_11155111 as string | undefined)?.trim() || undefined;

const config = createConfig({
  chains: [hardhat, sepolia],
  connectors: [injected()],
  transports: {
    [hardhat.id]: http(rpcHardhat),
    [sepolia.id]: http(rpcSepolia)
  }
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);

