import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { Reply, Trash, Archive } from "lucide-react"

interface Message {
  id: string
  sender: {
    name: string
    avatar: string
    role: string
  }
  subject: string
  content: string
  date: string
  isUrgent: boolean
}

interface MessageDetailProps {
  message: Message
}

export function MessageDetail({ message }: MessageDetailProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{message.subject}</h2>
          {message.isUrgent && (
            <div className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-100">
              Urgent
            </div>
          )}
        </div>
        <div className="mt-4 flex items-center space-x-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={message.sender.avatar || "/placeholder.svg"} alt={message.sender.name} />
            <AvatarFallback>
              {message.sender.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{message.sender.name}</div>
            <div className="text-sm text-muted-foreground">{message.sender.role}</div>
          </div>
          <div className="ml-auto text-sm text-muted-foreground">{format(new Date(message.date), "PPP 'at' p")}</div>
        </div>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <p className="whitespace-pre-line">{message.content}</p>
        </div>
      </ScrollArea>
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <Button className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-700">
            <Reply className="mr-2 h-4 w-4" />
            Reply
          </Button>
          <Button variant="outline">
            <Archive className="mr-2 h-4 w-4" />
            Archive
          </Button>
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
