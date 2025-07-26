import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import ConnectWallet from './components/ConnectWallet'

function App() {
  return (
    <>
      <h1>Fusion+ Stellar Atomic Swap</h1>
      <ConnectWallet />
    </>
  )
}

export default App
