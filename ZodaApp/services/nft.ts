import { Address, parseEther, type Hash } from 'viem'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useChainId } from 'wagmi'
import { zodaNftAbi } from '@/lib/abis'

interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes: {
    trait_type: string
    value: string
  }[]
}

// Get chain configuration from environment variables
const TARGET_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "84532")

// Get contract address from environment variable
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ZODA_PROXY_CONTRACT_ADDRESS as Address
if (!CONTRACT_ADDRESS) {
  throw new Error('NEXT_PUBLIC_ZODA_PROXY_CONTRACT_ADDRESS not set')
}

// Get mint price from environment variable
const MINT_PRICE = process.env.NEXT_PUBLIC_MINT_PRICE || "0.0005"

export function createNFTMetadata({
  username,
  sign,
  year,
  fortune,
  imageUrl,
}: {
  username: string
  sign: string
  year: string
  fortune: string
  imageUrl: string
}): NFTMetadata {
  // Convert ipfs:// URLs to https gateway URLs for preview
  const formattedImageUrl = imageUrl.startsWith('ipfs://')
    ? `https://ipfs.io/ipfs/${imageUrl.replace('ipfs://', '')}`
    : imageUrl.startsWith('https://ipfs.io/ipfs/')
      ? imageUrl
      : `https://ipfs.io/ipfs/${imageUrl}`

  const metadata = {
    name: `${username}'s ${sign} Fortune`,
    description: fortune,
    image: imageUrl, // Keep original ipfs:// URL for metadata
    attributes: [
      {
        trait_type: 'Zodiac Sign',
        value: sign,
      },
      {
        trait_type: 'Year',
        value: year,
      },
      {
        trait_type: 'Username',
        value: username,
      },
    ],
  }
  console.log('Creating NFT metadata with full details:', {
    name: metadata.name,
    description: metadata.description.substring(0, 100) + '...',
    image: metadata.image,
    imageUrl,
    formattedImageUrl,
    attributes: metadata.attributes
  })
  return metadata
}

export function useNFTMint() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const chainId = useChainId()

  // Contract write hook for NFT minting
  const {
    writeContract: mintNft,
    data: mintHash,
    isPending: isMinting,
    isSuccess: isMinted,
    error: mintError
  } = useWriteContract()

  // Wait for mint transaction
  const { 
    isLoading: isWaitingMint,
    isSuccess: isTransactionConfirmed,
  } = useWaitForTransactionReceipt({
    hash: mintHash,
  })

  const handleMint = async (metadata: NFTMetadata) => {
    try {
      if (!address) throw new Error('Wallet not connected')
      if (!publicClient) throw new Error('Public client not initialized')
      if (chainId !== TARGET_CHAIN_ID) throw new Error('Wrong network')

      console.log('Starting NFT mint process with metadata:', {
        name: metadata.name,
        description: metadata.description.substring(0, 100) + '...',
        image: metadata.image,
        attributes: metadata.attributes
      })

      // Mint NFT with just the address and mint price
      console.log('Minting NFT with params:', {
        contract: CONTRACT_ADDRESS,
        to: address,
        value: MINT_PRICE
      })

      await mintNft({
        address: CONTRACT_ADDRESS,
        abi: zodaNftAbi,
        functionName: 'mint',
        args: [address as Address],
        value: parseEther(MINT_PRICE),
      })

      console.log('Mint transaction submitted successfully')
      return true
    } catch (error) {
      console.error('Minting error:', error)
      throw error
    }
  }

  return {
    handleMint,
    isMinting: isMinting || isWaitingMint,
    isSuccess: isMinted && isTransactionConfirmed,
    error: mintError,
    mintPrice: MINT_PRICE,
  }
} 