import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { WagmiConfig } from "@/providers/wagmi-provider"
import { SdkInitializer } from "@/components/sdk-initializer"

const inter = Inter({ subsets: ["latin"] })

// Define frame metadata as a plain object without any Set objects
const frameMetadata = {
  version: "next",
  imageUrl: "https://ipfs.io/ipfs/bafybeigau5ucdsw6lnj4lntodl5aeez47wkeb7qgrqswocmkybvt3ww3tm",
  aspectRatio: "1:1",
  button: {
    title: "Get My Fortune",
    action: "post"
  }
}

export const metadata: Metadata = {
  title: "Zoda - Your Crypto Fortune Teller",
  description: "Discover your crypto fortune based on your Chinese zodiac sign",
  other: {
    'fc:frame': JSON.stringify(frameMetadata)
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
          storageKey="zoda-theme"
        >
          <WagmiConfig>
            <SdkInitializer />
            {children}
          </WagmiConfig>
        </ThemeProvider>
      </body>
    </html>
  )
}

import './globals.css'