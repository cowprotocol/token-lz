// Get the environment configuration from .env file
//
// To make use of automatic environment setup:
// - Duplicate .env.example file and name it .env
// - Fill in the environment variables
import 'dotenv/config'

import '@layerzerolabs/toolbox-hardhat'
import '@nomiclabs/hardhat-ethers'
import 'hardhat-contract-sizer'
import 'hardhat-deploy'
import { HardhatUserConfig, HttpNetworkAccountsUserConfig } from 'hardhat/types'

import { EndpointId } from '@layerzerolabs/lz-definitions'

import './tasks/sendOFT'
import './type-extensions'

// Set your preferred authentication method
//
// If you prefer using a mnemonic, set a MNEMONIC environment variable
// to a valid mnemonic
const MNEMONIC = process.env.MNEMONIC

// If you prefer to be authenticated using a private key, set a PRIVATE_KEY environment variable
const PRIVATE_KEY = process.env.PRIVATE_KEY

const OWNER = process.env.OWNER || '0x616dE58c011F8736fa20c7Ae5352F7f6FB9F0669'

const accounts: HttpNetworkAccountsUserConfig | undefined = MNEMONIC
    ? { mnemonic: MNEMONIC }
    : PRIVATE_KEY
      ? [PRIVATE_KEY]
      : undefined

if (accounts == null) {
    console.warn(
        'Could not find MNEMONIC or PRIVATE_KEY environment variables. It will not be possible to execute transactions in your example.'
    )
}

const config: HardhatUserConfig = {
    paths: {
        cache: 'cache/hardhat',
    },
    solidity: {
        compilers: [
            {
                version: '0.8.30',
                settings: {
                    // required because the number of internal parameters for the CowOft contract is very high,
                    // and there is no practical way to reduce
                    viaIR: true,
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    networks: {
        'mainnet': {
            eid: EndpointId.ETHEREUM_V2_MAINNET,
            url: process.env.RPC_URL_1 || 'https://mainnet.gateway.tenderly.co',
            accounts,
            oftAdapter: {
                tokenAddress: '0xDEf1CA1fb7FBcDC777520aa7f396b4E015F497aB', // Set the token address for the OFT adapter
            },
        },
        'bsc-mainnet': {
            eid: EndpointId.BSC_V2_MAINNET,
            url: process.env.RPC_URL_56 || 'https://bsc-rpc.publicnode.com',
            accounts,
        },
        'avalanche-mainnet': {
            eid: EndpointId.AVALANCHE_V2_MAINNET,
            url: process.env.RPC_URL_43114 || 'https://avalanche-mainnet.gateway.tenderly.co',
            accounts,
        },
        hardhat: {
            // Need this for testing because TestHelperOz5.sol is exceeding the compiled contract size limit
            allowUnlimitedContractSize: true,
        },
    },
    namedAccounts: {
        deployer: {
            default: 0, // wallet address of index[0], of the mnemonic in .env
        },
        owner: {
            default: OWNER, // COW Treasury multisig
        },
    },
}

export default config
