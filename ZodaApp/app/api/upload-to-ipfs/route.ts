import { NextResponse } from 'next/server'
import pinataSDK from '@pinata/sdk'
import { Readable } from 'stream'

const pinata = new pinataSDK(
  process.env.PINATA_API_KEY as string,
  process.env.PINATA_SECRET_KEY as string
)

interface UploadToPinataResponse {
  IpfsHash: string
  PinSize: number
  Timestamp: string
  isDuplicate?: boolean
}

// Convert buffer to readable stream
function bufferToStream(buffer: Buffer) {
  const readable = new Readable()
  readable.push(buffer)
  readable.push(null)
  return readable
}

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json()
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      )
    }

    let buffer: Buffer

    // Handle base64 data URLs
    if (imageUrl.startsWith('data:')) {
      const base64Data = imageUrl.split(',')[1]
      buffer = Buffer.from(base64Data, 'base64')
    } else {
      // Handle regular URLs
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error('Failed to fetch image')
      }
      const arrayBuffer = await response.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    }
    
    // Create a readable stream from the buffer
    const stream = bufferToStream(buffer)
    
    // Upload to Pinata
    const result = await pinata.pinFileToIPFS(stream, {
      pinataMetadata: {
        name: `zoda-character-${Date.now()}.png`,
      },
      pinataOptions: {
        cidVersion: 1,
      },
    }) as UploadToPinataResponse

    // Return both the IPFS hash and a gateway URL
    return NextResponse.json({
      ipfsHash: result.IpfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
    })
  } catch (error) {
    console.error('Error uploading to Pinata:', error)
    return NextResponse.json(
      { error: 'Failed to upload image to IPFS' },
      { status: 500 }
    )
  }
} 