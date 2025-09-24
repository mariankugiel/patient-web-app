'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Loader2 } from 'lucide-react'

interface MedicalImageAISummaryProps {
  summary: string | null
  loading: boolean
  lastUpdated?: string
}

export function MedicalImageAISummary({ summary, loading, lastUpdated }: MedicalImageAISummaryProps) {
  if (loading) {
    return (
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-blue-600" />
            AI Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Generating AI summary...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!summary) {
    return (
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-blue-600" />
            AI Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Summary Available</h3>
            <p className="text-gray-500">
              Upload medical images to generate an AI-powered summary of your imaging studies.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-blue-600" />
          AI Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            {summary}
          </p>
        </div>
        {lastUpdated && (
          <p className="text-xs text-gray-500 mt-3">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
