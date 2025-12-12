"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { 
  Bell, 
  X, 
  Check, 
  Calendar, 
  CreditCard, 
  MessageCircle, 
  Star,
  AlertCircle,
  ChevronRight,
  Filter
} from "lucide-react"

interface Notification {
  id: string
  type: "booking" | "payment" | "message" | "review" | "system"
  title: string
  message: string
  time: string
  priority: "high" | "medium" | "low"
  isRead: boolean
  actionUrl?: string
  groupId?: string
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "booking",
    title: "Booking Confirmed",
    message: "Your cleaning service is confirmed for tomorrow at 10:00 AM",
    time: "2 min ago",
    priority: "high",
    isRead: false,
    actionUrl: "/bookings/123",
    groupId: "booking-123"
  },
  {
    id: "2",
    type: "message",
    title: "New Message",
    message: "Swiss Clean Pro: I'll arrive 5 minutes early to set up",
    time: "5 min ago",
    priority: "medium",
    isRead: false,
    actionUrl: "/messages/456"
  },
  {
    id: "3",
    type: "payment",
    title: "Payment Processed",
    message: "CHF 90.00 has been charged to your card ending in 1234",
    time: "1 hour ago",
    priority: "medium",
    isRead: true,
    groupId: "booking-123"
  },
  {
    id: "4",
    type: "review",
    title: "Leave a Review",
    message: "How was your experience with Swiss Clean Pro?",
    time: "2 hours ago",
    priority: "low",
    isRead: false,
    actionUrl: "/reviews/new"
  }
]

export function SmartNotifications() {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [filter, setFilter] = useState<"all" | "unread" | "high">("all")

  const unreadCount = notifications.filter(n => !n.isRead).length
  const highPriorityCount = notifications.filter(n => n.priority === "high" && !n.isRead).length

  // Group related notifications
  const groupedNotifications = notifications.reduce((groups, notification) => {
    const key = notification.groupId || notification.id
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(notification)
    return groups
  }, {} as Record<string, Notification[]>)

  const filteredGroups = Object.entries(groupedNotifications).filter(([_, group]) => {
    const mainNotification = group[0]
    if (filter === "unread") return group.some(n => !n.isRead)
    if (filter === "high") return group.some(n => n.priority === "high" && !n.isRead)
    return true
  })

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    )
  }

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "booking": return Calendar
      case "payment": return CreditCard
      case "message": return MessageCircle
      case "review": return Star
      default: return Bell
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "border-l-red-500 bg-red-50/50 dark:bg-red-950/20"
      case "medium": return "border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20"
      default: return "border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-gradient-to-br from-accent to-primary border-2 border-background">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:w-96 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Notifications</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold" aria-hidden="true">Notifications</h2>
              {highPriorityCount > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {highPriorityCount} urgent
                </Badge>
              )}
            </div>
            
            {/* Filter Tabs */}
            <div className="flex gap-2">
              {[
                { key: "all", label: "All", count: notifications.length },
                { key: "unread", label: "Unread", count: unreadCount },
                { key: "high", label: "Priority", count: highPriorityCount }
              ].map((tab) => (
                <Button
                  key={tab.key}
                  variant={filter === tab.key ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilter(tab.key as any)}
                  className="text-xs"
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-[10px]">
                      {tab.count}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No notifications</p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {filteredGroups.map(([groupId, group]) => {
                  const mainNotification = group[0]
                  const hasMultiple = group.length > 1
                  const Icon = getNotificationIcon(mainNotification.type)
                  
                  return (
                    <Card 
                      key={groupId}
                      className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${
                        getPriorityColor(mainNotification.priority)
                      } ${!mainNotification.isRead ? 'bg-muted/30' : ''}`}
                      onClick={() => {
                        if (!mainNotification.isRead) {
                          markAsRead(mainNotification.id)
                        }
                        if (mainNotification.actionUrl) {
                          // Navigate to action URL
                          console.log("Navigate to:", mainNotification.actionUrl)
                        }
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            mainNotification.priority === "high" 
                              ? "bg-red-100 dark:bg-red-900/30" 
                              : "bg-primary/10"
                          }`}>
                            <Icon className={`h-4 w-4 ${
                              mainNotification.priority === "high" 
                                ? "text-red-600" 
                                : "text-primary"
                            }`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm line-clamp-1">
                                  {mainNotification.title}
                                  {hasMultiple && (
                                    <Badge variant="secondary" className="ml-2 text-xs">
                                      +{group.length - 1} more
                                    </Badge>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                  {mainNotification.message}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {mainNotification.time}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {!mainNotification.isRead && (
                                  <div className="w-2 h-2 bg-primary rounded-full" />
                                )}
                                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                          <div className="flex gap-1">
                            {!mainNotification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markAsRead(mainNotification.id)
                                }}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Mark Read
                              </Button>
                            )}
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              dismissNotification(mainNotification.id)
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {notifications.length > 0 && (
            <div className="p-4 border-t bg-muted/30">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => {
                    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
                  }}
                >
                  Mark All Read
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setNotifications([])}
                >
                  Clear All
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}