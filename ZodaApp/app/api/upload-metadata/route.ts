import { NextResponse } from 'next/server'
import pinataSDK from '@pinata/sdk'

const pinata = new pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_SECRET_KEY
)

export async function POST(req: Request) {
  try {
    // Log the environment variables (without revealing the actual values)
    console.log('Pinata API Key exists:', !!process.env.PINATA_API_KEY)
    console.log('Pinata API Secret exists:', !!process.env.PINATA_SECRET_KEY)

    const metadata = await req.json()

    if (!process.env.PINATA_API_KEY || !process.env.PINATA_SECRET_KEY) {
      throw new Error('Pinata credentials not configured')
    }

    // Upload metadata to IPFS via Pinata
    const result = await pinata.pinJSONToIPFS(metadata, {
      pinataMetadata: {
        name: `Zoda Fortune - ${metadata.name}`,
      },
    })

    return NextResponse.json({ 
      metadataUrl: `ipfs://${result.IpfsHash}` 
    })
  } catch (error) {
    console.error('Error uploading metadata:', error)
    return NextResponse.json(
      { error: 'Failed to upload metadata' },
      { status: 500 }
    )
  }
} 