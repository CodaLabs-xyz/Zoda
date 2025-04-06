import { ZodiacForm } from "@/components/zodiac-form"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-gradient-to-b from-violet-900 to-indigo-950">
      <Header />

      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-violet-300/20 mt-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">Discover Your Fortune</CardTitle>
          <CardDescription className="text-violet-200">
            Enter your details to reveal your crypto fortune
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ZodiacForm />
        </CardContent>
      </Card>
    </main>
  )
}

