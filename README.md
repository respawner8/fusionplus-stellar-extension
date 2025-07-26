# Fusion+ Stellar Atomic Swap

This project implements an atomic swap between Ethereum (using 1inch Fusion+ SDK) and Stellar (using stellar-sdk).

## Features

-   Generate secret and hash for HTLC.
-   Create and manage Fusion orders.
-   Lock and claim XLM on the Stellar network.
-   Simulate a full atomic swap.

## Directory Structure

```
/
|-- dist/
|-- src/
|   |-- config/
|   |   `-- index.ts
|   |-- fusion/
|   |   `--- logic.ts
|   |-- stellar/
|   |   `-- logic.ts
|   |-- utils/
|   |   `-- htlc.ts
|   `-- scripts/
|       |-- 1_generateSecret.ts
|       |-- 2_createFusionOrder.ts
|       |-- 3_lockXLM.ts
|       |-- 4_claimXLM.ts
|       `-- 5_fullSwap.ts
|-- .env
|-- .gitignore
|-- package.json
|-- tsconfig.json
```

## Setup

1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Create a `.env` file from the `.env.example` and fill in the required values.
4.  Compile the TypeScript code: `npm run build`

## Usage

Run the scripts in the `src/scripts` directory to perform the atomic swap operations.

For example:

```bash
npx ts-node src/scripts/1_generateSecret.ts
```