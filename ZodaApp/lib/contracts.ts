import { zodaNftAbi } from './abis'
import { Address, parseUnits } from 'viem'

export const ZODA_NFT_ADDRESS = process.env.NEXT_PUBLIC_ZODA_NFT_ADDRESS as Address
export const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as Address
export const MINT_PRICE_USDC = parseUnits('0.5', 6) // 0.5 USDC with 6 decimals

if (!ZODA_NFT_ADDRESS) throw new Error('NEXT_PUBLIC_ZODA_NFT_ADDRESS is not defined')
if (!USDC_ADDRESS) throw new Error('NEXT_PUBLIC_USDC_ADDRESS is not defined') 