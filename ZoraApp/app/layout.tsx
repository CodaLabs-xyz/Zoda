import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { WagmiConfig } from "@/providers/wagmi-provider"
import { SdkInitializer } from "@/components/sdk-initializer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Zoda - Your Crypto Fortune Teller",
  description: "Discover your crypto fortune based on your Chinese zodiac sign",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
          storageKey="zora-theme"
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