import React, { useState, useEffect } from 'react';
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
    const [wethBalance, setWethBalance] = useState<string>('0');
    const [exchangeRate, setExchangeRate] = useState<number>(1000); // 1 ETH = 1000 XLM (demo rate)
    const [chainId, setChainId] = useState<number>(1);

    // Fetch exchange rate on component mount
    useEffect(() => {
        fetchExchangeRate();
    }, []);

    // Check WETH balance when wallet connects
    useEffect(() => {
        if (metaMaskAccount && provider) {
            checkWethBalance();
            // Also check ETH balance for debugging
            checkEthBalance();
        }
    }, [metaMaskAccount, provider]);

    const checkEthBalance = async () => {
        if (!provider || !metaMaskAccount) return;
        
        try {
            const ethBalance = await provider.getBalance(metaMaskAccount);
            console.log('Current ETH balance:', ethers.formatEther(ethBalance));
        } catch (error) {
            console.error('Error checking ETH balance:', error);
        }
    };

    const checkWethBalance = async () => {
        if (!provider || !metaMaskAccount) return;
        
        try {
            // WETH addresses for different networks
            const wethAddresses = {
                1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // Ethereum Mainnet
                11155111: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9', // Sepolia Testnet
                5: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6' // Goerli Testnet
            };
            
            // Get current network
            const network = await provider.getNetwork();
            const chainId = network.chainId;
            console.log('Current network chainId:', chainId);
            
            const wethAddress = wethAddresses[chainId as keyof typeof wethAddresses];
            if (!wethAddress) {
                console.error('WETH not available for chainId:', chainId);
                setWethBalance('0');
                return;
            }
            
            console.log('Using WETH address for chainId', chainId, ':', wethAddress);
            const wethAbi = ["function balanceOf(address owner) external view returns (uint256)"];
            const wethContract = new ethers.Contract(wethAddress, wethAbi, provider);
            
            console.log('Checking WETH balance for address:', metaMaskAccount);
            
            // First, let's check if the contract exists and is accessible
            try {
                // Use callStatic to avoid transaction simulation issues
                const balance = await wethContract.balanceOf.staticCall(metaMaskAccount);
                const formattedBalance = ethers.formatEther(balance);
                setWethBalance(formattedBalance);
                console.log('Current WETH balance:', formattedBalance);
            } catch (callError: any) {
                // If staticCall fails, try regular call
                console.log('Static call failed, trying regular call...');
                const balance = await wethContract.balanceOf(metaMaskAccount);
                const formattedBalance = ethers.formatEther(balance);
                setWethBalance(formattedBalance);
                console.log('Current WETH balance (regular call):', formattedBalance);
            }
        } catch (error: any) {
            console.error('Error checking WETH balance:', error);
            
            // If it's a BAD_DATA error (empty result), it likely means no WETH
            if (error.code === 'BAD_DATA' || error.message.includes('could not decode result data')) {
                console.log('No WETH balance found, setting to 0');
                setWethBalance('0');
            } else {
                // For other errors, still set to 0 but log the specific error
                console.error('Specific WETH balance error:', error.message);
                setWethBalance('0');
            }
        }
    };

    const fetchExchangeRate = async () => {
        try {
            // For demo purposes, using a fixed rate
            // In a real implementation, you would fetch from a price API
            const rate = 1000; // 1 ETH = 1000 XLM (demo rate)
            setExchangeRate(rate);
            console.log('Exchange rate set to:', rate);
        } catch (error) {
            console.error('Error fetching exchange rate:', error);
            // Fallback to default rate
            setExchangeRate(1000);
        }
    };

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

    const wrapEthToWeth = async () => {
        if (!provider || !metaMaskAccount) {
            setError('Please connect your MetaMask wallet first.');
            return;
        }

        setError(null);
        setIsLoading('wrapping');

        try {
            const signer = await provider.getSigner();
            
            // Check if user has enough ETH
            const ethBalance = await provider.getBalance(metaMaskAccount);
            const requiredAmount = ethers.parseEther(amount);
            
            console.log('ETH balance:', ethers.formatEther(ethBalance));
            console.log('Required amount:', ethers.formatEther(requiredAmount));
            
            if (ethBalance < requiredAmount) {
                throw new Error(`Insufficient ETH balance. You have ${ethers.formatEther(ethBalance)} ETH but need ${amount} ETH`);
            }
            
            // WETH addresses for different networks
            const wethAddresses = {
                1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // Ethereum Mainnet
                11155111: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9', // Sepolia Testnet
                5: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6' // Goerli Testnet
            };
            
            // Get current network
            const network = await provider.getNetwork();
            const chainId = network.chainId;
            console.log('Current network chainId for wrapping:', chainId);
            
            const wethAddress = wethAddresses[chainId as keyof typeof wethAddresses];
            if (!wethAddress) {
                throw new Error(`WETH not available for chainId: ${chainId}`);
            }
            
            console.log('Using WETH address for wrapping:', wethAddress);
            
            // WETH contract ABI for deposit function
            const wethAbi = [
                "function deposit() external payable",
                "function balanceOf(address owner) external view returns (uint256)",
                "function decimals() external view returns (uint8)"
            ];

            const wethContract = new ethers.Contract(wethAddress, wethAbi, signer);
            
            console.log('Wrapping ETH to WETH...');
            console.log('Amount:', amount, 'ETH');
            console.log('Wallet address:', metaMaskAccount);
            
            // Wrap ETH to WETH
            const tx = await wethContract.deposit({ value: ethers.parseEther(amount) });
            console.log('Transaction sent:', tx.hash);
            
            await tx.wait();
            console.log('Transaction confirmed');
            
            // Get updated WETH balance with better error handling
            try {
                const balance = await wethContract.balanceOf.staticCall(metaMaskAccount);
                console.log('WETH balance raw:', balance.toString());
                setWethBalance(ethers.formatEther(balance));
                console.log('ETH wrapped to WETH successfully');
            } catch (balanceError: any) {
                console.error('Error reading WETH balance:', balanceError);
                
                // If it's a BAD_DATA error, use the wrapped amount as fallback
                if (balanceError.code === 'BAD_DATA' || balanceError.message.includes('could not decode result data')) {
                    console.log('Using wrapped amount as WETH balance fallback');
                    setWethBalance(amount);
                } else {
                    // For other errors, still use wrapped amount
                    console.error('Specific WETH balance error:', balanceError.message);
                    setWethBalance(amount);
                }
            }
            
            // Refresh WETH balance
            await checkWethBalance();
            
        } catch (e: any) {
            console.error('Error wrapping ETH:', e);
            setError(`Failed to wrap ETH: ${e.message}`);
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
        
        // Check for minimum amount to avoid API issues
        const amountValue = parseFloat(amount);
        if (amountValue < 0.001) {
            setError('Amount must be at least 0.001 ETH for Fusion+ API compatibility.');
            return;
        }
        
        // Check if user has enough WETH
        const requiredWeth = parseFloat(amount);
        const currentWeth = parseFloat(wethBalance);
        
        console.log('Required WETH:', requiredWeth);
        console.log('Current WETH balance:', currentWeth);
        
        if (currentWeth < requiredWeth) {
            setError(`Insufficient WETH balance. You have ${wethBalance} WETH but need ${requiredWeth} WETH. Please wrap more ETH first.`);
            return;
        }
        setError(null);
        setIsLoading('creating-order');

        try {
            // Get the current network from the provider
            const network = await provider.getNetwork();
            const chainId = Number(network.chainId); // Convert to number for comparison
            setChainId(chainId);
            console.log('Current network chainId:', chainId);
            console.log('ChainId type:', typeof chainId);
            
            // Check if we're on a supported network
            if (chainId !== 1) {
                throw new Error(`Fusion+ API only supports Ethereum Mainnet (1). Please switch MetaMask to Ethereum Mainnet. Current: ${chainId === 11155111 ? 'Sepolia Testnet' : `Chain ID ${chainId}`}`);
            }
            
            // Create a custom connector that implements the required interface
            const connector = {
                web3Provider: provider,
                signTypedData: async (walletAddress: string, typedData: any) => {
                    const signer = await provider.getSigner();
                    console.log('signTypedData called with:', { walletAddress, typedData });
                    
                    try {
                        // Use the correct signTypedData method with primaryType
                        return await signer.signTypedData(
                            typedData.domain,
                            { [typedData.primaryType]: typedData.types[typedData.primaryType] },
                            typedData.message
                        );
                    } catch (error) {
                        console.error('Error in signTypedData:', error);
                        console.error('typedData structure:', JSON.stringify(typedData, null, 2));
                        throw error;
                    }
                },
                sign: async (walletAddress: string, message: string) => {
                    try {
                        const signer = await provider.getSigner();
                        console.log('sign called with:', { walletAddress, message });
                        return await signer.signMessage(message);
                    } catch (error) {
                        console.error('Error in sign:', error);
                        throw error;
                    }
                },
                getBalance: async (walletAddress: string) => {
                    return await provider.getBalance(walletAddress);
                },
                getCode: async (walletAddress: string) => {
                    return await provider.getCode(walletAddress);
                },
                getBlockNumber: async () => {
                    return await provider.getBlockNumber();
                },
                getGasPrice: async () => {
                    return await provider.getGasPrice();
                },
                getNetwork: async () => {
                    return await provider.getNetwork();
                },
                getTransaction: async (hash: string) => {
                    return await provider.getTransaction(hash);
                },
                getTransactionReceipt: async (hash: string) => {
                    return await provider.getTransactionReceipt(hash);
                },
                call: async (to: string, data: string) => {
                    return await provider.call({ to, data });
                },
                estimateGas: async (transaction: any) => {
                    return await provider.estimateGas(transaction);
                },
                sendTransaction: async (transaction: any) => {
                    try {
                        const signer = await provider.getSigner();
                        console.log('sendTransaction called with:', transaction);
                        return await signer.sendTransaction(transaction);
                    } catch (error) {
                        console.error('Error in sendTransaction:', error);
                        throw error;
                    }
                },
            };
            
            // Fusion+ API requires an API key
            const FUSION_API_KEY = import.meta.env.VITE_FUSION_API_KEY || 'YOUR_FUSION_API_KEY';
            
            console.log('Fusion API Key configured:', FUSION_API_KEY ? 'Yes' : 'No');
            
            if (FUSION_API_KEY === 'YOUR_FUSION_API_KEY') {
                setError('Fusion+ API key not configured. Please set VITE_FUSION_API_KEY environment variable.');
                return;
            }
            
            // Initialize Fusion+ SDK correctly
            console.log('Creating Fusion+ SDK with connector:', connector);
            
            const sdk = new FusionSDK({
                url: '/api/fusion', // Use proxy to avoid CORS issues
                network: chainId,
                blockchainProvider: connector,
                authKey: FUSION_API_KEY,
            });
            
            console.log('Fusion+ SDK created successfully');

            console.log('Using swap amount:', amount);
            console.log('Hash for atomic swap:', `0x${bytesToHex(hash)}`);
            console.log('Hash length:', hash.length);
            
            // Token addresses for Ethereum Mainnet only (Fusion+ API requirement)
            const tokens = {
                weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH on mainnet
                dai: '0x6B175474E89094C44Da98b954EedeAC495271d0F',   // DAI on mainnet
            };
            
            console.log('Using token addresses for chainId', chainId, ':', tokens);
            
            // First, get a quote from Fusion+ API
            console.log('Getting quote from Fusion+ API...');
            const quoteParams = {
                fromTokenAddress: tokens.weth,
                toTokenAddress: tokens.dai,
                amount: ethers.parseEther(amount).toString(),
                walletAddress: metaMaskAccount,
                source: 'sdk',
            };
            
            try {
                console.log('Quote params:', JSON.stringify(quoteParams, null, 2));
                
                // Try direct order placement with minimal parameters first
                const orderParams = {
                    fromTokenAddress: tokens.weth,
                    toTokenAddress: tokens.dai,
                    amount: ethers.parseEther(amount).toString(),
                    walletAddress: metaMaskAccount,
                    preset: PresetEnum.fast,
                    source: 'sdk',
                };

                console.log('Order params:', JSON.stringify(orderParams, null, 2));
                
                const createdOrder = await sdk.placeOrder(orderParams);
                setOrder(createdOrder);
                console.log('Fusion Order Created:', createdOrder);
            } catch (orderError: any) {
                console.error('Detailed Fusion order error:', orderError);
                console.error('Error response:', orderError.response?.data);
                console.error('Error status:', orderError.response?.status);
                console.error('Error config:', orderError.config);
                console.error('Full error response:', JSON.stringify(orderError.response?.data, null, 2));
                
                // Provide more specific error messages
                if (orderError.response?.status === 400) {
                    const errorData = orderError.response?.data;
                    if (errorData?.message) {
                        throw new Error(`Fusion+ API Error: ${errorData.message}`);
                    } else {
                        throw new Error('Fusion+ API Error: Invalid request parameters. Please check your input values.');
                    }
                } else if (orderError.response?.status === 401) {
                    throw new Error('Fusion+ API Error: Invalid API key. Please check your VITE_FUSION_API_KEY.');
                } else if (orderError.response?.status === 403) {
                    throw new Error('Fusion+ API Error: Access denied. Please check your API key permissions.');
                } else {
                    throw orderError;
                }
            }
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
                                                            placeholder="e.g., 0.001"
                    />
                    <small className="text-muted">Minimum amount: 0.001 ETH for Fusion+ API compatibility</small>
                            </div>

                            {amount && parseFloat(amount) > 0 && (
                                <div className="swap-preview">
                                    <div className="swap-rate">
                                        <span>Exchange Rate: 1 ETH = {exchangeRate.toLocaleString()} XLM</span>
                                        <button 
                                            className="btn btn-secondary btn-sm"
                                            onClick={fetchExchangeRate}
                                            style={{ marginLeft: '10px' }}
                                        >
                                            🔄 Refresh
                                        </button>
                                    </div>
                                    <div className="swap-amounts">
                                        <div className="amount-item">
                                            <span className="label">You Pay:</span>
                                            <span className="value">{amount} ETH</span>
                                        </div>
                                        <div className="amount-item">
                                            <span className="label">You Receive:</span>
                                            <span className="value">{(parseFloat(amount) * exchangeRate).toFixed(2)} XLM</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Step 3: Wrap ETH to WETH */}
                    <div className="step">
                        <div className="step-content">
                            <h3>Wrap ETH to WETH</h3>
                            <p className="text-muted">Convert your ETH to WETH (Wrapped ETH) for the Fusion+ swap</p>
                            
                            <button 
                                className="btn btn-primary" 
                                onClick={wrapEthToWeth}
                                disabled={!provider || !metaMaskAccount || !amount || !hash || isLoading !== null}
                            >
                                {isLoading === 'wrapping' ? 'Wrapping ETH...' : 'Wrap ETH to WETH'}
                            </button>

                            {wethBalance !== '0' && (
                                <div className="step-result">
                                    <div className="status status-success">
                                        <span>✓</span>
                                        <span>ETH Wrapped Successfully!</span>
                                    </div>
                                    <div className="weth-balance">
                                        <span>WETH Balance: {wethBalance} WETH</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Step 4: Create Fusion Order */}
                    <div className="step">
                        <div className="step-content">
                            <h3>Create Fusion Order & Lock WETH</h3>
                            <p className="text-muted">Create a Fusion+ order to lock your WETH. The hash will be used later for atomic swap verification.</p>
                            <div className="network-info">
                                <small className="text-muted">
                                    Network: {chainId === 1 ? 'Ethereum Mainnet' : chainId === 11155111 ? 'Sepolia Testnet' : `Chain ID ${chainId}`}
                                </small>
                            </div>
                            
                            <button 
                                className="btn btn-primary" 
                                onClick={handleSwap}
                                disabled={!provider || !metaMaskAccount || !amount || !hash || wethBalance === '0' || isLoading !== null}
                            >
                                {isLoading === 'creating-order' ? 'Creating Order...' : 'Create Fusion Order'}
                            </button>

                            {order && (
                                <div className="step-result">
                                    <div className="status status-success">
                                        <span>✓</span>
                                        <span>Fusion+ Order Created Successfully!</span>
                                    </div>
                                    <div className="code-block">
                                        {JSON.stringify(order, null, 2)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Step 5: Create Stellar Escrow */}
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

                    {/* Step 6: Submit Stellar Transaction */}
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