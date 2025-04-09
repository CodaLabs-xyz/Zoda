"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { zodiac } from "@/lib/zodiac"
import { fortunes } from "@/lib/fortunes"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MintButton } from "@/components/mint-button"
import { ShareButton } from "@/components/share-button"
import { ArrowLeft, Loader2, Download, RefreshCw, Sparkles } from "lucide-react"

interface ZodiacSign {
  name: string
  years: number[]
  emoji: string
  element: string
  traits: string[]
}

interface ShareButtonProps {
  username: string
  sign?: string
  fortune: string
  imageUrl: string
  className?: string
}

export default function FortunePage() {
  const searchParams = useSearchParams()
  const username = searchParams.get("username") || ""
  const birthYear = searchParams.get("birthYear") || ""
  const signName = searchParams.get("sign") || ""

  // Add a ref to track the generation process
  const generationInProgress = useRef<{
    fortune?: string
    imageUrl?: string
    ipfsHash?: string
  } | null>(null)

  // State machine status
  type GenerationStatus = 'idle' | 'generating_fortune' | 'generating_image' | 'uploading_ipfs' | 'completed' | 'error'
  const [status, setStatus] = useState<GenerationStatus>('idle')
  
  const [fortune, setFortune] = useState("")
  const [sign, setSign] = useState<ZodiacSign | null>(null)
  const [error, setError] = useState("")
  const [imageUrl, setImageUrl] = useState<string>("")
  const [ipfsUrl, setIpfsUrl] = useState<string>("")
  const [ipfsHash, setIpfsHash] = useState<string>("")
  const [ipfsError, setIpfsError] = useState("")

  useEffect(() => {
    // Skip if we're not in idle state or missing required params
    if (status !== 'idle' || !birthYear || !username || !signName) {
      return
    }

    async function generateAll() {
      // If we already have a generation in progress, use its values
      if (generationInProgress.current) {
        if (generationInProgress.current.fortune) {
          setFortune(generationInProgress.current.fortune)
        }
        if (generationInProgress.current.imageUrl) {
          setImageUrl(generationInProgress.current.imageUrl)
        }
        if (generationInProgress.current.ipfsHash) {
          setIpfsHash(generationInProgress.current.ipfsHash)
        }
        setStatus('completed')
        return
      }

      try {
        // Initialize generation tracking
        generationInProgress.current = {}

        // Step 1: Generate Fortune
        setStatus('generating_fortune')
        console.log('Starting fortune generation for:', { username, sign: signName, birthYear })
        
        const year = Number.parseInt(birthYear)
        const zodiacSign = zodiac.getSign(year)
        
        const normalizedSign: ZodiacSign = {
          ...zodiacSign,
          years: Array.isArray(zodiacSign.years) 
            ? zodiacSign.years 
            : Array.from(zodiacSign.years || []).map(Number)
        }
        setSign(normalizedSign)

        // Generate fortune
        let generatedFortune = ""
        try {
          const response = await fetch("/api/generate-fortune", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, sign: signName, birthYear }),
          })

          const data = await response.json()

          if (response.ok && data.fortune) {
            console.log('Fortune generated successfully:', data.fortune.substring(0, 50) + '...')
            generatedFortune = data.fortune
          } else {
            console.error("Fortune API error:", data)
            const signFortunes = fortunes[zodiacSign.name] || fortunes.default
            generatedFortune = signFortunes[Math.floor(Math.random() * signFortunes.length)]
            console.log('Using fallback fortune:', generatedFortune.substring(0, 50) + '...')
          }
        } catch (apiError) {
          console.error("API error:", apiError)
          const signFortunes = fortunes[zodiacSign.name] || fortunes.default
          generatedFortune = signFortunes[Math.floor(Math.random() * signFortunes.length)]
          console.log('Using fallback fortune after error:', generatedFortune.substring(0, 50) + '...')
        }

        setFortune(generatedFortune)
        generationInProgress.current.fortune = generatedFortune

        // Step 2: Generate Image
        setStatus('generating_image')
        console.log('Starting character image generation for sign:', signName)

        //const prompt = `Create a mystical character portrait representing the Chinese zodiac sign ${signName}. The character should be ethereal and magical, with elements that symbolize crypto and blockchain technology. Style: digital art, cosmic, detailed, professional quality.`

        const prompt = `This digital artwork blends anime and cosmic art to depict a mystical character embodying the ${signName} from the Chinese zodiac, intertwined with cryptocurrency themes. The character boasts flowing blue and turquoise hair, large ${signName} caracteristics adorned with starry constellations, and a glowing blockchain symbol floating beside the character, while the character holds a radiant crypto symbol that illuminates the character's robe, all set against an enchanting starry backdrop.`
 
        console.log('Using image generation prompt:', prompt)

        const imageResponse = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        })

        if (!imageResponse.ok) {
          throw new Error('Failed to generate image')
        }

        const imageData = await imageResponse.json()
        console.log('Image generated successfully:', imageData)

        if (!imageData.imageUrl) {
          throw new Error('No image URL returned')
        }

        console.log('Setting image URL:', imageData.imageUrl.substring(0, 50) + '...')
        setImageUrl(imageData.imageUrl)
        generationInProgress.current.imageUrl = imageData.imageUrl

        // console.log('Image URL:', imageData.imageUrl)

        // we need to resize the ipfsimage from 1024x1024 to 512x512

        // Step 3: Upload to IPFS
        setStatus('uploading_ipfs')
        console.log('Starting IPFS upload for image:', imageData.imageUrl.substring(0, 50) + '...')
        
        const ipfsResult = await uploadToIpfs(imageData.imageUrl)
        console.log('Setting IPFS data:', ipfsResult)
        setIpfsUrl(ipfsResult.url)
        setIpfsHash(ipfsResult.ipfsHash)
        generationInProgress.current.ipfsHash = ipfsResult.ipfsHash



        // Complete
        setStatus('completed')
        console.log('Generation process completed')
      } catch (err) {
        console.error("Generation error:", err)
        setError(err instanceof Error ? err.message : "An error occurred during generation")
        setStatus('error')
        generationInProgress.current = null
      }
    }

    generateAll()
  }, [birthYear, username, signName, status])

  // Function to upload image to IPFS
  const uploadToIpfs = async (imageUrl: string) => {
    const response = await fetch("/api/upload-to-ipfs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('IPFS upload failed:', error)
      throw new Error(error.error || 'Failed to upload to IPFS')
    }

    const result = await response.json()
    console.log('IPFS upload completed:', result)
    return result
  }

  const handleRetry = () => {
    generationInProgress.current = null
    setStatus('idle')
    setError("")
    setImageUrl("")
    setIpfsUrl("")
    setIpfsHash("")
    setIpfsError("")
  }

  // Loading states
  const isLoading = status === 'generating_fortune' || status === 'generating_image' || status === 'uploading_ipfs'
  const isImageLoading = status === 'generating_image'
  const isUploadingToIpfs = status === 'uploading_ipfs'

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center p-4 bg-gradient-to-b from-violet-900 to-indigo-950">
        <Header />
        <div className="flex flex-col items-center justify-center h-64 w-full max-w-md">
          <Loader2 className="h-12 w-12 text-violet-400 animate-spin mb-4" />
          <p className="text-violet-200 text-lg">Consulting the stars...</p>
        </div>
      </main>
    )
  }

  if ((!fortune && !sign) || error) {
    return (
      <main className="flex min-h-screen flex-col items-center p-4 bg-gradient-to-b from-violet-900 to-indigo-950">
        <Header />
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-violet-300/20 mt-4">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <p className="text-red-300 mb-4">{error || "Something went wrong. Please try again."}</p>
            <Link href="/">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-gradient-to-b from-violet-900 to-indigo-950">
      <Header />

      <div className="w-full max-w-md space-y-4">
        {/* Fortune Card */}
        <Card className="w-full bg-white/10 backdrop-blur-md border-violet-300/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">
              <span className="text-violet-300">{username}</span>'s Fortune
            </CardTitle>
            {sign && (
              <CardDescription className="text-violet-200">
                {sign.emoji} {sign.name} ({sign.years.join(", ")})
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="text-center">
            {/* Character Image with download button */}
            <div className="relative mb-6">
              {isImageLoading || isUploadingToIpfs ? (
                <div className="w-full aspect-square flex flex-col items-center justify-center bg-violet-900/30 rounded-lg">
                  <Loader2 className="h-12 w-12 text-violet-400 animate-spin mb-4" />
                  <p className="text-violet-200">
                    {isImageLoading ? "Creating your character..." : "Uploading to IPFS..."}
                  </p>
                </div>
              ) : imageUrl ? (
                <>
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                    <Image
                      src={ipfsUrl || imageUrl}
                      alt={`${sign?.name} Character`}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        console.error("Image failed to load:", imageUrl)
                        setIpfsError("Failed to load the generated image")
                      }}
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      {ipfsUrl && (
                        <Button
                          onClick={() => window.open(ipfsUrl, '_blank')}
                          size="icon"
                          variant="ghost"
                          className="w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full"
                          title="View on IPFS"
                        >
                          <Sparkles className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {(ipfsError) && (
                    <div className="mt-2 p-2 rounded bg-red-500/10 border border-red-500/20">
                      <p className="text-red-400 text-sm">{ipfsError}</p>
                      <Button
                        onClick={handleRetry}
                        size="sm"
                        variant="ghost"
                        className="mt-2 text-violet-300 hover:text-violet-200"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                      </Button>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Fortune Text */}
            <div className="mb-6 p-4 rounded-lg bg-white/5 border border-violet-300/20">
              <p className="text-white text-lg italic">{fortune}</p>
            </div>
            <p className="text-violet-200 text-sm">Generated on {new Date().toLocaleDateString()}</p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <div className="flex flex-col sm:flex-row gap-4 w-full items-center justify-center">
              {/* <ShareButton
                username={username}
                sign={signName}
                fortune={fortune}
                ipfsUrl={ipfsUrl}
                className="mt-4"
              /> */}
              <MintButton
                username={username}
                year={birthYear}
                sign={signName}
                fortune={fortune}
                imageUrl={imageUrl}
                ipfsUrl={ipfsUrl}
                ipfsHash={ipfsHash}
                className="mt-4"
              />
            </div>
            <Link href="/" className="w-full">
              <Button variant="ghost" className="w-full text-violet-200 hover:bg-violet-800/30">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Try Another
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}

