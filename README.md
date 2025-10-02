# CoW DAO LayerZero OFT

Cross-chain token implementation for the CoW Protocol Token using LayerZero's [Omnichain Fungible Token (OFT)](https://docs.layerzero.network/v2/concepts/applications/oft-standard) standard.

## Table of Contents

- [Overview](#overview)
- [Requirements](#requirements)
- [Setup](#setup)
- [Compilation](#compilation)
- [Deployment](#deployment)
- [Configuration](#configuration)
- [Important Commands](#important-commands)
- [Testing](#testing)

## Overview

This repository contains CoW DAO's LayerZero OFT implementation:

- **OFTAdapter** (`CowOftAdapter.sol`): Adapts an existing ERC20 token on mainnet (COW token's main chain) using a lock/unlock mechanism
- **OFT** (`CowOft.sol`): Deployed on destination chains using a mint/burn mechanism

The OFTAdapter locks tokens on the origin chain, while OFT contracts on other chains mint/burn corresponding tokens to maintain cross-chain fungibility.

## Requirements

- Node.js >= 18.16.0
- pnpm (or npm/yarn)
- Foundry (forge) >= 0.2.0

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

3. Set deployer credentials in `.env`:
```
MNEMONIC="your mnemonic here"
# or
PRIVATE_KEY="0xabc...def"
```

4. Fund the deployer address with native tokens on target chains

## Compilation

Compile contracts using both Hardhat and Forge:
```bash
pnpm compile
```

Or compile individually:
```bash
pnpm compile:forge
pnpm compile:hardhat
```

## Deployment

### 1. Configure Token Address

In `hardhat.config.ts`, set the token address for the OFTAdapter on the origin chain:

```typescript
oftAdapter: {
    tokenAddress: '<INNER_TOKEN_ADDRESS>',
}
```

### 2. (optional) Configure Multisig Owner

Set up a Safe multisig at [https://app.safe.global](https://app.safe.global) and configure it in `hardhat.config.ts`:

```typescript
owner: {
    default: '<SAFE_ADDRESS>', // CoW DAO multisig
},
```

### 3. Deploy Contracts

Deploy the OFTAdapter on the origin chain:
```bash
pnpm hardhat lz:deploy --tags MyOFTAdapter --networks <origin-network>
```

Deploy OFT contracts on destination chains:
```bash
pnpm hardhat lz:deploy --tags MyOFT --networks <destination-network>
```

### 4. Wire the Contracts

Generate wiring transactions:
```bash
pnpm hardhat lz:oapp:wire --oapp-config layerzero.config.ts --output-filename txns.json
```

Convert transactions to Safe format:
```bash
node scripts/convert-to-safe-format.js txns.json
```

A series of files will be created in your project folder for transactions to execute on each network. Execute the generated batches through Safe Transaction Builder.

**Note:** Chain ID warnings in Safe Transaction Builder are expected due to an issue with LayerZero's providing of EVM chain ID mapping. Please be careful to double check the network when uploading.

## Configuration

Edit `layerzero.config.ts` to configure:
- Cross-chain pathways
- DVN (Data Verification Network) settings
- Gas limits and enforced options
- Block confirmations

Key configuration parameters:
```typescript
const EVM_ENFORCED_OPTIONS: OAppEnforcedOption[] = [
    {
        msgType: 1,
        optionType: ExecutorOptionType.LZ_RECEIVE,
        gas: 80000,  // Adjust based on destination chain gas profiling
        value: 0,
    },
]
```

## Important Commands

### Testing
```bash
pnpm test              # Run all tests (Forge + Hardhat)
pnpm test:forge        # Run Foundry tests
pnpm test:hardhat      # Run Hardhat tests
```

### Deployment
```bash
pnpm hardhat lz:deploy --tags <TAG> --networks <NETWORK>
```

### Configuration Management
```bash
# View current configuration
pnpm hardhat lz:oapp:config:get --oapp-config layerzero.config.ts

# Wire contracts (generate transactions)
pnpm hardhat lz:oapp:wire --oapp-config layerzero.config.ts --output-filename txns.json

# Convert to Safe format
node scripts/convert-to-safe-format.js txns.json
```

### Sending Tokens

Its possible to use the CLI to send tokens once they are deployed:

```bash
pnpm hardhat lz:oft:send --src-eid <SOURCE_EID> --dst-eid <DEST_EID> --amount <AMOUNT> --to <ADDRESS>
```

### Contract Verification
```bash
pnpm dlx @layerzerolabs/verify-contract -n <NETWORK_NAME> -u <API_URL> -k <API_KEY> --contracts <CONTRACT_NAME>
```

### Linting
```bash
pnpm lint          # Check all files
pnpm lint:fix      # Auto-fix linting issues
```

Run tests with Foundry and Hardhat:
```bash
pnpm test              # Run all tests
pnpm test:forge        # Run Foundry tests only
pnpm test:hardhat      # Run Hardhat tests only
```

## Resources

- [LayerZero V2 Documentation](https://docs.layerzero.network/v2)
- [OFT Standard](https://docs.layerzero.network/v2/concepts/applications/oft-standard)
- [Deployed Endpoints](https://docs.layerzero.network/v2/deployments/deployed-contracts)
- [LayerZero Scan](https://layerzeroscan.com/) - Track cross-chain messages
- [Troubleshooting Guide](https://docs.layerzero.network/v2/developers/evm/troubleshooting/debugging-messages)

## License

MIT or Apache
