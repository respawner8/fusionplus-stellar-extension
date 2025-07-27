# Fusion+ Stellar Atomic Swap dApp

This project implements a **browser-based atomic swap** between Ethereum (using the 1inch Fusion+ SDK) and Stellar (using the Stellar SDK and Freighter wallet). The UI is built with React and Vite for a fast, modern user experience.

---

## 🌟 Features
- **Connect MetaMask** (Ethereum) and **Freighter** (Stellar) wallets
- **Generate HTLC secret & hash** in-browser
- **Create and sign Fusion+ order** to lock ETH
- **Create, sign, and submit Stellar escrow transaction** to lock XLM
- **Full swap simulation** with clear UI feedback

---

## 🖥️ UI Overview

- **Wallet Connect Section:**
  - Connect/disconnect MetaMask and Freighter with one click
  - See connected addresses
- **Swap Flow:**
  1. **Generate Secret & Hash**: One-click, shows both values in hex
  2. **Enter ETH Amount**: Input field for swap amount
  3. **Create Fusion Order**: Locks ETH using the 1inch Fusion+ SDK
  4. **Create & Sign Stellar Escrow**: Locks XLM in a hash-locked account, signed by both Freighter and the generated escrow key
  5. **Submit Stellar Transaction**: Sends the signed transaction to the Stellar testnet and displays the result
- **Live Feedback:**
  - All steps show success, errors, and transaction details in the UI

---

## 🚀 Getting Started

### 1. **Clone the repository**
```sh
git clone <repo-url>
cd fusionplus-stellar-extension
```

### 2. **Install dependencies**
```sh
npm install
```

### 3. **Wallet Setup**
- **MetaMask**: [Install MetaMask](https://metamask.io/) and connect to Ethereum mainnet or testnet
- **Freighter**: [Install Freighter](https://www.freighter.app/) and create a Stellar testnet wallet

### 4. **Run the dApp**
```sh
npm run dev
```
- Open the local URL shown in your terminal (usually http://localhost:5173)

---

## 🔄 Atomic Swap Flow (UI Steps)

1. **Connect both wallets** (MetaMask and Freighter)
2. **Click "Generate Secret & Hash"**
   - The UI will display the secret and its SHA-256 hash
3. **Enter the amount of ETH to swap**
4. **Click "Create Fusion Order & Lock ETH"**
   - This will create a Fusion+ order using the hash
5. **Click "Create & Sign Stellar Escrow"**
   - This will build a Stellar transaction to lock XLM in a hash-locked account
   - The transaction is signed by both the generated escrow key and your Freighter wallet
6. **Click "Submit Stellar Transaction"**
   - The signed transaction is submitted to the Stellar testnet
   - The UI will show the result and transaction details

---

## ⚠️ Notes
- This dApp is for **testnet/demo purposes only**. Do not use with real funds.
- The swap flow is a simulation and does not perform a true cross-chain atomic swap (no on-chain enforcement between chains).
- For a real-world swap, you would need to coordinate secret revelation and claim logic between both chains.

---

## 🛠️ Tech Stack
- **React + Vite** (frontend)
- **ethers.js** (Ethereum wallet interaction)
- **@1inch/fusion-sdk** (Fusion+ order creation)
- **stellar-sdk** (Stellar transaction building)
- **@stellar/freighter-api** (Freighter wallet integration)

---

## 📄 License
MIT
