"use client"

import { useState, useEffect } from "react"
import { useAccount, useConnect } from 'wagmi'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Sparkles, Wallet } from "lucide-react"
import Image from "next/image"
import { sdk } from "@farcaster/frame-sdk"
import { useNFTMint, createNFTMetadata } from "@/services/nft"

interface MintButtonProps {
  username: string
  year: string
  sign: string
  fortune: string
  imageUrl?: string
  className?: string
}

export function MintButton({ username, year, sign, fortune, imageUrl, className }: MintButtonProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const [isFarcasterReady, setIsFarcasterReady] = useState(false)
  const [mounted, setMounted] = useState(false)

  const { isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { handleMint, isMinting, isSuccess, error: mintError } = useNFTMint()

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

  const onMint = async () => {
    try {
      setError("")

      if (!isConnected) return
      if (!isFarcasterReady) {
        setError("Please open this app in Farcaster to mint")
        return
      }
      if (!imageUrl) {
        setError("Image not ready yet")
        return
      }

      const metadata = createNFTMetadata({
        username,
        sign,
        year,
        fortune,
        imageUrl,
      })

      await handleMint(metadata)
    } catch (err) {
      console.error(err)
      setError("Something went wrong. Please try again.")
    }
  }

  // Don't render anything until we've checked Farcaster status
  if (!mounted) return null

  return (
    <>
      <Button 
        onClick={() => setOpen(true)} 
        className={`bg-violet-600 hover:bg-violet-700 ${className}`}
        disabled={!isFarcasterReady}
      >
        <Sparkles className="mr-2 h-4 w-4" />
        {isFarcasterReady ? "Mint as NFT" : "Open in Farcaster"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-violet-950 border-violet-300/20 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader className="z-10 bg-violet-950 pb-4">
            <DialogTitle>Mint Your Fortune as NFT</DialogTitle>
            <DialogDescription className="text-violet-200">
              Mint this unique fortune as an NFT on Base for just 0.001 ETH
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Image Preview */}
            {imageUrl && (
              <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                <Image
                  src={imageUrl}
                  alt={`${sign} Character`}
                  fill
                  className="object-cover"
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
                disabled={isMinting} 
                className="w-full bg-violet-600 hover:bg-violet-700"
              >
                {isMinting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Minting...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Mint NFT (0.001 ETH)
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

