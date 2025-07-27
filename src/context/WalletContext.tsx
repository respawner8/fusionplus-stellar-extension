import React, { createContext, useContext, type ReactNode } from 'react';
import { useMetaMask } from '../hooks/useMetaMask';
import { useFreighter } from '../hooks/useFreighter';
import { ethers } from 'ethers';
import { signTransaction } from '@stellar/freighter-api';

// Define the shape of the context data
interface WalletContextType {
    // MetaMask
    metaMaskAccount: string | null;
    provider: ethers.BrowserProvider | null;
    connectMetaMask: () => Promise<void>;
    disconnectMetaMask: () => void;
    metaMaskError: string | null;

    // Freighter
    freighterPublicKey: string | null;
    isFreighterConnected: boolean;
    connectFreighter: () => Promise<void>;
    disconnectFreighter: () => void;
    freighterError: string | null;
    freighterSignTransaction: typeof signTransaction;
}

// Create the context with a default undefined value
const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Create the provider component
export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { account: metaMaskAccount, provider, error: metaMaskError, connect: connectMetaMask, disconnect: disconnectMetaMask } = useMetaMask();
    const { publicKey: freighterPublicKey, isConnected: isFreighterConnected, error: freighterError, connect: connectFreighter, disconnect: disconnectFreighter, signTransaction: freighterSignTransaction } = useFreighter();

    const value = {
        metaMaskAccount,
        provider,
        connectMetaMask,
        disconnectMetaMask,
        metaMaskError,
        freighterPublicKey,
        isFreighterConnected,
        connectFreighter,
        disconnectFreighter,
        freighterError,
        freighterSignTransaction
    };

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
};

// Create a custom hook to use the wallet context
export const useWallets = () => {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWallets must be used within a WalletProvider');
    }
    return context;
}; 