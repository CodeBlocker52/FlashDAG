import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'
import { WalletProvider } from './wallet'; // Ensure correct path and extension

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

root.render(
  <WalletProvider>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </WalletProvider>
);
