import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { WagmiProvider } from "@/providers/wagmi-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Zoda - Crypto Fortune Teller",
  description: "Discover your crypto fortune based on your Chinese zodiac sign",
  generator: 'v0.dev'
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
          <WagmiProvider>{children}</WagmiProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'