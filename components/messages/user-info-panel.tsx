"use client"

import { useState } from "react"
import { 
  X, User, Mail, MapPin, Calendar, 
  Star, Clock, MessageSquare, FileText, Activity,
  Award, GraduationCap, Heart, Shield, Zap
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDistanceToNow } from "date-fns"

import type { MessageSender } from "@/types/messages"

interface UserInfoPanelProps {
  contact: MessageSender
  onClose: () => void
  onViewProfile?: () => void
  onSendMessage?: () => void
}

export function UserInfoPanel({
  contact,
  onClose,
  onViewProfile,
  onSendMessage
}: UserInfoPanelProps) {
  const [activeTab, setActiveTab] = useState("overview")

  const getStatusColor = (isOnline?: boolean) => {
    return isOnline ? "bg-green-500" : "bg-gray-400"
  }

  const getStatusText = (isOnline?: boolean, lastSeen?: string) => {
    if (isOnline) return "Online"
    if (lastSeen) return `Last seen ${formatDistanceToNow(new Date(lastSeen))} ago`
    return "Offline"
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Contact Info</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Profile Section */}
              <div className="text-center">
                <Avatar className="h-20 w-20 mx-auto mb-4">
                  <AvatarImage
                    src={contact.avatar || "/placeholder.svg"}
                    alt={contact.name}
                  />
                  <AvatarFallback className="text-lg">
                    {contact.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <h4 className="font-medium text-gray-900 text-lg">{contact.name}</h4>
                <p className="text-sm text-gray-500 mb-2">{contact.role}</p>
                
                {/* Rating */}
                {contact.rating && (
                  <div className="flex items-center justify-center gap-1 mb-3">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">{contact.rating}</span>
                  </div>
                )}

                {/* Status */}
                <div className="flex items-center justify-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(contact.isOnline)}`}></div>
                  <span className="text-sm text-gray-600">
                    {getStatusText(contact.isOnline, contact.lastSeen)}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Contact Details */}
              <div className="space-y-4">
                {contact.email && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Email</span>
                    </div>
                    <p className="text-sm text-gray-600 ml-6">{contact.email}</p>
                  </div>
                )}
                
                {contact.phone && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Phone</span>
                    </div>
                    <p className="text-sm text-gray-600 ml-6">{contact.phone}</p>
                  </div>
                )}

                {contact.location && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Location</span>
                    </div>
                    <p className="text-sm text-gray-600 ml-6">{contact.location}</p>
                  </div>
                )}

                {contact.specialty && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Heart className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Specialty</span>
                    </div>
                    <p className="text-sm text-gray-600 ml-6">{contact.specialty}</p>
                  </div>
                )}

                {contact.experience && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Experience</span>
                    </div>
                    <p className="text-sm text-gray-600 ml-6">{contact.experience}</p>
                  </div>
                )}
              </div>

              {/* Bio */}
              {contact.bio && (
                <>
                  <Separator />
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">About</h5>
                    <p className="text-sm text-gray-600">{contact.bio}</p>
                  </div>
                </>
              )}

              {/* Education */}
              {contact.education && contact.education.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap className="h-4 w-4 text-gray-400" />
                      <h5 className="text-sm font-medium text-gray-700">Education</h5>
                    </div>
                    <div className="space-y-1">
                      {contact.education.map((edu, index) => (
                        <p key={index} className="text-sm text-gray-600 ml-6">{edu}</p>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Certifications */}
              {contact.certifications && contact.certifications.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <h5 className="text-sm font-medium text-gray-700">Certifications</h5>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {contact.certifications.map((cert, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Languages */}
              {contact.languages && contact.languages.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Languages</h5>
                    <div className="flex flex-wrap gap-1">
                      {contact.languages.map((lang, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Availability */}
              {contact.availability && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <h5 className="text-sm font-medium text-gray-700">Availability</h5>
                    </div>
                    <div className="space-y-1 ml-6">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Timezone:</span> {contact.availability.timezone}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Hours:</span> {contact.availability.workingHours}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Next Available:</span> {contact.availability.nextAvailable}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Stats */}
              {contact.stats && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-gray-400" />
                      <h5 className="text-sm font-medium text-gray-700">Statistics</h5>
                    </div>
                    <div className="grid grid-cols-1 gap-2 ml-6">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Patients:</span>
                        <span className="text-sm font-medium">{contact.stats.totalPatients}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Response Time:</span>
                        <span className="text-sm font-medium">{contact.stats.responseTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Satisfaction:</span>
                        <span className="text-sm font-medium">{contact.stats.satisfactionRate}%</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              {contact.recentActivity && contact.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {contact.recentActivity.map((activity, index) => (
                    <Card key={index} className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            {activity.type === 'message' && <MessageSquare className="h-4 w-4 text-blue-600" />}
                            {activity.type === 'appointment' && <Calendar className="h-4 w-4 text-blue-600" />}
                            {activity.type === 'document' && <FileText className="h-4 w-4 text-blue-600" />}
                          </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(activity.timestamp))} ago
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>

      {/* Action Buttons */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <Button className="w-full" variant="outline" onClick={onViewProfile}>
          <User className="h-4 w-4 mr-2" />
          View Full Profile
        </Button>
        <Button className="w-full" variant="outline" onClick={onSendMessage}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Send Message
        </Button>
      </div>
    </div>
  )
}
