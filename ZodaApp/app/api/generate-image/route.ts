// app/api/generate-image/route.ts
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not configured")
      return NextResponse.json({ error: "OpenAI API key is not configured" }, { status: 500 })
    }

    console.log("Generating image with prompt:", prompt)

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        prompt,
        n: 1,
        size: '512x512',
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("OpenAI API error:", errorData)
      return NextResponse.json({ error: "Failed to generate image" }, { status: response.status })
    }

    const data = await response.json()

    if (!data.data?.[0]?.url) {
      console.error("Invalid response from OpenAI:", data)
      return NextResponse.json({ error: "Invalid response from image generation API" }, { status: 500 })
    }

    console.log("Successfully generated image")
    return NextResponse.json({ imageUrl: data.data[0].url })
  } catch (error) {
    console.error("Error generating image:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}