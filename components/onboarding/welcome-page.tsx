"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, RotateCcw, Globe } from "lucide-react"
import { type Language, getTranslation } from "@/lib/translations"
import Image from "next/image"

interface WelcomePageProps {
  language: Language
  onLanguageChange: (language: Language) => void
  onStart: () => void
  onSkip: () => void
}

export function WelcomePage({ language, onLanguageChange, onStart, onSkip }: WelcomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-card to-background">
      {/* Header */}
      <div style={{ backgroundColor: "rgb(230, 247, 247)" }} className="text-teal-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image src="/images/saluso-logo-horizontal.png" alt="Saluso" width={120} height={40} className="h-8 w-auto" />
          </div>

          {/* Language Selector */}
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-teal-600" />
            <Select value={language} onValueChange={onLanguageChange}>
              <SelectTrigger className="w-40 bg-white text-teal-600 border-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-US">{getTranslation(language, "languages.en-US")}</SelectItem>
                <SelectItem value="es-ES">{getTranslation(language, "languages.es-ES")}</SelectItem>
                <SelectItem value="pt-PT">{getTranslation(language, "languages.pt-PT")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Welcome Content */}
      <div className="max-w-2xl mx-auto p-6 mt-12">
        <Card className="text-center">
          <CardHeader className="pb-4">
            <CardTitle className="text-3xl text-balance mb-2">{getTranslation(language, "welcome.title")}</CardTitle>
            <p className="text-xl text-muted-foreground text-balance">{getTranslation(language, "welcome.subtitle")}</p>
          </CardHeader>

          <CardContent className="space-y-6">
            <p className="text-muted-foreground text-balance leading-relaxed">
              {getTranslation(language, "welcome.description")}
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                <Clock className="w-5 h-5 text-teal-600 flex-shrink-0" />
                <p className="text-sm text-muted-foreground text-balance">
                  {getTranslation(language, "welcome.timeEstimate")}
                </p>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                <RotateCcw className="w-5 h-5 text-teal-600 flex-shrink-0" />
                <p className="text-sm text-muted-foreground text-balance">
                  {getTranslation(language, "welcome.flexibility")}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button onClick={onStart} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white" size="lg">
                {getTranslation(language, "welcome.startButton")}
              </Button>
              <Button onClick={onSkip} variant="outline" className="flex-1 bg-transparent" size="lg">
                {getTranslation(language, "welcome.skipButton")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
