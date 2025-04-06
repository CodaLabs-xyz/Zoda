import Image from "next/image"
import { zodiac } from "@/lib/zodiac"

export function Header() {
  // Get current year
  const currentYear = new Date().getFullYear()

  // Get the zodiac sign for the current year
  const currentSign = zodiac.getSign(currentYear)

  return (
    <div className="w-full flex flex-col items-center justify-center px-4">

      <Image
          src="/assets/zoda-banner.png"
          alt="Year of the Dragon"
          width={350}
          height={300}
          className="drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]"
        />

      <p className="text-violet-200 text-2xl text-center mt-4 font-bold max-w-md">A playful forecast for your crypto grind ✨</p>

      <div className="w-full grid grid-cols-2 md:grid-cols-2 items-center max-w-md">

        <div className="flex justify-center md:justify-start">
          <div className="relative w-40 h-40">
            <div className="absolute inset-0 bg-violet-600/20 rounded-full blur-xl"></div>
            <div className="relative w-full h-full flex items-center justify-center">
              {currentYear === 2024 ? (
                <Image
                  src="/dragon.svg"
                  alt="Year of the Dragon"
                  width={80}
                  height={80}
                  className="drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                />
              ) : (
                <div className="text-7xl">{currentSign.emoji}</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center text-center md:text-center">
          <h2 className="text-xl text-white font-semibold">Year of the {currentSign.name}</h2>
          <p className="text-violet-200 text-sm">
            {currentYear} - {currentSign.element} {currentSign.name}
          </p>
        </div>

      </div>

    </div>
  )
}

