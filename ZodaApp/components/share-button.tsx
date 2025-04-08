"use client"

import { Button } from "@/components/ui/button"
import { Share2 } from "lucide-react"

interface ShareButtonProps {
  username: string
  sign: string
  fortune: string
  ipfsUrl?: string
  className?: string
}

export function ShareButton({ username, sign, fortune, ipfsUrl, className }: ShareButtonProps) {
  const handleShare = () => {

    console.log("ipfsUrl", ipfsUrl);

    let text = `🔮 My crypto fortune from Zoda: As a ${sign}, ${fortune}`

    // Add image if available
    if (ipfsUrl) {
      text += ` Check out my ${sign} character!`
    }

    text += ` Get yours at zoda.codalabs.xyz`

    // Create the Warpcast URL
    let url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`
    
    // If there's an image, add it as an embedded image
    if (ipfsUrl) {
      url += `&embeds[]=${encodeURIComponent(ipfsUrl)}`
    }

    window.open(url, "_blank")
  }

  return (
    <Button
      onClick={handleShare}
      variant="outline"
      className={`border-violet-300/30 text-violet-200 hover:bg-violet-800/30 ${className}`}
    >
      <Share2 className="mr-2 h-4 w-4" />
      Share on Warpcast
    </Button>
  )
}

