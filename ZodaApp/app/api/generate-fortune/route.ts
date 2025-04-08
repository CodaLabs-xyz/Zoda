import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { username, sign, birthYear } = await req.json()

    // Get OpenRouter API key from environment variables
    const apiKey = process.env.OPENROUTER_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "OpenRouter API key is not configured" }, { status: 500 })
    }

    // Create a prompt for the fortune generation
    const prompt = `Generate a positive, optimistic crypto fortune for a person born in the Year of the ${sign} (${birthYear}). 
    The fortune should be maximun 2 sentences long but need to be less of 200 words in total, and include:
    1. A reference to their zodiac sign's traits (${sign})
    2. A positive prediction about their crypto projects' development, innovations, or community building
    3. Mention their potential for creating impactful blockchain solutions or contributing to web3
    4. A bit of mystical/celestial language
    5. Keep it upbeat and encouraging, focusing on growth and development (not market conditions)
    
    Format it as a direct message to the user without any additional text. Avoid any mentions of prices, bear markets, or market conditions.`

    // Call the OpenRouter API with GPT-4o-mini
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://zoda.codalabs.xyz",
        "X-Title": "Zoda Fortune Teller",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a mystical fortune teller specializing in crypto fortunes based on Chinese zodiac signs. Your responses are always positive and encouraging.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 150,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("OpenRouter API error:", data)
      return NextResponse.json({ error: "Failed to generate fortune" }, { status: response.status })
    }

    const fortune = data.choices[0].message.content.trim()

    return NextResponse.json({ fortune })
  } catch (error) {
    console.error("Error generating fortune:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

