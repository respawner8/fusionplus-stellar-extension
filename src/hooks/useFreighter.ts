import { useState, useEffect } from 'react';
import {
    requestAccess,
    getAddress,
    isAllowed,
    signTransaction,
} from '@stellar/freighter-api';

export const useFreighter = () => {
    const [publicKey, setPublicKey] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // Check for Freighter and initial connection status
    useEffect(() => {
        const checkConnection = async () => {
            try {
                const allowed = await isAllowed();
                if (allowed) {
                    const { address } = await getAddress();
                    setPublicKey(address);
                    setIsConnected(true);
                }
            } catch (e: any) {
                console.error(e);
                // Don't set an error here, as it's normal for it to not be connected initially
            }
        };
        checkConnection();
    }, []);


    const connect = async () => {
        setError(null);
        try {
            // Request access to the user's Freighter wallet
            const { address } = await requestAccess();
            setPublicKey(address);
            setIsConnected(true);
        } catch (e: any) {
            console.error(e);
            setError('Connection denied. Please allow access in the Freighter extension.');
        }
    };

    const disconnect = () => {
        setPublicKey(null);
        setIsConnected(false);
        // Freighter doesn't have a programmatic disconnect. This just resets our app's state.
    };

    return { publicKey, isConnected, error, connect, disconnect, signTransaction };
}; 