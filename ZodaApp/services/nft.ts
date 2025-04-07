import { Address, parseEther, type Hash } from 'viem'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { ZODA_NFT_ADDRESS } from '@/lib/contracts'
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

  // Contract write hook for NFT minting
  const {
    writeContract: mintNft,
    data: mintHash,
    isPending: isMinting,
    isSuccess: isMinted,
    error: mintError
  } = useWriteContract()

  // Wait for mint transaction
  const { isLoading: isWaitingMint } = useWaitForTransactionReceipt({
    hash: mintHash,
  })

  const handleMint = async (metadata: NFTMetadata) => {
    try {
      if (!address) throw new Error('Wallet not connected')
      if (!publicClient) throw new Error('Public client not initialized')

      // Upload metadata to IPFS
      const metadataResponse = await fetch('/api/upload-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      })

      if (!metadataResponse.ok) {
        throw new Error('Failed to upload metadata')
      }

      const { metadataUrl } = await metadataResponse.json()

      // Mint NFT with metadata URL and 0.001 ETH value
      const mintHash = await mintNft({
        address: ZODA_NFT_ADDRESS,
        abi: zodaNftAbi,
        functionName: 'mint',
        args: [address as Address, metadataUrl],
        value: parseEther('0.001'), // 0.001 ETH
      })

      // Wait for mint to be mined
      if (typeof mintHash === 'string') {
        await publicClient.waitForTransactionReceipt({ 
          hash: mintHash as Hash
        })
      }

      return true
    } catch (error) {
      console.error('Minting error:', error)
      throw error
    }
  }

  return {
    handleMint,
    isMinting: isMinting || isWaitingMint,
    isSuccess: isMinted,
    error: mintError,
  }
} 