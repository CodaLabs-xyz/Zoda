import { zodaNftAbi } from './abis'
import { Address, parseUnits } from 'viem'

// Get contract address from environment variable
export const ZODA_NFT_ADDRESS = process.env.NEXT_PUBLIC_ZODA_PROXY_CONTRACT_ADDRESS as Address
if (!ZODA_NFT_ADDRESS) {
  throw new Error('NEXT_PUBLIC_ZODA_PROXY_CONTRACT_ADDRESS not set')
}

// Chain configuration
export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "84532")
export const NETWORK_NAME = CHAIN_ID === 8453 ? "Base" : "Base Sepolia"
