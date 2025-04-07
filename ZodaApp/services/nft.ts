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
  return {
    name: `${username}'s ${sign} Fortune`,
    description: fortune,
    image: imageUrl,
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

  const uploadMetadataToIPFS = async (metadata: NFTMetadata): Promise<string> => {
    const response = await fetch('/api/upload-metadata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to upload metadata to IPFS')
    }

    const { metadataUrl } = await response.json()
    if (!metadataUrl || !metadataUrl.startsWith('ipfs://')) {
      throw new Error('Invalid metadata URL returned from IPFS')
    }

    return metadataUrl
  }

  const handleMint = async (metadata: NFTMetadata) => {
    try {
      if (!address) throw new Error('Wallet not connected')
      if (!publicClient) throw new Error('Public client not initialized')
      if (chainId !== TARGET_CHAIN_ID) throw new Error('Wrong network')

      // Ensure image URL is in IPFS format
      if (!metadata.image.startsWith('ipfs://')) {
        throw new Error('Image URL must be in IPFS format')
      }

      console.log('Uploading metadata to IPFS:', metadata)
      const metadataUrl = await uploadMetadataToIPFS(metadata)
      console.log('Metadata uploaded to IPFS:', metadataUrl)

      // Mint NFT with metadata URL and mint price from env
      console.log('Minting NFT with metadata:', metadataUrl)
      await mintNft({
        address: CONTRACT_ADDRESS,
        abi: zodaNftAbi,
        functionName: 'mint',
        args: [address as Address, metadataUrl],
        value: parseEther(MINT_PRICE),
      })

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