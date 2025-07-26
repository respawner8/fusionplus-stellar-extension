import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Define the structure of the window.ethereum object
interface EthereumProvider extends ethers.Eip1193Provider {
    isMetaMask?: boolean;
    request: (request: { method: string, params?: any[] }) => Promise<any>;
}

// Extend the Window interface to include ethereum
declare global {
    interface Window {
        ethereum?: EthereumProvider;
    }
}

export const useMetaMask = () => {
    const [account, setAccount] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

    const connect = async () => {
        setError(null);
        if (typeof window.ethereum === 'undefined' || !window.ethereum.isMetaMask) {
            setError('MetaMask is not installed. Please install it to continue.');
            return;
        }

        try {
            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            // Request account access
            const accounts = await browserProvider.send('eth_requestAccounts', []);
            
            if (accounts.length > 0) {
                setAccount(accounts[0]);
                setProvider(browserProvider);
            } else {
                setError('No accounts found. Please unlock MetaMask and try again.');
            }
        } catch (e: any) {
            console.error(e);
            setError('Failed to connect to MetaMask. Please check the console for details.');
        }
    };

    const disconnect = () => {
        setAccount(null);
        setProvider(null);
        // In a real app, you might want to do more here, but for now, this is sufficient.
    };

    return { account, provider, error, connect, disconnect };
}; 