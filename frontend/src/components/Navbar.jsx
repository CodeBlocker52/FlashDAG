import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { useWallet } from "../wallet.jsx"; // Import WalletContext

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { account, connectWallet } = useWallet(); // Access wallet context

  useEffect(() => {
    // Create the custom cursor
    const cursor = document.createElement("div");
    cursor.id = "custom-cursor";
    document.body.appendChild(cursor);

    const moveCursor = (e) => {
      cursor.style.top = `${e.clientY}px`;
      cursor.style.left = `${e.clientX}px`;
    };

    document.addEventListener("mousemove", moveCursor);

    // Cleanup function
    return () => {
      document.removeEventListener("mousemove", moveCursor);
      document.body.removeChild(cursor);
    };
  }, []);

  return (
    <nav className="relative z-10 bg-black border-b border-violet-400/20">
      <div className="max-w-[92%] mx-auto p-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and brand */}
          <div className="flex-shrink-0 transform hover:scale-105 transition-transform duration-300">
            <Link to="/" className="text-4xl font-bold text-violet-400">
              FlashDAG
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link
                to="/"
                className="text-gray-300 hover:text-violet-400 px-3 py-2 rounded-md text-md font-medium"
              >
                Home
              </Link>

              {/* Products Dropdown */}
              <div className="relative">
                <button
                  className="text-gray-300 hover:text-violet-400 px-3 py-2 rounded-md text-md font-medium flex items-center gap-1"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                >
                  Products
                  <ChevronDown size={20} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute z-10 -ml-4 mt-2 w-48 rounded-md shadow-lg bg-black border border-violet-400/20">
                    <div className="py-1">
                      <Link
                        to="/lending"
                        className="block px-4 py-2 text-md text-gray-300 hover:bg-violet-400/10 hover:text-violet-400"
                      >
                        Lending
                      </Link>
                      <Link
                        to="/borrowing"
                        className="block px-4 py-2 text-md text-gray-300 hover:bg-violet-400/10 hover:text-violet-400"
                      >
                        Borrowing
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <Link
                to="/dashboard"
                className="text-gray-300 hover:text-violet-400 px-3 py-2 rounded-md text-md font-medium"
              >
                Dashboard
              </Link>

              <Link
                to="/about"
                className="text-gray-300 hover:text-violet-400 px-3 py-2 rounded-md text-md font-medium"
              >
                About
              </Link>

              {/* Connect Wallet Button */}
              <button
                onClick={connectWallet}
                className="bg-violet-400 text-black px-4 py-2 rounded-lg hover:bg-violet-500 text-md"
              >
                {account
                  ? `Connected: ${account.slice(0, 6)}...`
                  : "Connect Wallet"}
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className="text-gray-300 hover:text-violet-400 block px-3 py-2 rounded-md text-base font-medium"
            >
              Home
            </Link>
            <Link
              to="/lending"
              className="text-gray-300 hover:text-violet-400 block px-3 py-2 rounded-md text-base font-medium"
            >
              Lending
            </Link>
            <Link
              to="/borrowing"
              className="text-gray-300 hover:text-violet-400 block px-3 py-2 rounded-md text-base font-medium"
            >
              Borrowing
            </Link>

            <Link
              to="/dashboard"
              className="text-gray-300 hover:text-violet-400 block px-3 py-2 rounded-md text-base font-medium"
            >
              Dashboard
            </Link>
            <Link
              to="/about"
              className="text-gray-300 hover:text-violet-400 block px-3 py-2 rounded-md text-base font-medium"
            >
              About
            </Link>
            <Link
              to="/connect"
              className="bg-violet-400 text-black block px-4 py-2 rounded-lg hover:bg-violet-500 text-center"
            >
              Connect Wallet
            </Link>
          </div>
        </div>
      )}

      <style jsx global>{`
        #custom-cursor {
          position: fixed;
          width: 20px;
          height: 20px;
          background-color: rgba(34, 197, 94, 1);
          border-radius: 50%;
          pointer-events: none; /* Ensure it doesn't block clicks */
          z-index: 10000;
          transform: translate(-50%, -50%);
          transition: transform 0.1s ease-out;
        }

        /* Hover effects for custom cursor */
        button:hover ~ #custom-cursor,
        a:hover ~ #custom-cursor {
          transform: scale(
            1.5
          ); /* Makes the cursor grow over buttons and links */
        }

        body,
        a,
        button {
          cursor: none;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
