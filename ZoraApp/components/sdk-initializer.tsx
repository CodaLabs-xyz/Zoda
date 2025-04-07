'use client'

import { useEffect } from 'react'
import { sdk } from '@farcaster/frame-sdk'

export function SdkInitializer() {
  useEffect(() => {
    const initSdk = async () => {
      try {
        await sdk.actions.ready()
      } catch (error) {
        console.error('Failed to initialize SDK:', error)
      }
    }

    initSdk()
  }, [])

  return null // This component doesn't render anything
} 