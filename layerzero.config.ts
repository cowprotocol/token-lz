import { EndpointId } from '@layerzerolabs/lz-definitions'
import { ExecutorOptionType } from '@layerzerolabs/lz-v2-utilities'
import { TwoWayConfig, generateConnectionsConfig } from '@layerzerolabs/metadata-tools'
import { OAppEnforcedOption } from '@layerzerolabs/toolbox-hardhat'

import type { OmniPointHardhat } from '@layerzerolabs/toolbox-hardhat'

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
    confirmations: number
}[] = [
    {
        contract: {
            eid: EndpointId.ETHEREUM_V2_MAINNET,
            contractName: 'CowOftAdapter',
        },
        confirmations: 15
    },
    {
        contract: {
            eid: EndpointId.BSC_V2_MAINNET,
            contractName: 'CowOft',
        },
        confirmations: 20,
    },
    {
        contract: {
            eid: EndpointId.AVALANCHE_V2_MAINNET,
            contractName: 'CowOft',
        },
        confirmations: 12,
    }
];

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

// With the config generator, pathways declared are automatically bidirectional
// i.e. if you declare A,B there's no need to declare B,A
const pathways: TwoWayConfig[] = [];

for (let i = 0;i < networks.length;i++) {
    for (let j = i + 1;j < networks.length;j++) {
        pathways.push([
            networks[i].contract,
            networks[j].contract,
            [['LayerZero Labs'], []], // [ requiredDVN[], [ optionalDVN[], threshold ] ]
            [networks[i].confirmations, networks[j].confirmations], // [A to B confirmations, B to A confirmations]
            [EVM_ENFORCED_OPTIONS, EVM_ENFORCED_OPTIONS], // Chain B enforcedOptions, Chain A enforcedOptions
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
