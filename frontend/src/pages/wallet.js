import React, { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // Function to Connect MetaMask
  const connectWallet = async () => {
    if (!window.ethereum) {
      setStatus("MetaMask not detected. Please install MetaMask.");
      return;
    }

    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setStatus("Connected successfully!");
      } else {
        setStatus("No accounts found. Please unlock MetaMask.");
      }
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
      setStatus("Failed to connect.");
    } finally {
      setLoading(false);
    }
  };

  // Check if Wallet is Already Connected
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (!window.ethereum) return;

      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.listAccounts();
        
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    };

    checkWalletConnection();

    // Listen for Account Changes
    window.ethereum?.on("accountsChanged", (accounts) => {
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
      } else {
        setWalletAddress(null);
      }
    });

  }, []);

  return (
    <WalletContext.Provider value={{ walletAddress, connectWallet, status, loading }}>
      {children}
    </WalletContext.Provider>
  );
};

// 📌 Custom Hook to Use Wallet Context
export const useWallet = () => {
  return useContext(WalletContext);
};
