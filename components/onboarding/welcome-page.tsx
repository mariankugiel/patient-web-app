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
    <div className="min-h-screen" style={{ backgroundColor: "#f0fdf4" }}>
      {/* Header */}
      <div className="text-white p-4" style={{ backgroundColor: "rgb(230, 247, 247)" }}>
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
      <div className="max-w-2xl mx-auto px-6 py-12 md:py-16">
        <Card className="shadow-lg border-0" style={{ backgroundColor: "#f0fdfa" }}>
          <CardHeader className="pb-8 pt-10 px-10 text-center">
            <CardTitle className="text-4xl font-bold mb-3" style={{ color: "#0f766e" }}>
              {getTranslation(language, "welcome.title")}
            </CardTitle>
            <p className="text-xl font-medium" style={{ color: "#14b8a6" }}>
              {getTranslation(language, "welcome.subtitle")}
            </p>
          </CardHeader>

          <CardContent className="px-10 pb-10 space-y-8">
            {/* Description */}
            <p className="text-base leading-relaxed text-center text-gray-600 max-w-xl mx-auto">
              {getTranslation(language, "welcome.description")}
            </p>

            {/* Information Blocks */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start space-x-3 p-4 rounded-lg" style={{ backgroundColor: "#e6fffa" }}>
                <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#0d9488" }} />
                <p className="text-sm leading-relaxed text-gray-600">
                  {getTranslation(language, "welcome.timeEstimate")}
                </p>
              </div>

              <div className="flex items-start space-x-3 p-4 rounded-lg" style={{ backgroundColor: "#e6fffa" }}>
                <RotateCcw className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#0d9488" }} />
                <p className="text-sm leading-relaxed text-gray-600">
                  {getTranslation(language, "welcome.flexibility")}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                onClick={onStart} 
                className="flex-1 text-white font-medium rounded-lg h-12 text-base bg-teal-600 hover:bg-teal-700 transition-colors" 
              >
                {getTranslation(language, "welcome.startButton")}
              </Button>
              <Button 
                onClick={onSkip} 
                variant="outline" 
                className="flex-1 bg-white border-gray-300 font-medium rounded-lg h-12 text-base hover:bg-gray-50 text-gray-700" 
              >
                {getTranslation(language, "welcome.skipButton")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
