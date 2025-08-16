import React, { useState } from 'react';
import { useWallets } from '../context/WalletContext';

const DemoGuide: React.FC = () => {
    const { 
        metaMaskAccount, 
        freighterPublicKey, 
        isTestnet,
        network 
    } = useWallets();
    
    const [currentStep, setCurrentStep] = useState(1);
    const [isExpanded, setIsExpanded] = useState(true);

    const demoSteps = [
        {
            id: 1,
            title: "Get Fusion+ API Key",
            description: "Obtain API key from 1inch Fusion+ portal",
            status: "pending",
            icon: "🔑",
            details: [
                "Visit https://portal.1inch.dev/",
                "Sign up or log in to your account",
                "Create a new API key for Fusion+",
                "Copy the API key and add it to your .env file",
                "Set VITE_FUSION_API_KEY=your_api_key_here"
            ]
        },
        {
            id: 2,
            title: "Install Wallets",
            description: "Install MetaMask and Freighter browser extensions",
            status: "pending",
            icon: "🔧",
            details: [
                "Install MetaMask from https://metamask.io/",
                "Install Freighter from https://www.freighter.app/",
                "Create new accounts in both wallets",
                "Make sure both extensions are unlocked and ready"
            ]
        },
        {
            id: 3,
            title: "Connect Wallets",
            description: "Connect both wallets to the dApp",
            status: (metaMaskAccount && freighterPublicKey) ? "completed" : "pending",
            icon: "🔗",
            details: [
                "Connect MetaMask to the dApp (should be on mainnet)",
                "Connect Freighter wallet (should be on testnet by default)",
                "Verify both wallets are connected and showing addresses",
                "Check that MetaMask shows your ETH balance"
            ]
        },
        {
            id: 4,
            title: "Get Test Tokens",
            description: "Obtain test tokens for the demo",
            status: (metaMaskAccount && freighterPublicKey) ? "completed" : "pending",
            icon: "💰",
            details: [
                "**ETH (Mainnet)**: You need real ETH on mainnet for the Fusion+ API demo",
                "**XLM (Testnet)**: Visit https://laboratory.stellar.org/#account-creator?network=testnet",
                "Request at least 10 test XLM for the Stellar side",
                "Note: This demo uses real ETH on mainnet - be careful with amounts!"
            ]
        },
        {
            id: 5,
            title: "Start Atomic Swap",
            description: "Begin the cross-chain swap process",
            status: (metaMaskAccount && freighterPublicKey) ? "ready" : "pending",
            icon: "🔄",
            details: [
                "Generate a cryptographic secret and hash",
                "Enter the amount of ETH to swap (start with small amounts like 0.001 ETH)",
                "Create Fusion+ order to lock ETH (requires gas fee)",
                "Create Stellar escrow to lock XLM",
                "Submit Stellar transaction to testnet"
            ]
        }
    ];

    const getStepStatus = (step: any) => {
        if (step.status === "completed") return "✓";
        if (step.status === "ready") return "🚀";
        return step.id;
    };

    const getStepClass = (step: any) => {
        if (step.status === "completed") return "step-completed";
        if (step.status === "ready") return "step-ready";
        return "step-pending";
    };

    return (
        <div className="card">
            <div className="card-header">
                <div className="card-icon">📖</div>
                <div>
                    <h3>Live Demo Guide</h3>
                    <p className="text-muted">Complete step-by-step guide for Fusion+ API atomic swap demo</p>
                </div>
                <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ? 'Hide' : 'Show'} Guide
                </button>
            </div>

            {isExpanded && (
                <div className="demo-guide-content">
                    <div className="demo-overview">
                        <h4>Live Demo Overview</h4>
                        <p>
                            This demo showcases a <strong>real cross-chain atomic swap</strong> between Ethereum and Stellar networks. 
                            You'll use the actual Fusion+ API to lock ETH on Ethereum mainnet and XLM on Stellar testnet using hash-locked contracts.
                        </p>
                        <div className="demo-warning">
                            <strong>⚠️ Important:</strong> This demo uses real ETH on Ethereum mainnet for Fusion+ API. Start with small amounts (0.001 ETH) and be aware of gas fees.
                        </div>
                    </div>

                    <div className="demo-steps-list">
                        {demoSteps.map((step) => (
                            <div 
                                key={step.id} 
                                className={`demo-step ${getStepClass(step)}`}
                                onClick={() => setCurrentStep(step.id)}
                            >
                                <div className="step-header">
                                    <div className="step-number">
                                        <span className="step-icon">{step.icon}</span>
                                        <span className="step-status">{getStepStatus(step)}</span>
                                    </div>
                                    <div className="step-info">
                                        <h5>{step.title}</h5>
                                        <p>{step.description}</p>
                                    </div>
                                </div>
                                
                                {currentStep === step.id && (
                                    <div className="step-details">
                                        <ul>
                                            {step.details.map((detail, index) => (
                                                <li key={index} dangerouslySetInnerHTML={{ __html: detail }}></li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="demo-notes">
                        <h4>Demo Requirements</h4>
                        <ul>
                            <li><strong>Fusion+ API Key</strong>: Required from https://portal.1inch.dev/</li>
                            <li><strong>MetaMask</strong>: Connected to Ethereum mainnet with ETH balance</li>
                            <li><strong>Freighter</strong>: Connected to Stellar testnet with XLM balance</li>
                            <li><strong>Gas Fees</strong>: ETH for Fusion+ order creation</li>
                            <li><strong>Test XLM</strong>: Free from Stellar testnet faucet</li>
                        </ul>
                    </div>

                    <div className="demo-troubleshooting">
                        <h4>Troubleshooting</h4>
                        <div className="trouble-items">
                            <div className="trouble-item">
                                <strong>MetaMask not connecting?</strong>
                                <p>Make sure MetaMask is unlocked and you've approved the connection. Ensure you're on mainnet.</p>
                            </div>
                            <div className="trouble-item">
                                <strong>Freighter not connecting?</strong>
                                <p>Ensure Freighter extension is installed and unlocked. Should be on testnet by default.</p>
                            </div>
                            <div className="trouble-item">
                                <strong>Fusion+ API errors?</strong>
                                <p>Make sure you have a valid API key from https://portal.1inch.dev/ and it's set in your .env file. CORS issues are handled by the proxy configuration. Also check that you have sufficient ETH for gas fees.</p>
                            </div>
                            <div className="trouble-item">
                                <strong>Stellar transaction failing?</strong>
                                <p>Ensure you have test XLM from the faucet and are on Stellar testnet.</p>
                            </div>
                        </div>
                    </div>

                    <div className="demo-costs">
                        <h4>Estimated Costs</h4>
                        <div className="cost-breakdown">
                            <div className="cost-item">
                                <span className="label">Fusion+ Order:</span>
                                <span className="value">~$5-15 gas fee</span>
                            </div>
                            <div className="cost-item">
                                <span className="label">Swap Amount:</span>
                                <span className="value">Your choice (start with 0.001 ETH)</span>
                            </div>
                            <div className="cost-item total">
                                <span className="label">Total Estimated:</span>
                                <span className="value">~$5-15 + swap amount</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DemoGuide; 