// app.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, arbitrum, polygon, optimism, base, sepolia } from '@reown/appkit/networks';

import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Borrowing from './pages/Borrowing.jsx';
import About from './pages/About.jsx';
import Lending from './pages/Lending.jsx';
import AuthSign from './pages/AuthSign.jsx';
import {config} from './config/wagmi.js';
// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen bg-black text-white">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/lending" element={<Lending />} />
              <Route path="/borrowing" element={<Borrowing />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/about" element={<About />} />
              <Route path="/authsign" element={<AuthSign />} />
            </Routes>
          </div>
        </Router>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default App;