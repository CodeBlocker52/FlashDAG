import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { parseGwei } from "viem/utils";

// Your WalletConnect project ID from https://cloud.reown.com
const projectId = "f1165190b8b18660f80e79d4383e3e00";

// Define BlockDAG Testnet network
const blockdagTestnet = {
  id: 1043,
  name: "BlockDAG Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "BDAG",
    symbol: "BDAG",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.primordial.bdagscan.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "BlockDAG Explorer",
      url: "https://primordial.bdagscan.com",
    },
  },
  // Add proper fee configuration
  fees: {
    defaultPriorityFeePerGas: parseGwei('2'),
    baseFeeMultiplier: 1.2,
  },
  testnet: true,
};

// Create wagmi adapter with BlockDAG Testnet
const wagmiAdapter = new WagmiAdapter({
  networks: [blockdagTestnet],
  projectId,
  ssr: true, // Enable if using SSR
});

// Create modal with BlockDAG Testnet
createAppKit({
  adapters: [wagmiAdapter],
  networks: [blockdagTestnet],
  projectId,
  metadata: {
    name: "FlashDAG",
    description: "FlashDAG- A micro lending platform",
    url: "https://yourapp.com",
    icons: ["https://yourapp.com/icon.png"],
  },
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
  },
});

export const config = wagmiAdapter.wagmiConfig;
