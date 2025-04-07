"use client"

import Image from "next/image"
import dynamic from "next/dynamic"
import { zodiac } from "@/lib/zodiac"

// Dynamically import ConnectMenu with no SSR
const ConnectMenu = dynamic(
  () => import("@/components/connect-menu").then(mod => mod.ConnectMenu),
  { ssr: false }
)

export function Header() {
  // Get current year
  const currentYear = new Date().getFullYear()

  // Get the zodiac sign for the current year
  const currentSign = zodiac.getSign(currentYear)

  return (
    <div className="relative w-full flex flex-col items-center justify-center px-4 pt-16 sm:pt-20">
      {/* Connect Menu - Fixed positioned for mobile, absolute for desktop */}
      <div className="fixed sm:absolute top-2 sm:top-4 right-2 sm:right-4 z-10">
        <ConnectMenu />
      </div>

      <Image
        src="/assets/zoda-banner.png"
        alt="Year of the Dragon"
        width={350}
        height={300}
        className="w-full max-w-[350px] drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]"
      />

      <p className="text-violet-200 text-xl sm:text-2xl text-center mt-4 font-bold max-w-md">
        A playful forecast for your crypto grind ✨
      </p>

      <div className="w-full grid grid-cols-2 md:grid-cols-2 items-center max-w-md mt-4">
        <div className="flex justify-center md:justify-start">
          <div className="relative w-32 h-32 sm:w-40 sm:h-40">
            <div className="absolute inset-0 bg-violet-600/20 rounded-full blur-xl"></div>
            <div className="relative w-full h-full flex items-center justify-center">
              {currentYear === 2024 ? (
                <Image
                  src="/dragon.svg"
                  alt="Year of the Dragon"
                  width={80}
                  height={80}
                  className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                />
              ) : (
                <div className="text-5xl sm:text-7xl">{currentSign.emoji}</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center text-center md:text-center">
          <h2 className="text-lg sm:text-xl text-white font-semibold">Year of the {currentSign.name}</h2>
          <p className="text-violet-200 text-xs sm:text-sm">
            {currentYear} - {currentSign.element} {currentSign.name}
          </p>
        </div>
      </div>
    </div>
  )
}

