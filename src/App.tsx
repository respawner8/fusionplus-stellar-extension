import { useState } from 'react'
import './App.css'
import ConnectWallet from './components/ConnectWallet';
import Swap from './components/Swap';
import DemoGuide from './components/DemoGuide';
import { WalletProvider } from './context/WalletContext';

function App() {
  return (
    <WalletProvider>
      <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="container">
          <h1>Fusion+ Stellar Atomic Swap</h1>
          <p className="app-subtitle">
            Cross-chain atomic swaps between Ethereum and Stellar
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        <div className="container">
          {/* Demo Guide Section */}
          <section className="section">
            <DemoGuide />
          </section>

          {/* Wallet Connection Section */}
          <section className="section">
            <ConnectWallet />
          </section>

          {/* Swap Section */}
          <section className="section">
            <Swap />
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="container">
          <p>Built with React, Vite, and Stellar SDK</p>
        </div>
      </footer>
      </div>
    </WalletProvider>
  )
}

export default App
