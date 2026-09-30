import { createLogger } from '@layerzerolabs/io-devtools'
import { Options } from '@layerzerolabs/lz-v2-utilities'

const logger = createLogger()

export interface ExtraOptionsArgs {
    /** Flattened "gas,value" pairs */
    extraLzReceiveOptions?: string[]
    /** Flattened "index,gas,value" triplets */
    extraLzComposeOptions?: string[]
    /** Flattened "amount,recipient" pairs */
    extraNativeDropOptions?: string[]
}

/**
 * Builds type 3 executor options from the CLI option flags.
 * Returns undefined when no options were given, so callers can fall back to enforced options.
 */
export function buildExtraOptions({
    extraLzReceiveOptions,
    extraLzComposeOptions,
    extraNativeDropOptions,
}: ExtraOptionsArgs): string | undefined {
    if (!extraLzReceiveOptions?.length && !extraLzComposeOptions?.length && !extraNativeDropOptions?.length) {
        return undefined
    }

    let options = Options.newOptions()

    // Add lzReceive options
    if (extraLzReceiveOptions && extraLzReceiveOptions.length > 0) {
        // Handle case where Hardhat's CSV parsing splits "gas,value" into separate elements
        if (extraLzReceiveOptions.length % 2 !== 0) {
            throw new Error(
                `Invalid lzReceive options: received ${extraLzReceiveOptions.length} values, but expected pairs of gas,value`
            )
        }

        for (let i = 0; i < extraLzReceiveOptions.length; i += 2) {
            const gas = Number(extraLzReceiveOptions[i])
            const value = Number(extraLzReceiveOptions[i + 1]) || 0
            options = options.addExecutorLzReceiveOption(gas, value)
            logger.info(`Added lzReceive option: ${gas} gas, ${value} value`)
        }
    }

    // Add lzCompose options
    if (extraLzComposeOptions && extraLzComposeOptions.length > 0) {
        // Handle case where Hardhat's CSV parsing splits "index,gas,value" into separate elements
        if (extraLzComposeOptions.length % 3 !== 0) {
            throw new Error(
                `Invalid lzCompose options: received ${extraLzComposeOptions.length} values, but expected triplets of index,gas,value`
            )
        }

        for (let i = 0; i < extraLzComposeOptions.length; i += 3) {
            const index = Number(extraLzComposeOptions[i])
            const gas = Number(extraLzComposeOptions[i + 1])
            const value = Number(extraLzComposeOptions[i + 2]) || 0
            options = options.addExecutorComposeOption(index, gas, value)
            logger.info(`Added lzCompose option: index ${index}, ${gas} gas, ${value} value`)
        }
    }

    // Add native drop options
    if (extraNativeDropOptions && extraNativeDropOptions.length > 0) {
        // Handle case where Hardhat's CSV parsing splits "amount,recipient" into separate elements
        if (extraNativeDropOptions.length % 2 !== 0) {
            throw new Error(
                `Invalid native drop options: received ${extraNativeDropOptions.length} values, but expected pairs of amount,recipient`
            )
        }

        for (let i = 0; i < extraNativeDropOptions.length; i += 2) {
            const amountStr = extraNativeDropOptions[i]
            const recipient = extraNativeDropOptions[i + 1]

            if (!amountStr || !recipient) {
                throw new Error(
                    `Invalid native drop option: Both amount and recipient must be provided. Got amount="${amountStr}", recipient="${recipient}"`
                )
            }

            try {
                options = options.addExecutorNativeDropOption(amountStr.trim(), recipient.trim())
                logger.info(`Added native drop option: ${amountStr.trim()} wei to ${recipient.trim()}`)
            } catch (error) {
                // Provide helpful context if the amount exceeds protocol limits
                const maxUint128 = BigInt('340282366920938463463374607431768211455') // 2^128 - 1
                const maxUint128Ether = Number(maxUint128) / 1e18 // Convert to ETH for readability

                throw new Error(
                    `Failed to add native drop option with amount ${amountStr.trim()} wei. ` +
                        `LayerZero protocol constrains native drop amounts to uint128 maximum ` +
                        `(${maxUint128.toString()} wei ≈ ${maxUint128Ether.toFixed(2)} ETH). ` +
                        `Original error: ${error instanceof Error ? error.message : String(error)}`
                )
            }
        }
    }

    return options.toHex()
}
