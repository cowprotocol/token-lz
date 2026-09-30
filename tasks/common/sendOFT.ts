import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { types as devtoolsTypes } from '@layerzerolabs/devtools-evm-hardhat'
import { ChainType, endpointIdToChainType, endpointIdToNetwork } from '@layerzerolabs/lz-definitions'

import { sendEvm } from '../evm/sendEvm'
import { sendSolana } from '../solana/sendSolana'

import { ExtraOptionsArgs, buildExtraOptions } from './options'
import { SendResult } from './types'
import { DebugLogger, KnownOutputs, KnownWarnings, getBlockExplorerLink } from './utils'

interface MasterArgs extends ExtraOptionsArgs {
    srcEid: number
    dstEid: number
    amount: string
    to: string
    /** EVM only: path to LayerZero config file (default: layerzero.config.ts) */
    oappConfig: string
    /** Minimum amount to receive in case of custom slippage or fees (human readable units, e.g. "1.5") */
    minAmount?: string
    /** Arbitrary bytes message to deliver alongside the OFT */
    composeMsg?: string
    /** EVM: 20-byte hex; Solana: base58 PDA of the store */
    oftAddress?: string
    /** Solana only: override the OFT program ID (base58) */
    oftProgramId?: string
    /** Solana only: override the token program (base58) */
    tokenProgram?: string
    /** Solana only: compute unit price scale factor */
    computeUnitPriceScaleFactor?: number
    /** Solana only: address lookup tables (base58) */
    addressLookupTables?: string[]
}

task('lz:oft:send', 'Sends OFT tokens cross‐chain from EVM or Solana')
    .addParam('srcEid', 'Source endpoint ID', undefined, types.int)
    .addParam('dstEid', 'Destination endpoint ID', undefined, types.int)
    .addParam('amount', 'Amount to send (human readable units, e.g. "1.5")', undefined, types.string)
    .addParam('to', 'Recipient address (20-byte hex for EVM, base58 for Solana)', undefined, types.string)
    .addOptionalParam('oappConfig', 'EVM only: path to LayerZero config file', 'layerzero.config.ts', types.string)
    .addOptionalParam(
        'minAmount',
        'Minimum amount to receive in case of custom slippage or fees (human readable units, e.g. "1.5")',
        undefined,
        types.string
    )
    .addOptionalParam(
        'extraLzReceiveOptions',
        'Array of lzReceive options as comma-separated values "gas,value"',
        undefined,
        devtoolsTypes.csv
    )
    .addOptionalParam(
        'extraLzComposeOptions',
        'Array of lzCompose options as comma-separated values "index,gas,value"',
        undefined,
        devtoolsTypes.csv
    )
    .addOptionalParam(
        'extraNativeDropOptions',
        'Array of native drop options as comma-separated values "amount,recipient"',
        undefined,
        devtoolsTypes.csv
    )
    .addOptionalParam('composeMsg', 'Arbitrary bytes message to deliver alongside the OFT', undefined, types.string)
    .addOptionalParam(
        'oftAddress',
        'Override the source local deployment OFT address (20-byte hex for EVM, base58 OFT store PDA for Solana)',
        undefined,
        types.string
    )
    .addOptionalParam('oftProgramId', 'Solana only: override the OFT program ID (base58)', undefined, types.string)
    .addOptionalParam('tokenProgram', 'Solana only: override the token program (base58)', undefined, types.string)
    .addOptionalParam('computeUnitPriceScaleFactor', 'Solana only: compute unit price scale factor', 4, types.float)
    .addOptionalParam(
        'addressLookupTables',
        'Solana only: comma-separated base58 address lookup tables',
        undefined,
        devtoolsTypes.csv
    )
    .setAction(async (args: MasterArgs, hre: HardhatRuntimeEnvironment) => {
        const chainType = endpointIdToChainType(args.srcEid)
        let result: SendResult

        if (args.oftAddress || args.oftProgramId) {
            DebugLogger.printWarning(
                KnownWarnings.USING_OVERRIDE_OFT,
                `For network: ${endpointIdToNetwork(args.srcEid)}, OFT: ${args.oftAddress + (args.oftProgramId ? `, OFT program: ${args.oftProgramId}` : '')}`
            )
        }

        const extraOptions = buildExtraOptions(args)

        // route to the correct function based on the chain type
        if (chainType === ChainType.EVM) {
            result = await sendEvm({ ...args, extraOptions }, hre)
        } else if (chainType === ChainType.SOLANA) {
            result = await sendSolana({ ...args, extraOptions })
        } else {
            throw new Error(`The chain type ${chainType} is not supported. Only EVM and Solana are supported.`)
        }

        DebugLogger.printLayerZeroOutput(
            KnownOutputs.SENT_VIA_OFT,
            `Successfully sent ${args.amount} tokens from ${endpointIdToNetwork(args.srcEid)} to ${endpointIdToNetwork(args.dstEid)}`
        )
        // print the explorer link for the srcEid from metadata
        const explorerLink = await getBlockExplorerLink(args.srcEid, result.txHash)
        // if explorer link is available, print the tx hash link
        if (explorerLink) {
            DebugLogger.printLayerZeroOutput(
                KnownOutputs.TX_HASH,
                `Explorer link for source chain ${endpointIdToNetwork(args.srcEid)}: ${explorerLink}`
            )
        }
        // print the LayerZero Scan link from metadata
        DebugLogger.printLayerZeroOutput(
            KnownOutputs.EXPLORER_LINK,
            `LayerZero Scan link for tracking all cross-chain transaction details: ${result.scanLink}`
        )
    })
