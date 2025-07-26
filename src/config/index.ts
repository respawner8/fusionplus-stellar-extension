import dotenv from 'dotenv';
dotenv.config();

export const config = {
    eth: {
        rpcUrl: process.env.ETH_RPC_URL || '',
        privateKey: process.env.ETH_PRIVATE_KEY || '',
    },
    stellar: {
        secretKey: process.env.STELLAR_SECRET_KEY || '',
        publicKey: process.env.STELLAR_PUBLIC_KEY || '',
    },
    fusion: {
        apiUrl: process.env.FUSION_API_URL || 'https://fusion.1inch.io',
        preset: process.env.FUSION_PRESET || '',
    },
}; 