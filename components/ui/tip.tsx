"use client"

import React, { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface TipProps {
  content: string
  className?: string
  iconSize?: number
}

export function Tip({ content, className = "", iconSize = 16 }: TipProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle 
            className={`h-4 w-4 text-muted-foreground hover:text-foreground cursor-help ${className}`}
            size={iconSize}
          />
        </TooltipTrigger>
        <TooltipContent side="top" align="start" className="max-w-xs">
          <div className="text-sm whitespace-pre-line text-left">{content}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
