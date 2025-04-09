// pages/api/fetch-and-resize-image.ts

import { NextResponse } from 'next/server'
import sharp from 'sharp'

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json()

    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 })
    }

    const response = await fetch(imageUrl)

    if (!response.ok) {
      throw new Error('Failed to fetch image')
    }

    const imageBuffer = await response.arrayBuffer()

    // Resize the image to 512x512 using sharp
    const resizedImageBuffer = await sharp(Buffer.from(imageBuffer))
      .resize(512, 512)
      .toBuffer()

    // Return the resized image as a blob
    return new NextResponse(resizedImageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (error) {
    console.error('Error fetching or resizing image:', error)
    return NextResponse.json(
      { error: 'Failed to fetch or resize image' },
      { status: 500 }
    )
  }
}