import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum, polygon, optimism, base } from '@reown/appkit/networks'
import { QueryClient } from '@tanstack/react-query'

// Your WalletConnect project ID from https://cloud.reown.com
const projectId = 'f1165190b8b18660f80e79d4383e3e00'

// Create wagmi adapter
const wagmiAdapter = new WagmiAdapter({
  networks: [mainnet, arbitrum, polygon, optimism, base],
  projectId,
  ssr: true // Enable if using SSR
})

// Create modal
createAppKit({
  adapters: [wagmiAdapter],
  networks: [mainnet, arbitrum, polygon, optimism, base],
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

export const config = wagmiAdapter.wagmiConfig