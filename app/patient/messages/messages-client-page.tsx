"use client"

import { useState } from "react"
import { PlusCircle, Send } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/language-context"

// Sample conversation data
const conversations = [
  {
    id: "1",
    contact: {
      name: "Dr. Johnson",
      avatar: "/compassionate-doctor-consultation.png",
      role: "Primary Care Physician",
    },
    messages: [
      {
        id: "1-1",
        sender: "doctor",
        content: "Hello! How are you feeling after our last appointment?",
        timestamp: "2023-05-15T14:30:00Z",
        isRead: true,
      },
      {
        id: "1-2",
        sender: "patient",
        content: "I'm feeling much better, thank you. The new medication seems to be working well.",
        timestamp: "2023-05-15T15:45:00Z",
        isRead: true,
      },
      {
        id: "1-3",
        sender: "doctor",
        content: "That's great to hear! Any side effects that you've noticed?",
        timestamp: "2023-05-15T16:20:00Z",
        isRead: true,
      },
      {
        id: "1-4",
        sender: "patient",
        content: "Just a bit of drowsiness in the morning, but it goes away after breakfast.",
        timestamp: "2023-05-15T17:05:00Z",
        isRead: true,
      },
      {
        id: "1-5",
        sender: "doctor",
        content:
          "That's a common side effect and should diminish over time. Let's continue with the current dosage and review in two weeks.",
        timestamp: "2023-05-15T17:30:00Z",
        isRead: true,
      },
    ],
    unreadCount: 0,
    lastMessageTime: "2023-05-15T17:30:00Z",
  },
  {
    id: "2",
    contact: {
      name: "Dr. Smith",
      avatar: "/compassionate-heart-care.png",
      role: "Cardiologist",
    },
    messages: [
      {
        id: "2-1",
        sender: "doctor",
        content: "I've reviewed your latest ECG results and everything looks normal.",
        timestamp: "2023-05-10T09:15:00Z",
        isRead: true,
      },
      {
        id: "2-2",
        sender: "patient",
        content: "That's a relief! I was worried about those chest pains I mentioned.",
        timestamp: "2023-05-10T10:30:00Z",
        isRead: true,
      },
      {
        id: "2-3",
        sender: "doctor",
        content:
          "The pains are likely muscular rather than cardiac. I'd recommend some gentle stretching exercises and to avoid heavy lifting for a week.",
        timestamp: "2023-05-10T11:00:00Z",
        isRead: true,
      },
    ],
    unreadCount: 0,
    lastMessageTime: "2023-05-10T11:00:00Z",
  },
  {
    id: "3",
    contact: {
      name: "Dr. Patel",
      avatar: "/doctor-explaining-endocrine-system.png",
      role: "Endocrinologist",
    },
    messages: [
      {
        id: "3-1",
        sender: "doctor",
        content: "Based on your latest blood work, we need to adjust your insulin dosage.",
        timestamp: "2023-05-05T16:45:00Z",
        isRead: false,
      },
      {
        id: "3-2",
        sender: "doctor",
        content:
          "Please reduce your morning dose to 10 units instead of 12 units. Continue monitoring your blood glucose levels and send me your readings at the end of the week.",
        timestamp: "2023-05-05T16:50:00Z",
        isRead: false,
      },
    ],
    unreadCount: 2,
    lastMessageTime: "2023-05-05T16:50:00Z",
  },
  {
    id: "4",
    contact: {
      name: "Health Plan Support",
      avatar: "/diverse-healthy-lifestyle.png",
      role: "Health Plan Team",
    },
    messages: [
      {
        id: "4-1",
        sender: "system",
        content: "Your new health plan 'Weight Management' has been created.",
        timestamp: "2023-05-01T11:00:00Z",
        isRead: true,
      },
      {
        id: "4-2",
        sender: "patient",
        content: "I'm finding it difficult to meet the daily step goal. Can we adjust it?",
        timestamp: "2023-05-02T14:20:00Z",
        isRead: true,
      },
      {
        id: "4-3",
        sender: "system",
        content: "Your health plan has been updated. Daily step goal changed from 10,000 to 7,500.",
        timestamp: "2023-05-02T15:30:00Z",
        isRead: true,
      },
      {
        id: "4-4",
        sender: "patient",
        content: "Thank you! This seems more achievable for me right now.",
        timestamp: "2023-05-02T16:15:00Z",
        isRead: true,
      },
    ],
    unreadCount: 0,
    lastMessageTime: "2023-05-02T16:15:00Z",
  },
  {
    id: "5",
    contact: {
      name: "Medication Reminders",
      avatar: "/diverse-medication-display.png",
      role: "Medication System",
    },
    messages: [
      {
        id: "5-1",
        sender: "system",
        content: "Your prescription for Lisinopril has been renewed. You can pick it up from your pharmacy.",
        timestamp: "2023-04-28T09:00:00Z",
        isRead: true,
      },
      {
        id: "5-2",
        sender: "patient",
        content: "I'm experiencing some side effects with the new medication. Who should I contact?",
        timestamp: "2023-04-29T10:15:00Z",
        isRead: true,
      },
      {
        id: "5-3",
        sender: "system",
        content:
          "Please contact Dr. Johnson regarding side effects. A message has been forwarded to your primary care physician.",
        timestamp: "2023-04-29T10:20:00Z",
        isRead: true,
      },
      {
        id: "5-4",
        sender: "doctor",
        content: "This is Dr. Johnson. What side effects are you experiencing with Lisinopril?",
        timestamp: "2023-04-29T11:30:00Z",
        isRead: true,
      },
      {
        id: "5-5",
        sender: "patient",
        content: "I've been having a dry cough and feeling dizzy occasionally.",
        timestamp: "2023-04-29T12:45:00Z",
        isRead: true,
      },
      {
        id: "5-6",
        sender: "doctor",
        content:
          "Those are known side effects of Lisinopril. Let's schedule an appointment to discuss alternatives. In the meantime, make sure you're staying hydrated.",
        timestamp: "2023-04-29T13:15:00Z",
        isRead: false,
      },
    ],
    unreadCount: 1,
    lastMessageTime: "2023-04-29T13:15:00Z",
  },
]

