import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import ConnectWallet from './components/ConnectWallet';
import Swap from './components/Swap';

function App() {
  return (
    <>
      <h1>Fusion+ Stellar Atomic Swap</h1>
      <ConnectWallet />
      <hr style={{ margin: '40px 0' }} />
      <Swap />
    </>
  )
}

export default App
