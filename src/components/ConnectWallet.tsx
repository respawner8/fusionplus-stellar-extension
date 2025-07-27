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
        <div>
            <h2>Connect Wallets</h2>

            {/* MetaMask Connection */}
            <div>
                <h3>Ethereum (MetaMask)</h3>
                {metaMaskAccount ? (
                    <div>
                        <p>Connected: {`${metaMaskAccount.substring(0, 6)}...${metaMaskAccount.substring(metaMaskAccount.length - 4)}`}</p>
                        <button onClick={disconnectMetaMask}>Disconnect MetaMask</button>
                    </div>
                ) : (
                    <button onClick={connectMetaMask} disabled={!!metaMaskAccount}>
                        Connect MetaMask
                    </button>
                )}
                {metaMaskError && <p style={{ color: 'red' }}>{metaMaskError}</p>}
            </div>

            <hr style={{ margin: '20px 0' }} />

            {/* Freighter Connection */}
            <div>
                <h3>Stellar (Freighter)</h3>
                {freighterPublicKey ? (
                    <div>
                        <p>Connected: {`${freighterPublicKey.substring(0, 6)}...${freighterPublicKey.substring(freighterPublicKey.length - 4)}`}</p>
                        <button onClick={disconnectFreighter}>Disconnect Freighter</button>
                    </div>
                ) : (
                    <button onClick={connectFreighter} disabled={!!freighterPublicKey}>
                        Connect Freighter
                    </button>
                )}
                {freighterError && <p style={{ color: 'red' }}>{freighterError}</p>}
            </div>
        </div>
    );
};

export default ConnectWallet; 