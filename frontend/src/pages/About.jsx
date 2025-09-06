// About.jsx
import React, { useEffect } from "react";
import { DollarSign, Shield, Clock } from "lucide-react";

const About = () => {

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <h1 className="text-3xl font-bold text-white mb-6">
        About DeFi Microloans
      </h1>

      {/* How It Works */}
      <div className="bg-gray-800 border border-violet-500 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">How It Works</h2>
        <div className="space-y-6 text-gray-300">
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-white">
              Decentralized Lending with Smart Contracts
            </h3>
            <p>
              Our platform leverages Ethereum or Polygon-based smart contracts
              to allow borrowers and lenders to interact without intermediaries.
              This makes the process efficient, transparent, and secure. Each
              loan agreement is coded directly into the blockchain using
              Solidity, eliminating the need for traditional banking systems.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-white">
              Collateralized Loans
            </h3>
            <p>
              Borrowers can stake cryptocurrency as collateral for their loans.
              These smart contracts automatically enforce the rules of the loan,
              ensuring the safety and trust between lenders and borrowers. If
              the borrower fails to repay, the collateral is automatically
              liquidated.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-white">
              Immutable & Secure Transactions
            </h3>
            <p>
              All transactions are logged on the blockchain and are immutable,
              meaning they cannot be altered. This guarantees transparency and
              security for both parties. Smart contracts undergo rigorous audits
              to ensure they function as intended and are free from
              vulnerabilities.
            </p>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 border border-violet-500 rounded-lg p-6">
          <div className="bg-violet-500/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <DollarSign className="text-violet-500 w-6 h-6" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Better Rates</h3>
          <p className="text-gray-300">
            By removing intermediaries, we offer lower interest rates for both
            borrowers and lenders, creating a more competitive and accessible
            marketplace.
          </p>
        </div>

        <div className="bg-gray-800 border border-violet-500 rounded-lg p-6">
          <div className="bg-violet-500/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <Shield className="text-violet-500 w-6 h-6" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            Smart Contract Security
          </h3>
          <p className="text-gray-300">
            Our platform ensures that all loans are governed by smart contracts
            written in Solidity, audited for security, and executed on the
            blockchain. This guarantees a secure and trustless environment.
          </p>
        </div>

        <div className="bg-gray-800 border border-violet-500 rounded-lg p-6">
          <div className="bg-violet-500/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <Clock className="text-violet-500 w-6 h-6" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            Faster Transactions
          </h3>
          <p className="text-gray-300">
            With blockchain technology, loan approvals and transactions are
            completed much faster compared to traditional banking systems. Get
            your loan approved and funded within minutes, not days.
          </p>
        </div>
      </div>

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

        button:hover ~ #custom-cursor {
          transform: scale(1.5); /* Makes the cursor grow over buttons */
        }

        /* body,
        a,
        button {
          cursor: none;
        } */
      `}</style>
    </div>
  );
};

export default About;
