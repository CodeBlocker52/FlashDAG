// navbar.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAppKit } from '@reown/appkit/react';
import { useAccount, useDisconnect } from 'wagmi';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Wagmi hooks
  const { open } = useAppKit();
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();

  // Format address for display
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Handle wallet connection
  const handleWalletAction = () => {
    if (isConnected) {
      // Show disconnect option or account modal
      open({ view: 'Account' });
    } else {
      // Open connect modal
      open();
    }
  };

  return (
    <nav className="relative bg-black border-b border-violet-400/20" style={{ zIndex: 50 }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Left Side */}
          <div className="flex-shrink-0 transform hover:scale-105 transition-transform duration-300">
            <Link to="/" className="text-3xl font-bold text-violet-400">
              FlashDAG
            </Link>
          </div>

          {/* Desktop Navigation - Center */}
          <div className="hidden md:flex items-center justify-center flex-1">
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="text-gray-300 hover:text-violet-400 px-3 py-2 rounded-md text-md font-medium transition-colors duration-200"
              >
                Home
              </Link>

              <Link
                to="/supply"
                className="text-gray-300 hover:text-violet-400 px-3 py-2 rounded-md text-md font-medium transition-colors duration-200"
              >
                Supply
              </Link>

              <Link
                to="/borrow"
                className="text-gray-300 hover:text-violet-400 px-3 py-2 rounded-md text-md font-medium transition-colors duration-200"
              >
                Borrow
              </Link>

              <Link
                to="/withdraw"
                className="text-gray-300 hover:text-violet-400 px-3 py-2 rounded-md text-md font-medium transition-colors duration-200"
              >
                Withdraw
              </Link>

              <Link
                to="/repay"
                className="text-gray-300 hover:text-violet-400 px-3 py-2 rounded-md text-md font-medium transition-colors duration-200"
              >
                Repay
              </Link>

              <Link
                to="/dashboard"
                className="text-gray-300 hover:text-violet-400 px-3 py-2 rounded-md text-md font-medium transition-colors duration-200"
              >
                Dashboard
              </Link>

              <Link
                to="/about"
                className="text-gray-300 hover:text-violet-400 px-3 py-2 rounded-md text-md font-medium transition-colors duration-200"
              >
                About
              </Link>
            </div>
          </div>

          {/* Wallet Connection - Right Side */}
          <div className="hidden md:flex items-center space-x-3">
            {isConnected && chain && (
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="hidden lg:block">{chain.name}</span>
              </div>
            )}
            
            <button
              onClick={handleWalletAction}
              className="bg-violet-400 text-black px-5 py-2.5 rounded-lg hover:bg-violet-500 text-md font-medium transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              {isConnected
                ? formatAddress(address)
                : "Connect Wallet"}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-3">
            {/* Mobile wallet button */}
            <button
              onClick={handleWalletAction}
              className="bg-violet-400 text-black px-3 py-1.5 rounded-lg hover:bg-violet-500 text-sm font-medium"
            >
              {isConnected ? "Wallet" : "Connect"}
            </button>
            
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none transition-colors duration-200"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden animate-fadeIn">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-black/95 backdrop-blur-sm border-t border-violet-400/20">
            <Link
              to="/"
              className="text-gray-300 hover:text-violet-400 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/supply"
              className="text-gray-300 hover:text-violet-400 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
              onClick={() => setIsOpen(false)}
            >
              Supply
            </Link>
            <Link
              to="/borrow"
              className="text-gray-300 hover:text-violet-400 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
              onClick={() => setIsOpen(false)}
            >
              Borrow
            </Link>
            <Link
              to="/withdraw"
              className="text-gray-300 hover:text-violet-400 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
              onClick={() => setIsOpen(false)}
            >
              Withdraw
            </Link>
            <Link
              to="/repay"
              className="text-gray-300 hover:text-violet-400 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
              onClick={() => setIsOpen(false)}
            >
              Repay
            </Link>
            <Link
              to="/dashboard"
              className="text-gray-300 hover:text-violet-400 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              to="/about"
              className="text-gray-300 hover:text-violet-400 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
              onClick={() => setIsOpen(false)}
            >
              About
            </Link>
            
            {/* Mobile wallet info */}
            {isConnected && (
              <div className="px-3 py-2 mt-4 border-t border-violet-400/20">
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Connected to {chain?.name || 'Unknown'}</span>
                </div>
                <div className="text-xs text-violet-400 mt-1">
                  {formatAddress(address)}
                </div>
              </div>
            )}
            
            <div className="px-3 pt-4">
              <button
                onClick={handleWalletAction}
                className="w-full bg-violet-400 text-black px-4 py-2.5 rounded-lg hover:bg-violet-500 text-center font-medium transition-colors duration-200"
              >
                {isConnected ? "Manage Wallet" : "Connect Wallet"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        /* Add fade in animation */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;