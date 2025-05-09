"use client"

import { useState, useEffect } from "react"
import { useAccount, useConnect, useChainId, useSwitchChain, usePublicClient } from 'wagmi'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Sparkles, Wallet, Share2 } from "lucide-react"
import Image from "next/image"
import { sdk } from "@farcaster/frame-sdk"
import { useNFTMint, createNFTMetadata } from "@/services/nft"
import { decodeEventLog } from "viem"
import { zodaNftAbi } from "@/lib/abis"
import type { Log } from "viem"

// Get chain configuration from environment variables
const TARGET_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "84532")
const NETWORK_NAME = TARGET_CHAIN_ID === 8453 ? "Base" : "Base Sepolia"

// Get contract address from environment variable
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ZODA_PROXY_CONTRACT_ADDRESS as `0x${string}`
if (!CONTRACT_ADDRESS) {
  throw new Error('NEXT_PUBLIC_ZODA_PROXY_CONTRACT_ADDRESS not set')
}

interface MintButtonProps {
  username: string
  year: string
  sign: string
  fortune: string
  imageUrl?: string
  ipfsUrl?: string
  ipfsHash?: string
  className?: string
}

export function MintButton({ username, year, sign, fortune, imageUrl, ipfsUrl,ipfsHash, className }: MintButtonProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const [isFarcasterReady, setIsFarcasterReady] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [mintedTokenId, setMintedTokenId] = useState<string>()

  const { isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const publicClient = usePublicClient()
  const { handleMint, isMinting, isSuccess, error: mintError, mintPrice, mintHash } = useNFTMint()

  useEffect(() => {
    setMounted(true)
    // Initialize Farcaster SDK and hide splash screen when ready
    const initFarcaster = async () => {
      try {
        await sdk.actions.ready()
        setIsFarcasterReady(true)
      } catch (error) {
        console.error('Not in Farcaster context:', error)
        setIsFarcasterReady(false)
      }
    }

    initFarcaster()
  }, [])

  // Function to format IPFS URL for display and metadata
  const formatDisplayUrl = (hash: string) => {
    // Remove any protocol prefixes
    const cleanHash = hash.replace('ipfs://', '').replace('https://ipfs.io/ipfs/', '')
    return `https://ipfs.io/ipfs/${cleanHash}`
  }

  // Close dialog when minting is successful
  useEffect(() => {
    if (isSuccess) {
      setOpen(false)
    }
  }, [isSuccess])

  // Add event listener for NFTMinted event
  useEffect(() => {
    if (isSuccess && publicClient && mintHash) {
      const getTokenId = async () => {
        try {
          // Get the latest transaction receipt
          const receipt = await publicClient.getTransactionReceipt({ hash: mintHash })
          const mintEvent = receipt.logs.find((log: Log) => {
            try {
              const event = decodeEventLog({
                abi: zodaNftAbi,
                data: log.data,
                topics: log.topics,
              })
              return event.eventName === 'NFTMinted'
            } catch {
              return false
            }
          })

          if (mintEvent) {
            const { tokenId } = decodeEventLog({
              abi: zodaNftAbi,
              data: mintEvent.data,
              topics: mintEvent.topics,
            }).args
            setMintedTokenId(tokenId.toString())
          }
        } catch (error) {
          console.error('Error getting minted token ID:', error)
        }
      }
      getTokenId()
    }
  }, [isSuccess, publicClient, mintHash])

  const onMint = async () => {
    try {
      setError("")
      console.log('Starting mint process with parameters:', {
        username,
        sign,
        year,
        fortune: fortune.substring(0, 100) + '...',
        ipfsHash,
        imageUrl
      })

      if (!isConnected) {
        console.log('Wallet not connected, aborting mint')
        return
      }

      if (!isFarcasterReady) {
        console.log('Farcaster not ready, aborting mint')
        setError("Please open this app in Farcaster to mint")
        return
      }
      
      if (!ipfsHash) {
        console.log('IPFS hash not available, aborting mint')
        setError("Image not ready yet")
        return
      }

      // Check if on correct network
      if (chainId !== TARGET_CHAIN_ID) {
        console.log('Network mismatch:', {
          current: chainId,
          required: TARGET_CHAIN_ID,
          networkName: NETWORK_NAME
        })
        if (switchChain) {
          console.log('Attempting to switch network...')
          await switchChain({ chainId: TARGET_CHAIN_ID })
          console.log('Network switch successful')
        } else {
          console.log('Network switch not available')
          setError(`Please switch to ${NETWORK_NAME} network`)
          return
        }
      }

      const formattedImageUrl = formatDisplayUrl(ipfsHash)
      console.log('Formatted IPFS URL for metadata:', formattedImageUrl)

      const metadata = createNFTMetadata({
        username,
        sign,
        year,
        fortune,
        imageUrl: formattedImageUrl,
      })

      console.log('Created NFT metadata:', {
        name: metadata.name,
        description: metadata.description.substring(0, 100) + '...',
        image: metadata.image,
        attributes: metadata.attributes
      })

      console.log('Initiating mint transaction...')
      await handleMint(metadata)
      console.log('Mint transaction completed successfully!')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong. Please try again."
      console.error('Mint process failed:', {
        error: errorMessage,
        fullError: err
      })
      setError(errorMessage)
    }
  }

  // Add handleShareNFT function
  const handleShareNFT = () => {
    if (!mintedTokenId) return

    const baseUrl = TARGET_CHAIN_ID === 8453 ? 'basescan.org' : 'base-sepolia.blockscout.com'
    //const text = `🎉 Just minted my Zoda Fortune NFT #${mintedTokenId}! As a ${sign}, "${fortune}" Check it out on https://${baseUrl}/token/${CONTRACT_ADDRESS}/instance/${mintedTokenId}`
    const text = `🎉 Just minted my Zoda Fortune NFT #${mintedTokenId}! As a ${sign}, "${fortune}".`
    let url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`

    // Assuming you have access to ipfsUrl
    if (ipfsUrl) {
      //const gatewayUrl = `https://ipfs.io/ipfs/${ipfsUrl.replace('ipfs://', '')}`
      url += `&embeds[]=${encodeURIComponent(ipfsUrl)}`
    }    
    window.open(url, '_blank')
  }

  // Don't render anything until we've checked Farcaster status
  if (!mounted) return null

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button 
          onClick={() => setOpen(true)} 
          className={`bg-violet-600 hover:bg-violet-700 ${className}`}
          disabled={!isFarcasterReady || isSuccess}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {isSuccess ? "NFT Minted!" : isFarcasterReady ? "Mint as NFT" : "Open in Farcaster"}
        </Button>

        {isSuccess && mintedTokenId && (
          <Button 
            onClick={handleShareNFT} 
            className="bg-violet-600 hover:bg-violet-700 mt-4"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share on Warpcast
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-violet-950 border-violet-300/20 text-white max-h-[90vh] overflow-y-auto" title="Mint Your Fortune as NFT">
          <DialogHeader className="z-10 bg-violet-950 pb-4">
            <DialogTitle>Mint Your Fortune as NFT</DialogTitle>
            <DialogDescription className="text-violet-200">
              Mint this unique fortune as an NFT on {NETWORK_NAME} for {mintPrice} ETH
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Image Preview */}
            {ipfsHash && (
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-violet-900/50">
                <Image
                  src={formatDisplayUrl(ipfsHash)}
                  alt={`${sign} Character`}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    console.error('Failed to load image:', formatDisplayUrl(ipfsHash))
                    e.currentTarget.src = imageUrl || '' // Fallback to original URL if IPFS fails
                  }}
                />
              </div>
            )}

            <div className="p-4 rounded-lg bg-white/5 border border-violet-300/20">
              <p className="text-white text-sm mb-2">
                <span className="font-bold">Username:</span> {username}
              </p>
              <p className="text-white text-sm mb-2">
                <span className="font-bold">Sign:</span> {sign} ({year})
              </p>
              <p className="text-white text-sm italic">"{fortune}"</p>
            </div>

            {(error || mintError) && (
              <p className="text-red-300 text-sm">{error || mintError?.message}</p>
            )}
          </div>

          <DialogFooter className="sticky bottom-0 z-10 bg-violet-950 pt-4">
            {!isFarcasterReady ? (
              <div className="flex flex-col space-y-2 w-full">
                <Button 
                  className="w-full bg-violet-600 hover:bg-violet-700"
                  disabled
                >
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please open in Farcaster
                </Button>
              </div>
            ) : !isConnected ? (
              <div className="flex flex-col space-y-2 w-full">
                <Button 
                  onClick={() => connect({ connector: connectors[0] })} 
                  className="w-full bg-violet-600 hover:bg-violet-700"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </Button>
              </div>
            ) : (
              <Button 
                onClick={onMint} 
                disabled={isMinting || isSuccess} 
                className="w-full bg-violet-600 hover:bg-violet-700"
              >
                {isMinting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Minting...
                  </>
                ) : isSuccess ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    NFT Minted!
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Mint NFT ({mintPrice} ETH)
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

