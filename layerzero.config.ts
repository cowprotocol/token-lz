import { EndpointId } from '@layerzerolabs/lz-definitions'
import { ExecutorOptionType } from '@layerzerolabs/lz-v2-utilities'
import { TwoWayConfig, generateConnectionsConfig } from '@layerzerolabs/metadata-tools'
import { OAppEnforcedOption } from '@layerzerolabs/toolbox-hardhat'

import type { OmniPointHardhat } from '@layerzerolabs/toolbox-hardhat'

// To learn more, read https://docs.layerzero.network/v2/concepts/applications/oapp-standard#execution-options-and-enforced-settings
// We use the LZ reccomended 80000 gas for because we are using their ERC20 contract without any modifications to the receiving or transfer functions
const EVM_ENFORCED_OPTIONS: OAppEnforcedOption[] = [
    {
        msgType: 1,
        optionType: ExecutorOptionType.LZ_RECEIVE,
        gas: 80000,
        value: 0,
    },
]

/*
 *  Elaboration on `value` when sending OFTs to Solana:
 *   When sending OFTs to Solana, SOL is needed for rent (https://solana.com/docs/core/accounts#rent) to initialize the recipient's token account.
 *   The `2039280` lamports value is the exact rent value needed for SPL token accounts (0.00203928 SOL).
 *   For Token2022 token accounts, you will need to increase `value` to a higher amount, which depends on the token account size, which in turn depends on the extensions that you enable.
 */

const SOLANA_ENFORCED_OPTIONS: OAppEnforcedOption[] = [
    {
        msgType: 1,
        optionType: ExecutorOptionType.LZ_RECEIVE,
        gas: 200000,
        value: 2039280,
    },
]

/**
 *  WARNING: ONLY 1 OFTAdapter should exist for a given global mesh.
 *  The token address for the adapter should be defined in hardhat.config. This will be used in deployment.
 *
 *  for example:
 *
 *       'optimism-testnet': {
 *           eid: EndpointId.OPTSEP_V2_TESTNET,
 *           url: process.env.RPC_URL_OP_SEPOLIA || 'https://optimism-sepolia.gateway.tenderly.co',
 *           accounts,
 *         oftAdapter: {
 *             tokenAddress: '0x0', // Set the token address for the OFT adapter
 *         },
 *     },
 */

// the list of networks to confirgure
// hints on a good confirmation value to put are here:
// https://docs.layerzero.network/v1/developers/evm/technical-reference/mainnet/default-config
const networks: {
    contract: OmniPointHardhat,
    confirmations: number,
    enforcedOptions: OAppEnforcedOption[],
    config?: { owner?: string, delegate?: string },
}[] = [
    {
        contract: {
            eid: EndpointId.ETHEREUM_V2_MAINNET,
            contractName: 'CowOftAdapter',
        },
        confirmations: 15,
        enforcedOptions: EVM_ENFORCED_OPTIONS,
    },
    {
        contract: {
            eid: EndpointId.BSC_V2_MAINNET,
            contractName: 'CowOft',
        },
        confirmations: 20,
        enforcedOptions: EVM_ENFORCED_OPTIONS,
    },
    {
        contract: {
            eid: EndpointId.AVALANCHE_V2_MAINNET,
            contractName: 'CowOft',
        },
        confirmations: 12,
        enforcedOptions: EVM_ENFORCED_OPTIONS
    },
    {
        contract: {
            eid: EndpointId.SOLANA_V2_MAINNET,
            address: 'F3Q4oxHyB49zPMC8V54oLkCM8844CmwNY6MmipXvS2GL'
        },
        config: {
            owner: '5CbSkyzNq3zzTDVN9MTz1963HgDPttCpkngEfVmLSP6U',
            delegate: '5CbSkyzNq3zzTDVN9MTz1963HgDPttCpkngEfVmLSP6U'
        },
        confirmations: 32,
        enforcedOptions: SOLANA_ENFORCED_OPTIONS
    }
];

// With the config generator, pathways declared are automatically bidirectional
// i.e. if you declare A,B there's no need to declare B,A
const pathways: TwoWayConfig[] = [];

for (let i = 0;i < networks.length;i++) {
    for (let j = i + 1;j < networks.length;j++) {
        pathways.push([
            networks[i].contract,
            networks[j].contract,
            [[], [[
                'LayerZero Labs',
                'Canary',
                'Deutsche Telekom'
            ], 2]], // [ requiredDVN[], [ optionalDVN[], threshold ] ]
            [networks[i].confirmations, networks[j].confirmations], // [A to B confirmations, B to A confirmations]
            [networks[j].enforcedOptions, networks[i].enforcedOptions], // Chain B enforcedOptions, Chain A enforcedOptions
        ])
    }
}

console.log(`generated ${pathways.length} configuration pathways`);

export default async function () {
    // Generate the connections config based on the pathways
    const connections = await generateConnectionsConfig(pathways)
    return {
        contracts: networks,
        connections,
    }
}
