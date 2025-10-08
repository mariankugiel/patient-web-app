'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Brain, AlertTriangle, ThumbsUp, Lightbulb, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AIDisclaimer } from './ai-disclaimer'

interface AIAnalysisSectionProps {
  title: string
  analysis: {
    success: boolean
    message: string
    analysis: {
      overall_assessment?: string
      summary?: string
      areas_of_concern?: string[]
      positive_trends?: string[]
      recommendations?: string[]
      risk_factors?: string[]
      next_steps?: string[]
    }
    generated_at?: string
    cached?: boolean
    reason?: string
    data_summary?: {
      total_metrics: number
      total_sections: number
      total_data_points?: number
      latest_update?: string
    }
  } | null
  loading: boolean
  error: string | null
  onCheckForUpdates?: () => void
  className?: string
}

export function AIAnalysisSection({ 
  title, 
  analysis, 
  loading, 
  error, 
  onCheckForUpdates,
  className 
}: AIAnalysisSectionProps) {
  return (
    <Card className={cn("border border-gray-200", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-teal-600" />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {analysis?.cached && (
              <Badge variant="outline" className="text-xs">
                Cached
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                console.log('Check for Updates button clicked')
                console.log('onCheckForUpdates function:', onCheckForUpdates)
                if (onCheckForUpdates) {
                  onCheckForUpdates()
                } else {
                  console.error('onCheckForUpdates function is not provided')
                }
              }}
              disabled={loading}
              className="h-8"
            >
              <RefreshCw className={cn("h-3 w-3 mr-1", loading && "animate-spin")} />
              {loading ? 'Checking...' : 'Check for Updates'}
            </Button>
          </div>
        </div>
        {analysis?.cached && analysis?.reason && (
          <p className="text-xs text-muted-foreground mt-1">
            {analysis.reason}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="rounded-lg bg-muted/50 p-4 border border-muted">
          <div className="space-y-4">
            {/* Areas of Concern */}
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                Areas of Concern
              </h4>
              <div className="space-y-2">
                {loading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-red-600"></div>
                    Analyzing your health data...
                  </div>
                ) : error ? (
                  <p className="text-sm text-gray-500 italic">Unable to analyze concerns at this time. Please try again later.</p>
                ) : !analysis ? (
                  <p className="text-sm text-gray-500 italic">No analysis available yet. AI analysis will appear here once generated.</p>
                ) : (analysis?.analysis?.areas_of_concern || []).length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No areas of concern identified in your current health data.</p>
                ) : (
                  (analysis?.analysis?.areas_of_concern || []).map((concern: string, index: number) => (
                    <p key={index} className="text-sm text-gray-700">
                      {typeof concern === 'string' ? concern : String(concern)}
                    </p>
                  ))
                )}
              </div>
            </div>

            {/* Positive Trends */}
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-green-600">
                <ThumbsUp className="h-4 w-4" />
                Positive Trends
              </h4>
              <div className="space-y-2">
                {loading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-green-600"></div>
                    Identifying positive trends...
                  </div>
                ) : error ? (
                  <p className="text-sm text-gray-500 italic">Unable to identify trends at this time. Please try again later.</p>
                ) : !analysis ? (
                  <p className="text-sm text-gray-500 italic">No analysis available yet. AI analysis will appear here once generated.</p>
                ) : (analysis?.analysis?.positive_trends || []).length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No positive trends identified in your current health data.</p>
                ) : (
                  (analysis?.analysis?.positive_trends || []).map((trend: string, index: number) => (
                    <p key={index} className="text-sm text-gray-700">
                      {typeof trend === 'string' ? trend : String(trend)}
                    </p>
                  ))
                )}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-blue-600">
                <Lightbulb className="h-4 w-4" />
                Recommendations
              </h4>
              <div className="space-y-2">
                {loading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                    Generating personalized recommendations...
                  </div>
                ) : error ? (
                  <p className="text-sm text-gray-500 italic">Unable to generate recommendations at this time. Please try again later.</p>
                ) : !analysis ? (
                  <p className="text-sm text-gray-500 italic">No analysis available yet. AI analysis will appear here once generated.</p>
                ) : (analysis?.analysis?.recommendations || []).length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No recommendations available for your current health data.</p>
                ) : (
                  (analysis?.analysis?.recommendations || []).map((recommendation: string, index: number) => (
                    <p key={index} className="text-sm text-gray-700">
                      {typeof recommendation === 'string' ? recommendation : String(recommendation)}
                    </p>
                  ))
                )}
              </div>
            </div>

            {/* Analysis Metadata */}
            {analysis?.data_summary && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Based on {analysis.data_summary.total_sections} sections, {analysis.data_summary.total_metrics} metrics, and {analysis.data_summary.total_data_points} data points
                </p>
              </div>
            )}

            {/* AI Disclaimer */}
            <AIDisclaimer />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
