"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface Message {
  id: string
  sender: {
    name: string
    avatar: string
    role: string
  }
  subject: string
  preview: string
  content: string
  date: string
  isRead: boolean
  isUrgent: boolean
}

interface MessageListProps {
  messages: Message[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function MessageList({ messages, selectedId, onSelect }: MessageListProps) {
  return (
    <div className="h-[600px]">
      <div className="p-4">
        <h2 className="mb-4 text-xl font-semibold">Inbox</h2>
        <div className="space-y-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "cursor-pointer rounded-lg border p-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
                selectedId === message.id && "border-teal-600 bg-teal-50 dark:border-teal-400 dark:bg-teal-950",
                !message.isRead && "border-l-4 border-l-teal-600 dark:border-l-teal-400",
              )}
              onClick={() => onSelect(message.id)}
            >
              <div className="flex items-start justify-between">
                <div className="font-medium">{message.sender.name}</div>
                <div className="text-xs text-muted-foreground">
                  {message.date ? 
                    (() => {
                      const date = new Date(message.date);
                      return isNaN(date.getTime()) ? 'Unknown time' : 
                        formatDistanceToNow(date, { addSuffix: true });
                    })() : 
                    'Unknown time'
                  }
                </div>
              </div>
              <div className="mt-1 text-sm font-medium">{message.subject}</div>
              <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{message.preview}</div>
              {message.isUrgent && (
                <Badge className="mt-2 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700">Urgent</Badge>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
