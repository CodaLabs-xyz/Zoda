"use client"

import { useEffect, useState } from "react"
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

export default function FortunePage() {
  const searchParams = useSearchParams()
  const username = searchParams.get("username") || ""
  const birthYear = searchParams.get("birthYear") || ""
  const signName = searchParams.get("sign") || ""

  const [fortune, setFortune] = useState("")
  const [sign, setSign] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [isImageLoading, setIsImageLoading] = useState(false)
  const [imageError, setImageError] = useState("")
  const [ipfsUrl, setIpfsUrl] = useState("")
  const [isUploadingToIpfs, setIsUploadingToIpfs] = useState(false)
  const [ipfsError, setIpfsError] = useState("")

  // Function to upload image to IPFS
  const uploadToIpfs = async (imageUrl: string) => {
    const response = await fetch("/api/upload-to-ipfs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageUrl }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to upload to IPFS')
    }

    return response.json()
  }

  // Function to generate the character image
  const generateCharacterImage = async () => {
    if (!signName) return

    try {
      setIsImageLoading(true)
      setImageError("")
      setIpfsError("")

      // Construct a detailed prompt for the character image
      const prompt = `Create a mystical character portrait representing the Chinese zodiac sign ${signName}. The character should be ethereal and magical, with elements that symbolize crypto and blockchain technology. Style: digital art, cosmic, detailed, professional quality.`

      const imageResponse = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
        }),
      })

      // Handle non-OK responses
      if (!imageResponse.ok) {
        const errorData = await imageResponse.json().catch(() => ({}))
        console.error("Image API error response:", errorData)
        setImageError(errorData.error || `Failed to generate image`)
        return
      }

      // Try to parse the JSON response
      let imageData
      try {
        imageData = await imageResponse.json()
      } catch (parseError) {
        console.error("Error parsing image response:", parseError)
        setImageError("Failed to parse image response")
        return
      }

      if (imageData.imageUrl) {
        setImageUrl(imageData.imageUrl)
        
        // Upload to IPFS using the new API route
        try {
          setIsUploadingToIpfs(true)
          const ipfsResult = await uploadToIpfs(imageData.imageUrl)
          setIpfsUrl(ipfsResult.url)
        } catch (ipfsError) {
          console.error("IPFS upload error:", ipfsError)
          setIpfsError("Failed to upload to IPFS")
        } finally {
          setIsUploadingToIpfs(false)
        }
      } else {
        setImageError("No image URL returned")
      }
    } catch (err) {
      console.error("Image generation error:", err)
      setImageError(err instanceof Error ? err.message : "Could not generate character image")
    } finally {
      setIsImageLoading(false)
    }
  }

  useEffect(() => {
    async function generateFortune() {
      if (!birthYear || !username || !signName) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError("")
        const year = Number.parseInt(birthYear)
        const zodiacSign = zodiac.getSign(year)
        setSign(zodiacSign)

        // Try to get an AI-generated fortune
        try {
          const response = await fetch("/api/generate-fortune", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username,
              sign: signName,
              birthYear,
            }),
          })

          const data = await response.json()

          if (response.ok && data.fortune) {
            setFortune(data.fortune)
          } else {
            console.error("Fortune API error:", data)
            // Fallback to predefined fortunes if API fails
            const signFortunes = fortunes[zodiacSign.name] || fortunes.default
            const randomIndex = Math.floor(Math.random() * signFortunes.length)
            setFortune(signFortunes[randomIndex])
          }
        } catch (apiError) {
          console.error("API error:", apiError)
          // Fallback to predefined fortunes
          const signFortunes = fortunes[zodiacSign.name] || fortunes.default
          const randomIndex = Math.floor(Math.random() * signFortunes.length)
          setFortune(signFortunes[randomIndex])
        }

        // Generate character image independently of fortune
        await generateCharacterImage()
      } catch (err) {
        console.error(err)
        setError("Failed to generate your fortune. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    generateFortune()
  }, [birthYear, username, signName])

  const handleDownloadImage = () => {
    if (imageUrl) {
      const link = document.createElement("a")
      link.href = imageUrl
      link.download = `zora-${signName.toLowerCase()}-character.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

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

  // Only show error state if we have no fortune and no sign
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
            <CardDescription className="text-violet-200">
              {sign.emoji} {sign.name} ({sign.years.join(", ")})
            </CardDescription>
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
                      src={imageUrl}
                      alt={`${sign.name} Character`}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        console.error("Image failed to load:", imageUrl)
                        setImageError("Failed to load the generated image")
                      }}
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button
                        onClick={handleDownloadImage}
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full"
                        title="Download Image"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
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
                  {(imageError || ipfsError) && (
                    <div className="mt-2 p-2 rounded bg-red-500/10 border border-red-500/20">
                      <p className="text-red-400 text-sm">{imageError || ipfsError}</p>
                      <Button
                        onClick={generateCharacterImage}
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
              <ShareButton
                username={username}
                sign={sign.name}
                fortune={fortune}
                imageUrl={imageUrl}
                className="w-full sm:w-auto"
              />
              <MintButton 
                username={username} 
                year={birthYear} 
                sign={sign.name} 
                fortune={fortune}
                imageUrl={imageUrl}
                className="w-full sm:w-auto" 
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

