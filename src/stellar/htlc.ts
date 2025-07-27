import StellarSdk from 'stellar-sdk';

const STELLAR_NETWORK = 'Test SDF Network ; September 2015';
const HORIZON_URL = 'https://horizon-testnet.stellar.org';

// Helper to load an account using fetch
export async function loadAccount(publicKey: string) {
    const response = await fetch(`${HORIZON_URL}/accounts/${publicKey}`);
    if (!response.ok) throw new Error('Failed to load account');
    const data = await response.json();
    // Convert to StellarSdk.Account instance
    return new StellarSdk.Account(data.account_id, data.sequence);
}

// We will assume a 10 XLM swap for now.
const SWAP_AMOUNT = '10';

/**
 * Builds the transaction to create and set up the hash-locked escrow account.
 * This uses sponsored reserves to create and configure the account in a single transaction.
 * @param lockerPublicKey - The public key of the person locking the XLM (the sponsor).
 * @param receiverPublicKey - The public key of the person who will be able to claim the XLM.
 * @param hash - The SHA-256 hash (as a Uint8Array) that locks the contract.
 * @returns An object containing the base64-encoded transaction XDR and the new escrow account's Keypair.
 */
export const buildCreateEscrowTransaction = async (
    lockerPublicKey: string,
    receiverPublicKey: string,
    hash: Uint8Array
): Promise<{ transactionXDR: string; escrowKeypair: typeof StellarSdk.Keypair; }> => {
    const lockerAccount = await loadAccount(lockerPublicKey);
    const escrowKeypair = StellarSdk.Keypair.random();

    // Fetch base fee
    const feeResp = await fetch(`${HORIZON_URL}/fee_stats`);
    const feeData = await feeResp.json();
    const baseFee = feeData.fee_charged.p10 || '100';

    const transaction = new StellarSdk.TransactionBuilder(lockerAccount, {
        fee: baseFee.toString(),
        networkPassphrase: STELLAR_NETWORK,
    })
    // Start sponsoring the new account
    .addOperation(StellarSdk.Operation.beginSponsoringFutureReserves({
        sponsoredId: escrowKeypair.publicKey(),
    }))
    // Create the account, sponsored by the locker
    .addOperation(StellarSdk.Operation.createAccount({
        destination: escrowKeypair.publicKey(),
        startingBalance: SWAP_AMOUNT, 
    }))
    // Add the hash of the secret as a signer on the new account
    .addOperation(StellarSdk.Operation.setOptions({
        source: escrowKeypair.publicKey(),
        signer: {
            sha256Hash: Buffer.from(hash),
            weight: 1,
        },
    }))
    // Add the receiver as a signer on the new account
    .addOperation(StellarSdk.Operation.setOptions({
        source: escrowKeypair.publicKey(),
        signer: {
            ed25519PublicKey: receiverPublicKey,
            weight: 1,
        }
    }))
    // Set the final signing thresholds on the new account
    .addOperation(StellarSdk.Operation.setOptions({
        source: escrowKeypair.publicKey(),
        masterWeight: 0, // Lock the master key
        lowThreshold: 1,
        medThreshold: 2, // Required for claiming (receiver + hash)
        highThreshold: 2,
    }))
    // End the sponsorship
    .addOperation(StellarSdk.Operation.endSponsoringFutureReserves({
        source: escrowKeypair.publicKey(),
    }))
    .addMemo(StellarSdk.Memo.text('Fusion+ Stellar Atomic Swap'))
    .setTimeout(StellarSdk.TimeoutInfinite)
    .build();

    return {
        transactionXDR: transaction.toXDR(),
        escrowKeypair,
    };
};

// Helper to submit a transaction XDR to Horizon
export async function submitTransaction(xdr: string) {
    const response = await fetch(`${HORIZON_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `tx=${encodeURIComponent(xdr)}`
    });
    return await response.json();
} 