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
    const [order, setOrder] = useState<any | null>(null);
    const [stellarTx, setStellarTx] = useState<string | null>(null);
    const [stellarSubmitResult, setStellarSubmitResult] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handleGenerateSecret = async () => {
        setError(null);
        setIsLoading('generating');
        try {
            const { secret, hash } = await generateSecretAndHashAsync();
            setSecret(secret);
            setHash(hash);
        } catch (e) {
            console.error(e);
            setError('Failed to generate secret and hash.');
        } finally {
            setIsLoading(null);
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
        setIsLoading('creating-order');

        try {
            const chainId = 1; // Ethereum Mainnet
            const connector = new Web3ProviderConnector(provider as any);
            const sdk = new FusionSDK({
                url: 'https://fusion.1inch.io',
                network: chainId,
                blockchainProvider: connector,
            });

            const orderParams = {
                fromTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // ETH
                toTokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',   // DAI
                amount: ethers.parseEther(amount).toString(),
                walletAddress: metaMaskAccount,
                preset: PresetEnum.fast,
                permit: '0x',
                data: `0x${bytesToHex(hash)}`,
            };

            console.log('Submitting order with params:', orderParams);
            const createdOrder = await sdk.placeOrder(orderParams);
            setOrder(createdOrder);
            console.log('Fusion Order Created:', createdOrder);
        } catch (e: any) {
            console.error('Error creating Fusion order:', e);
            setError(`Failed to create Fusion order: ${e.message}`);
        } finally {
            setIsLoading(null);
        }
    };

    const handleCreateStellarEscrow = async () => {
        if (!freighterPublicKey || !hash) {
            setError('Please connect Freighter and generate a hash first.');
            return;
        }
        if (!metaMaskAccount) {
            setError('Please connect MetaMask (receiver) first.');
            return;
        }
        setError(null);
        setIsLoading('creating-escrow');

        try {
            const dummyReceiverStellarKey = StellarSdk.Keypair.random().publicKey();
            const { transactionXDR: correctedTxXDR } = await buildCreateEscrowTransaction(freighterPublicKey, dummyReceiverStellarKey, hash);

            const transaction = new StellarSdk.Transaction(correctedTxXDR, 'Test SDF Network ; September 2015');
            const escrowKeypair = StellarSdk.Keypair.random();
            transaction.sign(escrowKeypair);

            const networkPassphrase = 'Test SDF Network ; September 2015';
            const signedResult = await freighterSignTransaction(transaction.toXDR(), { networkPassphrase });
            const signedXdr = signedResult.signedTxXdr;
            setStellarTx(signedXdr);
            console.log('Signed Stellar Transaction XDR:', signedXdr);
        } catch (e: any) {
            console.error('Error creating Stellar escrow:', e);
            setError(`Failed to create Stellar escrow: ${e.message}`);
        } finally {
            setIsLoading(null);
        }
    };

    const handleSubmitStellarTx = async () => {
        if (!stellarTx) {
            setError('No signed Stellar transaction to submit.');
            return;
        }
        setError(null);
        setIsLoading('submitting');
        try {
            const result = await submitTransaction(stellarTx);
            setStellarSubmitResult(result);
            console.log('Stellar transaction submit result:', result);
        } catch (e: any) {
            setError('Failed to submit Stellar transaction: ' + e.message);
        } finally {
            setIsLoading(null);
        }
    };

    return (
        <div className="fade-in">
            <div className="card-header">
                <div className="card-icon">🔄</div>
                <h2>Atomic Swap Flow</h2>
            </div>

            <div className="card">
                <div className="swap-flow" style={{ counterReset: 'step-counter' }}>
                    {/* Step 1: Generate Secret & Hash */}
                    <div className="step">
                        <div className="step-content">
                            <h3>Generate Secret & Hash</h3>
                            <p className="text-muted">Create a cryptographic secret and its hash for the atomic swap</p>
                            
                            <button 
                                className="btn btn-primary" 
                                onClick={handleGenerateSecret}
                                disabled={isLoading !== null}
                            >
                                {isLoading === 'generating' ? 'Generating...' : 'Generate Secret & Hash'}
                            </button>

                            {secret && (
                                <div className="step-result">
                                    <div className="input-group">
                                        <label className="input-label">Secret (Hex)</label>
                                        <div className="code-block">{bytesToHex(secret)}</div>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Hash (SHA256)</label>
                                        <div className="code-block">{`0x${bytesToHex(hash!)}`}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Step 2: Enter Amount */}
                    <div className="step">
                        <div className="step-content">
                            <h3>Enter Swap Amount</h3>
                            <p className="text-muted">Specify the amount of ETH you want to swap</p>
                            
                            <div className="input-group">
                                <label className="input-label">Amount of ETH</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="e.g., 0.1"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Create Fusion Order */}
                    <div className="step">
                        <div className="step-content">
                            <h3>Create Fusion Order & Lock ETH</h3>
                            <p className="text-muted">Lock your ETH using the 1inch Fusion+ SDK</p>
                            
                            <button 
                                className="btn btn-primary" 
                                onClick={handleSwap}
                                disabled={!provider || !metaMaskAccount || !amount || !hash || isLoading !== null}
                            >
                                {isLoading === 'creating-order' ? 'Creating Order...' : 'Create Fusion Order & Lock ETH'}
                            </button>

                            {order && (
                                <div className="step-result">
                                    <div className="status status-success">
                                        <span>✓</span>
                                        <span>Order Created Successfully!</span>
                                    </div>
                                    <div className="code-block">
                                        {JSON.stringify(order, null, 2)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Step 4: Create Stellar Escrow */}
                    <div className="step">
                        <div className="step-content">
                            <h3>Create & Sign Stellar Escrow</h3>
                            <p className="text-muted">Lock XLM in a hash-locked account on Stellar</p>
                            
                            <button 
                                className="btn btn-primary" 
                                onClick={handleCreateStellarEscrow}
                                disabled={!freighterPublicKey || !hash || isLoading !== null}
                            >
                                {isLoading === 'creating-escrow' ? 'Creating Escrow...' : 'Create & Sign Stellar Escrow'}
                            </button>

                            {stellarTx && (
                                <div className="step-result">
                                    <div className="status status-success">
                                        <span>✓</span>
                                        <span>Stellar Transaction Signed!</span>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Transaction XDR</label>
                                        <div className="code-block">{stellarTx}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Step 5: Submit Stellar Transaction */}
                    {stellarTx && (
                        <div className="step">
                            <div className="step-content">
                                <h3>Submit Stellar Transaction</h3>
                                <p className="text-muted">Submit the signed transaction to the Stellar network</p>
                                
                                <button 
                                    className="btn btn-success" 
                                    onClick={handleSubmitStellarTx}
                                    disabled={isLoading !== null}
                                >
                                    {isLoading === 'submitting' ? 'Submitting...' : 'Submit Stellar Transaction'}
                                </button>

                                {stellarSubmitResult && (
                                    <div className="step-result">
                                        <div className="status status-success">
                                            <span>✓</span>
                                            <span>Transaction Submitted Successfully!</span>
                                        </div>
                                        <div className="code-block">
                                            {JSON.stringify(stellarSubmitResult, null, 2)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Error Display */}
                {error && (
                    <div className="status status-error" style={{ marginTop: 'var(--space-lg)' }}>
                        <span>✗</span>
                        <span>{error}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Swap; 