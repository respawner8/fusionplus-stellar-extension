import { generateSecret } from '../utils/htlc';

function run() {
    const { secret, hash } = generateSecret();
    console.log('Secret:', secret.toString('hex'));
    console.log('Hash:', hash.toString('hex'));
}

run(); 