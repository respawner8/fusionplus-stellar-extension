import React from 'react';
import { useWallets } from '../context/WalletContext';

const ConnectWallet: React.FC = () => {
    const {
        metaMaskAccount,
        connectMetaMask,
        disconnectMetaMask,
        metaMaskError,
        freighterPublicKey,
        connectFreighter,
        disconnectFreighter,
        freighterError
    } = useWallets();

    return (
        <div className="fade-in">
            <div className="card-header">
                <div className="card-icon">🔗</div>
                <h2>Connect Wallets</h2>
            </div>

            <div className="wallet-connection">
                {/* MetaMask Connection */}
                <div className="card wallet-card ethereum">
                    <div className="card-header">
                        <div className="card-icon">🦊</div>
                        <div>
                            <h3>Ethereum (MetaMask)</h3>
                            <p className="text-muted">Connect your MetaMask wallet for ETH transactions</p>
                        </div>
                    </div>

                    {metaMaskAccount ? (
                        <div>
                            <div className="status status-success">
                                <span>✓</span>
                                <span>Connected</span>
                            </div>
                            <p className="wallet-address">
                                {`${metaMaskAccount.substring(0, 6)}...${metaMaskAccount.substring(metaMaskAccount.length - 4)}`}
                            </p>
                            <button 
                                className="btn btn-secondary btn-sm" 
                                onClick={disconnectMetaMask}
                            >
                                Disconnect MetaMask
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div className="status status-warning">
                                <span>⚠</span>
                                <span>Not Connected</span>
                            </div>
                            <button 
                                className="btn btn-primary" 
                                onClick={connectMetaMask}
                                disabled={!!metaMaskAccount}
                            >
                                Connect MetaMask
                            </button>
                        </div>
                    )}
                    
                    {metaMaskError && (
                        <div className="status status-error">
                            <span>✗</span>
                            <span>{metaMaskError}</span>
                        </div>
                    )}
                </div>

                {/* Freighter Connection */}
                <div className="card wallet-card stellar">
                    <div className="card-header">
                        <div className="card-icon">⭐</div>
                        <div>
                            <h3>Stellar (Freighter)</h3>
                            <p className="text-muted">Connect your Freighter wallet for XLM transactions</p>
                        </div>
                    </div>

                    {freighterPublicKey ? (
                        <div>
                            <div className="status status-success">
                                <span>✓</span>
                                <span>Connected</span>
                            </div>
                            <p className="wallet-address">
                                {`${freighterPublicKey.substring(0, 6)}...${freighterPublicKey.substring(freighterPublicKey.length - 4)}`}
                            </p>
                            <button 
                                className="btn btn-secondary btn-sm" 
                                onClick={disconnectFreighter}
                            >
                                Disconnect Freighter
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div className="status status-warning">
                                <span>⚠</span>
                                <span>Not Connected</span>
                            </div>
                            <button 
                                className="btn btn-primary" 
                                onClick={connectFreighter}
                                disabled={!!freighterPublicKey}
                            >
                                Connect Freighter
                            </button>
                        </div>
                    )}
                    
                    {freighterError && (
                        <div className="status status-error">
                            <span>✗</span>
                            <span>{freighterError}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConnectWallet; 