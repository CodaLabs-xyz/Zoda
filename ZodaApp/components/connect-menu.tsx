"use client"

import { useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from "@/components/ui/button"
import { Wallet, LogOut, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { truncateEthAddress } from "@/lib/utils"
import { sdk } from "@farcaster/frame-sdk"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ConnectMenu() {
  const [mounted, setMounted] = useState(false)
  const { isConnected, address } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [isFarcaster, setIsFarcaster] = useState(false)

  useEffect(() => {
    const checkFarcasterContext = async () => {
      try {
        const context = await sdk.context
        setIsFarcaster(!!context?.client?.clientFid)
      } catch (error) {
        console.error('Failed to get Farcaster context:', error)
        setIsFarcaster(false)
      }
    }

    checkFarcasterContext()
    setMounted(true)
  }, [])

  // Don't render anything on the server
  if (!mounted) {
    return (
      <Button 
        variant="outline" 
        className="bg-violet-600/10 text-violet-600 hover:bg-violet-600/20 hover:text-violet-700"
        disabled
      >
        <Wallet className="h-4 w-4" />
      </Button>
    )
  }

  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="bg-violet-600/10 text-violet-600 hover:bg-violet-600/20 hover:text-violet-700"
          >
            <Wallet className="mr-2 h-4 w-4" />
            {truncateEthAddress(address)}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuItem
            className="text-red-500 focus:text-red-500 cursor-pointer"
            onClick={() => disconnect()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Button
      onClick={async () => {
        try {
          if (isFarcaster) {
            await connect({ connector: connectors[0] })
          } else {
            console.error('Not in Farcaster context')
          }
        } catch (error) {
          console.error('Failed to connect wallet:', error)
        }
      }}
      className={cn(
        "bg-violet-600 hover:bg-violet-700",
        "text-white",
        "flex items-center gap-2"
      )}
    >
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </Button>
  )
} 