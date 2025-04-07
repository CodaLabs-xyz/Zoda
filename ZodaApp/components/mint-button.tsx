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
  const [minting, setMinting] = useState(false)
  const [approved, setApproved] = useState(false)
  const [error, setError] = useState("")
  const [isFarcasterReady, setIsFarcasterReady] = useState(false)
  const [mounted, setMounted] = useState(false)

  const { isConnected } = useAccount()
  const { connect, connectors } = useConnect()

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

  const handleMint = async () => {
    setError("")
    setMinting(true)

    try {
      if (!isConnected) {
        return
      }

      if (!isFarcasterReady) {
        setError("Please open this app in Farcaster to mint")
        setMinting(false)
        return
      }

      // Simulate approval process
      setTimeout(() => {
        setApproved(true)

        // Simulate minting after approval
        setTimeout(() => {
          setMinting(false)
          setOpen(false)
          alert("Fortune minted successfully! (Demo mode)")
        }, 2000)
      }, 2000)
    } catch (err) {
      console.error(err)
      setError("Something went wrong. Please try again.")
      setMinting(false)
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
              Mint this unique fortune as an NFT on Base for just $0.5 USDC
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

            {error && <p className="text-red-300 text-sm">{error}</p>}
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
              <Button onClick={handleMint} disabled={minting} className="w-full bg-violet-600 hover:bg-violet-700">
                {minting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {!approved ? "Approving USDC..." : "Minting..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {approved ? "Mint NFT" : "Approve USDC"}
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

