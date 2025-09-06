import React, { useState, useEffect } from "react";
import { Wallet } from "lucide-react";
import GeometricWeb from "../components/GeometricWeb.jsx";

const AuthSign = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  // Check for stored wallet address or MetaMask connection on initial load
  useEffect(() => {
    const storedAddress = localStorage.getItem("walletAddress");
    if (storedAddress) {
      setWalletAddress(storedAddress);
    }

    if (window.ethereum) {
      // Listen for account changes and update the wallet address
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          localStorage.setItem("walletAddress", accounts[0]);
        } else {
          setWalletAddress("");
          localStorage.removeItem("walletAddress");
        }
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", () => {});
      }
    };
  }, []);

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      alert(
        "MetaMask is not installed. Please install MetaMask to use this feature."
      );
      return;
    }

    setIsConnecting(true);
    try {
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setWalletAddress(accounts[0]);
      localStorage.setItem("walletAddress", accounts[0]); // Save to localStorage
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
      alert("Failed to connect to MetaMask. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress("");
    localStorage.removeItem("walletAddress");
  };

  useEffect(() => {
    const cursor = document.createElement("div");
    cursor.id = "custom-cursor";
    document.body.appendChild(cursor);

    const moveCursor = (e) => {
      cursor.style.top = `${e.clientY}px`;
      cursor.style.left = `${e.clientX}px`;
    };

    document.addEventListener("mousemove", moveCursor);

    return () => {
      document.removeEventListener("mousemove", moveCursor);
      document.body.removeChild(cursor);
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-black">
      <div className="fixed inset-0 bg-black" />
      <GeometricWeb />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-black border border-violet-900 rounded-lg p-8">
          <div className="mb-8 transform hover:scale-105 transition-transform duration-300">
            <h1 className="text-5xl font-bold text-violet-500 text-center animate-glow">
              FlashDAG
            </h1>
            <p className="text-gray-400 text-center mt-2 animate-fade-in">
              Decentralized Lending Platform
            </p>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white animate-fade-in">
              Access Platform
            </h2>
            <p className="text-gray-400 mt-2">
              {walletAddress ? "Connected" : "Connect to access your account"}
            </p>
          </div>

          {!walletAddress ? (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white p-4 rounded-lg disabled:opacity-50 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-violet-500/20"
            >
              <Wallet
                className={`h-5 w-5 ${isConnecting ? "animate-spin" : ""}`}
              />
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          ) : (
            <>
              <button
                onClick={disconnectWallet}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white p-4 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-red-500/20"
              >
                Disconnect Wallet
              </button>

              <div className="text-violet-400 text-sm text-center mt-4">
                Connected Wallet: {walletAddress}
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
          100% {
            transform: translateY(0px) translateX(0px);
          }
        }

        .animate-float {
          animation: float 5s ease-in-out infinite;
        }

        #custom-cursor {
          position: fixed;
          width: 20px;
          height: 20px;
          background-color: rgba(34, 197, 94, 1);
          border-radius: 50%;
          pointer-events: none;
          z-index: 10000;
          transform: translate(-50%, -50%);
          transition: transform 0.1s ease-out;
        }

        body,
        a,
        button {
          cursor: none;
        }

        button:hover ~ #custom-cursor {
          transform: scale(1.5);
        }
      `}</style>
    </div>
  );
};

export default AuthSign;
