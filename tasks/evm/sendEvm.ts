import path from 'path'

import { BigNumber, ContractTransaction } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { OmniPointHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { createLogger } from '@layerzerolabs/io-devtools'
import { ChainType, endpointIdToChainType, endpointIdToNetwork } from '@layerzerolabs/lz-definitions'
import { Options, addressToBytes32 } from '@layerzerolabs/lz-v2-utilities'

import { SendResult } from '../common/types'
import { DebugLogger, KnownErrors, getLayerZeroScanLink } from '../common/utils'

const logger = createLogger()

export interface EvmArgs {
    srcEid: number
    dstEid: number
    amount: string
    to: string
    oappConfig: string
    minAmount?: string
    /** Hex-encoded type 3 options; when omitted, empty options are sent and enforced options apply */
    extraOptions?: string
    composeMsg?: string
    oftAddress?: string
}

export async function sendEvm(
    {
        srcEid,
        dstEid,
        amount,
        to,
        oappConfig,
        minAmount,
        extraOptions,
        composeMsg,
        oftAddress,
    }: EvmArgs,
    hre: HardhatRuntimeEnvironment
): Promise<SendResult> {
    if (endpointIdToChainType(srcEid) !== ChainType.EVM) {
        throw new Error(`non-EVM srcEid (${srcEid}) not supported here`)
    }

    const getHreByEid = createGetHreByEid(hre)
    let srcEidHre: HardhatRuntimeEnvironment
    try {
        srcEidHre = await getHreByEid(srcEid)
    } catch (error) {
        DebugLogger.printErrorAndFixSuggestion(
            KnownErrors.ERROR_GETTING_HRE,
            `For network: ${endpointIdToNetwork(srcEid)}, OFT: ${oftAddress}`
        )
        throw error
    }
    const signer = (await srcEidHre.ethers.getSigners())[0]

    // 1️⃣ resolve the OFT wrapper address
    let wrapperAddress: string
    if (oftAddress) {
        wrapperAddress = oftAddress
    } else {
        const layerZeroConfig = (await import(path.resolve('./', oappConfig))).default
        const { contracts } = typeof layerZeroConfig === 'function' ? await layerZeroConfig() : layerZeroConfig
        const wrapper = contracts.find((c: { contract: OmniPointHardhat }) => c.contract.eid === srcEid)
        if (!wrapper) throw new Error(`No config for EID ${srcEid}`)
        wrapperAddress = wrapper.contract.contractName
            ? (await srcEidHre.deployments.get(wrapper.contract.contractName)).address
            : wrapper.contract.address || ''
    }

    // 2️⃣ load IOFT ABI, extend it with token()
    const ioftArtifact = await srcEidHre.artifacts.readArtifact('IOFT')

    // now attach
    const oft = await srcEidHre.ethers.getContractAt(ioftArtifact.abi, wrapperAddress, signer)

    // 3️⃣ fetch the underlying ERC-20
    const underlying = await oft.token()

    // 4️⃣ fetch decimals from the underlying token
    const erc20 = await srcEidHre.ethers.getContractAt('ERC20', underlying, signer)
    const decimals: number = await erc20.decimals()

    // 5️⃣ normalize the user-supplied amount
    const amountUnits: BigNumber = parseUnits(amount, decimals)

    // 6️⃣ Check if approval is required (for OFT Adapters) and handle approval
    try {
        const approvalRequired = await oft.approvalRequired()
        if (approvalRequired) {
            logger.info('OFT Adapter detected - checking ERC20 allowance...')

            // Check current allowance
            const currentAllowance = await erc20.allowance(signer.address, wrapperAddress)
            logger.info(`Current allowance: ${currentAllowance.toString()}`)
            logger.info(`Required amount: ${amountUnits.toString()}`)

            if (currentAllowance.lt(amountUnits)) {
                logger.info('Insufficient allowance - approving ERC20 tokens...')
                const approveTx = await erc20.approve(wrapperAddress, amountUnits)
                logger.info(`Approval transaction hash: ${approveTx.hash}`)
                await approveTx.wait()
                logger.info('ERC20 approval confirmed')
            } else {
                logger.info('Sufficient allowance already exists')
            }
        }
    } catch (error) {
        // If approvalRequired() doesn't exist or fails, assume it's a regular OFT (not an adapter)
        logger.info('No approval required (regular OFT detected)')
    }

    // 7️⃣ hex string → Uint8Array → zero-pad to 32 bytes
    const toBytes = addressToBytes32(to)

    // 8️⃣ build sendParam and dispatch
    const sendParam = {
        dstEid,
        to: toBytes,
        amountLD: amountUnits.toString(),
        minAmountLD: minAmount ? parseUnits(minAmount, decimals).toString() : amountUnits.toString(),
        extraOptions: extraOptions ?? Options.newOptions().toHex(),
        composeMsg: composeMsg ? composeMsg.toString() : '0x',
        oftCmd: '0x',
    }

    // 9️⃣ Quote (MessagingFee = { nativeFee, lzTokenFee })
    logger.info('Quoting the native gas cost for the send transaction...')
    let msgFee: { nativeFee: BigNumber; lzTokenFee: BigNumber }
    try {
        msgFee = await oft.quoteSend(sendParam, false)
    } catch (error) {
        DebugLogger.printErrorAndFixSuggestion(
            KnownErrors.ERROR_QUOTING_NATIVE_GAS_COST,
            `For network: ${endpointIdToNetwork(srcEid)}, OFT: ${oftAddress}`
        )
        throw error
    }
    logger.info('Sending the transaction...')
    let tx: ContractTransaction
    try {
        tx = await oft.send(sendParam, msgFee, signer.address, {
            value: msgFee.nativeFee,
        })
    } catch (error) {
        DebugLogger.printErrorAndFixSuggestion(
            KnownErrors.ERROR_SENDING_TRANSACTION,
            `For network: ${endpointIdToNetwork(srcEid)}, OFT: ${oftAddress}`
        )
        throw error
    }
    const receipt = await tx.wait()

    const txHash = receipt.transactionHash
    const scanLink = getLayerZeroScanLink(txHash, srcEid >= 40_000 && srcEid < 50_000)

    return { txHash, scanLink }
}
