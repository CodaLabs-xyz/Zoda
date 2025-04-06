// app/api/generate-image/route.ts
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { prompt } = await req.json()

  console.log("prompt:", prompt)

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

  const data = await response.json()

  console.log("response data:")
  console.log(data)

  return NextResponse.json({ imageUrl: data.data[0].url })
}