export default function MessagesClientPage() {
  const { t } = useLanguage()
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    conversations.length > 0 ? conversations[0].id : null,
  )
  const [newMessage, setNewMessage] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [newMessageRecipient, setNewMessageRecipient] = useState("")
  const [newMessageSubject, setNewMessageSubject] = useState("")
  const [newMessageContent, setNewMessageContent] = useState("")

  const selectedConversation = conversations.find((conv) => conv.id === selectedConversationId)

  const filteredConversations =
    activeTab === "all"
      ? conversations
      : activeTab === "unread"
        ? conversations.filter((conv) => conv.unreadCount > 0)
        : conversations.filter((conv) => {
            if (activeTab === "doctors")
              return (
                conv.contact.role.includes("Physician") ||
                conv.contact.role.includes("Cardiologist") ||
                conv.contact.role.includes("Endocrinologist")
              )
            if (activeTab === "system")
              return (
                conv.contact.role.includes("System") ||
                conv.contact.role.includes("Team") ||
                conv.contact.role.includes("Support")
              )
            return true
          })

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversationId) return

    // In a real app, you would send this to an API
    console.log("Sending message:", newMessage)

    // Clear the input
    setNewMessage("")
  }

  const handleCreateNewMessage = () => {
    // In a real app, you would create a new conversation and send the message
    console.log("Creating new message:", {
      recipient: newMessageRecipient,
      subject: newMessageSubject,
      content: newMessageContent,
    })

    // Clear the inputs
    setNewMessageRecipient("")
    setNewMessageSubject("")
    setNewMessageContent("")
  }

  return (
    <div className="flex flex-col space-y-4 p-6">
      <div className="flex items-center gap-4 mb-2">
        <Avatar className="h-16 w-16 border-2 border-primary">
          <AvatarImage src="/middle-aged-man-profile.png" alt="John Doe" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold text-primary">{t("greeting.morning")}, John!</h1>
          <p className="text-muted-foreground">{t("messages.communicateWithTeam")}</p>
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-700">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t("messages.newMessage")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t("messages.newMessage")}</DialogTitle>
              <DialogDescription>{t("messages.newMessageDesc")}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="recipient" className="text-right">
                  {t("messages.to")}
                </Label>
                <Input
                  id="recipient"
                  value={newMessageRecipient}
                  onChange={(e) => setNewMessageRecipient(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subject" className="text-right">
                  {t("messages.subject")}
                </Label>
                <Input
                  id="subject"
                  value={newMessageSubject}
                  onChange={(e) => setNewMessageSubject(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="message" className="text-right">
                  {t("messages.message")}
                </Label>
                <Textarea
                  id="message"
                  value={newMessageContent}
                  onChange={(e) => setNewMessageContent(e.target.value)}
                  className="col-span-3"
                  rows={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreateNewMessage}
                className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-700"
              >
                {t("messages.sendMessage")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">{t("messages.all")}</TabsTrigger>
              <TabsTrigger value="doctors">{t("messages.doctors")}</TabsTrigger>
              <TabsTrigger value="unread">{t("messages.unread")}</TabsTrigger>
            </TabsList>
            <ScrollArea className="h-[600px]">
              <div className="p-4">
                <div className="space-y-2">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`cursor-pointer rounded-lg border p-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
                        selectedConversationId === conversation.id
                          ? "border-teal-600 bg-teal-50 dark:border-teal-400 dark:bg-teal-950"
                          : ""
                      } ${conversation.unreadCount > 0 ? "border-l-4 border-l-teal-600 dark:border-l-teal-400" : ""}`}
                      onClick={() => setSelectedConversationId(conversation.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarImage
                            src={conversation.contact.avatar || "/placeholder.svg"}
                            alt={conversation.contact.name}
                          />
                          <AvatarFallback>{conversation.contact.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{conversation.contact.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(conversation.lastMessageTime), { addSuffix: true })}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">{conversation.contact.role}</div>
                          <div className="mt-1 text-sm line-clamp-1">
                            {conversation.messages[conversation.messages.length - 1].content}
                          </div>
                          {conversation.unreadCount > 0 && (
                            <div className="mt-1 flex justify-end">
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-xs font-medium text-white">
                                {conversation.unreadCount}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </Tabs>
        </Card>

        <Card className="md:col-span-2">
          {selectedConversation ? (
            <div className="flex h-[600px] flex-col">
              <div className="border-b p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage
                      src={selectedConversation.contact.avatar || "/placeholder.svg"}
                      alt={selectedConversation.contact.name}
                    />
                    <AvatarFallback>{selectedConversation.contact.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{selectedConversation.contact.name}</div>
                    <div className="text-sm text-muted-foreground">{selectedConversation.contact.role}</div>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {selectedConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === "patient" ? "justify-end" : "justify-start"}`}
                    >
                      {message.sender !== "patient" && (
                        <Avatar className="mr-2 h-8 w-8">
                          <AvatarImage
                            src={selectedConversation.contact.avatar || "/placeholder.svg"}
                            alt={selectedConversation.contact.name}
                          />
                          <AvatarFallback>{selectedConversation.contact.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.sender === "patient"
                            ? "bg-teal-600 text-white"
                            : message.sender === "system"
                              ? "bg-gray-200 dark:bg-gray-700"
                              : "bg-gray-100 dark:bg-gray-800"
                        }`}
                      >
                        <div className="text-sm">{message.content}</div>
                        <div className="mt-1 text-right text-xs opacity-70">
                          {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                        </div>
                      </div>
                      {message.sender === "patient" && (
                        <Avatar className="ml-2 h-8 w-8">
                          <AvatarImage src="/middle-aged-man-profile.png" alt="You" />
                          <AvatarFallback>You</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder={t("messages.typePlaceholder")}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="min-h-[60px] flex-1 resize-none"
                  />
                  <Button
                    onClick={handleSendMessage}
                    className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-700"
                  >
                    <Send className="h-4 w-4" />
                    <span className="sr-only">{t("messages.send")}</span>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-[600px] items-center justify-center p-6">
              <p className="text-muted-foreground">{t("messages.selectConversation")}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
