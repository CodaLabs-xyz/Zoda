"use client"

import { useEffect, useState } from "react"
import { sdk } from "@farcaster/frame-sdk"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

interface FrameComponentProps {
  username: string
  sign: string
  fortune: string
}

export function FrameComponent({ username, sign, fortune }: FrameComponentProps) {
  const [isFarcaster, setIsFarcaster] = useState(false)

  useEffect(() => {
    // Check if we're in a Farcaster frame context
    const checkFarcasterContext = async () => {
      try {
        await sdk.actions.ready()
        setIsFarcaster(true)
      } catch (error) {
        console.error('Not in Farcaster context:', error)
        setIsFarcaster(false)
      }
    }

    checkFarcasterContext()
  }, [])

  if (!isFarcaster) {
    return null
  }

  return (
    <div className="mt-4">
      <Button 
        className="w-full bg-violet-600 hover:bg-violet-700"
        onClick={async () => {
          try {
            // Use the Frame SDK to open the frame URL
            await sdk.actions.openUrl(
              `${window.location.origin}/api/frame?username=${encodeURIComponent(username)}&sign=${encodeURIComponent(sign)}&fortune=${encodeURIComponent(fortune)}`
            )
          } catch (error) {
            console.error('Failed to open URL:', error)
          }
        }}
      >
        <Sparkles className="mr-2 h-4 w-4" />
        Continue in Frame
      </Button>
    </div>
  )
}

