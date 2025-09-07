import React from "react";
import { useWallet } from "../wallet"; // Assuming WalletContext is set up correctly

const AnotherPage = () => {
  const { walletAddress } = useWallet(); // Access wallet address from context

  return (
    <div className="p-4">
      {walletAddress ? (
        <p className="text-violet-500">Connected Wallet: {walletAddress}</p>
      ) : (
        <p className="text-red-500">No wallet connected</p>
      )}
    </div>
  );
};

export default AnotherPage;
