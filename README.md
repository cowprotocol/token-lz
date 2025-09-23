# CoW Swap Omnichain Fungible Token (OFT)

This project provides an implementation for the CoW Protocol Token (COW) using LayerZero's OFT standard.

---

### Key Contracts

* **OFT Adapter**: This implementation uses a **lock-and-unlock** mechanism for cross-chain transfers, treating the already-deployed native COW token on Ethereum Mainnet as the "inner token" and wrapping it for use on other chains. This contract is only deployed on Ethereum Mainnet.
* **OFT Token**: An "Omnichain Fungible Token" from LayerZero, operating on LayerZero's OApp standard, which is a generalized messaging protocol for secure cross-chain communication. This is deployed on every other chain as an ERC20.

---

### Core Commands

* `pnpm install`: Installs project dependencies.
* `pnpm compile`: Compiles all contracts.
* `pnpm test`: Runs all tests.
* `pnpm hardhat lz:deploy --tags <contractName> --networks <networkName>`: Deploys a specific contract to a network.
* `pnpm hardhat lz:oapp:wire --oapp-config layerzero.config.ts`: Wires the deployed OFT contracts for cross-chain messaging.
* `pnpm hardhat lz:oft:send --src-eid <sourceEid> --dst-eid <destinationEid> --amount <amount> --to <address>`: Sends OFT tokens to a destination chain.

---

### Supported Networks

| Network Name | Endpoint ID | Deployed Contract
| :--- | :--- |
| **Ethereum Mainnet** | `30101` | CowOftAdapter
| **BNB Smart Chain (BSC) Mainnet** | `30102` | CowOft

---

### Important References

* [**LayerZero v2 Documentation**](https://docs.layerzero.network/v2)
* [**OFT Standard**](https://docs.layerzero.network/v2/concepts/applications/oft-standard)
* [**OApp Standard**](https://docs.layerzero.network/v2/concepts/applications/oapp-standard)
* [**Deployment Guide**](https://docs.layerzero.network/v2/developers/evm/create-lz-oapp/deploying)
* [**Messaging & Wiring**](https://docs.layerzero.network/v2/developers/evm/create-lz-oapp/wiring)
