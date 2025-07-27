import React, { useState } from 'react';
import { generateSecretAndHashAsync, bytesToHex } from '../utils/crypto';
import { useWallets } from '../context/WalletContext';
import { FusionSDK, Web3ProviderConnector, PresetEnum } from '@1inch/fusion-sdk';
import { ethers } from 'ethers';
import StellarSdk from 'stellar-sdk';
import { buildCreateEscrowTransaction, submitTransaction } from '../stellar/htlc';

const Swap: React.FC = () => {
    const { provider, metaMaskAccount, freighterPublicKey, freighterSignTransaction } = useWallets();
    const [amount, setAmount] = useState('');
    const [secret, setSecret] = useState<Uint8Array | null>(null);
    const [hash, setHash] = useState<Uint8Array | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [order, setOrder] = useState<any | null>(null); // To store the created order
    const [stellarTx, setStellarTx] = useState<string | null>(null);
    const [stellarSubmitResult, setStellarSubmitResult] = useState<any | null>(null);

    const handleGenerateSecret = async () => {
        setError(null);
        try {
            const { secret, hash } = await generateSecretAndHashAsync();
            setSecret(secret);
            setHash(hash);
        } catch (e) {
            console.error(e);
            setError('Failed to generate secret and hash.');
        }
    };

    const handleSwap = async () => {
        if (!provider || !metaMaskAccount) {
            setError('Please connect your MetaMask wallet first.');
            return;
        }
        if (!amount || !secret || !hash) {
            setError('Please enter an amount and generate a secret/hash first.');
            return;
        }
        setError(null);

        try {
            const chainId = 1; // Ethereum Mainnet
            // Ethers provider is compatible with the Web3Like interface
            const connector = new Web3ProviderConnector(provider as any);
            const sdk = new FusionSDK({
                url: 'https://fusion.1inch.io',
                network: chainId,
                blockchainProvider: connector,
            });

            // The hash needs to be 0x-prefixed
            const orderParams = {
                fromTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // ETH
                toTokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',   // DAI
                amount: ethers.parseEther(amount).toString(),
                walletAddress: metaMaskAccount,
                preset: PresetEnum.fast, // Or your desired preset
                // Constructing the calldata for the atomic swap
                permit: '0x', // No permit needed for ETH
                data: `0x${bytesToHex(hash)}`,
            };

            console.log('Submitting order with params:', orderParams);
            const createdOrder = await sdk.placeOrder(orderParams);
            setOrder(createdOrder);
            console.log('Fusion Order Created:', createdOrder);
            alert('Fusion order created successfully! Check the console for details.');

        } catch (e: any) {
            console.error('Error creating Fusion order:', e);
            setError(`Failed to create Fusion order: ${e.message}`);
        }
    };

    const handleCreateStellarEscrow = async () => {
        if (!freighterPublicKey || !hash) {
            setError('Please connect Freighter and generate a hash first.');
            return;
        }
        // Assume the ETH holder is the receiver on the Stellar side for this PoC
        if (!metaMaskAccount) {
            setError('Please connect MetaMask (receiver) first.');
            return;
        }
        setError(null);

        try {
            const { transactionXDR, escrowKeypair } = await buildCreateEscrowTransaction(
                freighterPublicKey,
                metaMaskAccount, // The ETH address is not a valid Stellar key, this is a placeholder.
                                  // In a real app, the user would provide their Stellar public key.
                                  // For now, we'll use a dummy key for the receiver.
                hash
            );

            // In a real app, the receiver's Stellar public key would be part of the swap negotiation.
            // Let's use a dummy key for demonstration.
            const dummyReceiverStellarKey = StellarSdk.Keypair.random().publicKey();
            const { transactionXDR: correctedTxXDR } = await buildCreateEscrowTransaction(freighterPublicKey, dummyReceiverStellarKey, hash);

            // Sign with the new escrow account's key
            const transaction = new StellarSdk.Transaction(correctedTxXDR, 'Test SDF Network ; September 2015');
            transaction.sign(escrowKeypair);

            // Sign with the locker's (user's) Freighter wallet
            const networkPassphrase = 'Test SDF Network ; September 2015';
            const signedResult = await freighterSignTransaction(transaction.toXDR(), { networkPassphrase });
            const signedXdr = signedResult.signedTxXdr;
            setStellarTx(signedXdr);
            alert('Stellar escrow transaction signed! Check the console.');
            console.log('Signed Stellar Transaction XDR:', signedXdr);

        } catch (e: any) {
            console.error('Error creating Stellar escrow:', e);
            setError(`Failed to create Stellar escrow: ${e.message}`);
        }
    };

    const handleSubmitStellarTx = async () => {
        if (!stellarTx) {
            setError('No signed Stellar transaction to submit.');
            return;
        }
        setError(null);
        try {
            const result = await submitTransaction(stellarTx);
            setStellarSubmitResult(result);
            alert('Stellar transaction submitted! Check the console.');
            console.log('Stellar transaction submit result:', result);
        } catch (e: any) {
            setError('Failed to submit Stellar transaction: ' + e.message);
        }
    };

    return (
        <div>
            <h2>Initiate Atomic Swap</h2>

            <div>
                <button onClick={handleGenerateSecret}>1. Generate Secret & Hash</button>
                {secret && <p><strong>Secret:</strong> {bytesToHex(secret)}</p>}
                {hash && <p><strong>Hash (SHA256):</strong> {`0x${bytesToHex(hash)}`}</p>}
            </div>

            <hr style={{ margin: '20px 0' }} />

            <div>
                <label>
                    Amount of ETH to Swap:
                    <input
                        type="text"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="e.g., 0.1"
                        style={{ marginLeft: '10px' }}
                    />
                </label>
            </div>

            <hr style={{ margin: '20px 0' }} />

            <button onClick={handleSwap} disabled={!provider || !metaMaskAccount}>
                2. Create Fusion Order & Lock ETH
            </button>

            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}

            {order && (
                <div style={{ marginTop: '20px', wordBreak: 'break-all' }}>
                    <h3>Order Created Successfully!</h3>
                    <pre>{JSON.stringify(order, null, 2)}</pre>
                </div>
            )}

            <hr style={{ margin: '20px 0' }} />

            <button onClick={handleCreateStellarEscrow} disabled={!freighterPublicKey || !hash}>
                3. Create & Sign Stellar Escrow
            </button>

            {stellarTx && (
                <div style={{ marginTop: '20px', wordBreak: 'break-all' }}>
                    <h3>Stellar Transaction Signed!</h3>
                    <p><strong>XDR:</strong> {stellarTx}</p>
                    <button onClick={handleSubmitStellarTx} style={{ marginTop: '10px' }}>
                        4. Submit Stellar Transaction
                    </button>
                </div>
            )}
            {stellarSubmitResult && (
                <div style={{ marginTop: '20px', wordBreak: 'break-all' }}>
                    <h3>Stellar Transaction Submit Result</h3>
                    <pre>{JSON.stringify(stellarSubmitResult, null, 2)}</pre>
                </div>
            )}
        </div>
    );
};

export default Swap; 