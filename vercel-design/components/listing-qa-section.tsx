"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  MessageSquare,
  Send,
  Lock,
  Globe,
  CheckCircle2,
  Clock,
  MoreVertical,
  Flag,
  ThumbsUp,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  EyeOff,
  Shield,
  HelpCircle,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface QAMessage {
  id: string
  type: "question" | "answer" | "follow-up" | "follow-up-reply"
  content: string
  author: {
    name: string
    avatar?: string
    isVendor?: boolean
    isVerified?: boolean
  }
  timestamp: string
  isPublic: boolean
  helpful?: number
}

interface QAThread {
  id: string
  messages: QAMessage[]
  status: "pending" | "answered" | "closed"
  category?: string
}

const sampleThreads: QAThread[] = [
  {
    id: "1",
    status: "closed",
    category: "Pricing",
    messages: [
      {
        id: "1a",
        type: "question",
        content:
          "Do you offer discounts for recurring weekly bookings? I'm interested in scheduling a regular cleaning every Friday.",
        author: { name: "Emma K.", isVerified: true },
        timestamp: "3 days ago",
        isPublic: true,
        helpful: 12,
      },
      {
        id: "1b",
        type: "answer",
        content:
          "Yes! We offer 15% off for weekly recurring bookings and 10% off for bi-weekly schedules. The discount is applied automatically after your second booking. Would you like me to set up a recurring schedule for you?",
        author: { name: "Swiss Clean Pro", avatar: "/placeholder.svg", isVendor: true },
        timestamp: "3 days ago",
        isPublic: true,
      },
      {
        id: "1c",
        type: "follow-up",
        content: "That's great! Is there a minimum commitment period for the recurring discount?",
        author: { name: "Emma K.", isVerified: true },
        timestamp: "2 days ago",
        isPublic: true,
      },
      {
        id: "1d",
        type: "follow-up-reply",
        content:
          "No minimum commitment! You can cancel or pause anytime. The discount applies as long as the recurring booking is active. Feel free to book your first session and I'll make sure the discount is set up properly.",
        author: { name: "Swiss Clean Pro", avatar: "/placeholder.svg", isVendor: true },
        timestamp: "2 days ago",
        isPublic: true,
      },
    ],
  },
  {
    id: "2",
    status: "answered",
    category: "Service",
    messages: [
      {
        id: "2a",
        type: "question",
        content:
          "Do you bring your own cleaning supplies or should I provide them? I have specific eco-friendly products I prefer.",
        author: { name: "Marco T." },
        timestamp: "1 week ago",
        isPublic: true,
        helpful: 8,
      },
      {
        id: "2b",
        type: "answer",
        content:
          "We bring all our own professional-grade, eco-friendly cleaning supplies. However, we're happy to use your preferred products if you'd like - just let us know when booking and leave them out for us. No extra charge!",
        author: { name: "Swiss Clean Pro", avatar: "/placeholder.svg", isVendor: true },
        timestamp: "1 week ago",
        isPublic: true,
      },
    ],
  },
  {
    id: "3",
    status: "pending",
    category: "Availability",
    messages: [
      {
        id: "3a",
        type: "question",
        content: "Are you available for same-day emergency cleaning? I have guests arriving tonight unexpectedly.",
        author: { name: "Julia S.", isVerified: true },
        timestamp: "2 hours ago",
        isPublic: true,
        helpful: 3,
      },
    ],
  },
  {
    id: "4",
    status: "closed",
    category: "Equipment",
    messages: [
      {
        id: "4a",
        type: "question",
        content: "I have expensive hardwood floors. What type of cleaning method do you use for them?",
        author: { name: "Andreas M.", isVerified: true },
        timestamp: "2 weeks ago",
        isPublic: false,
        helpful: 0,
      },
      {
        id: "4b",
        type: "answer",
        content:
          "We use specialized pH-neutral hardwood floor cleaners and microfiber mops - never steam or excessive water. Our team is trained in proper hardwood floor care. I can send you details about our exact products if you'd like to verify they're suitable for your specific floor type.",
        author: { name: "Swiss Clean Pro", avatar: "/placeholder.svg", isVendor: true },
        timestamp: "2 weeks ago",
        isPublic: false,
      },
    ],
  },
]

interface ListingQASectionProps {
  listingId: string
  vendorName: string
  isVendor?: boolean
}

export function ListingQASection({ listingId, vendorName, isVendor = false }: ListingQASectionProps) {
  const [threads, setThreads] = useState<QAThread[]>(sampleThreads)
  const [newQuestion, setNewQuestion] = useState("")
  const [replyContent, setReplyContent] = useState<Record<string, string>>({})
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set(["1"]))
  const [askDialogOpen, setAskDialogOpen] = useState(false)
  const [filter, setFilter] = useState<"all" | "pending" | "answered">("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const toggleThread = (threadId: string) => {
    setExpandedThreads((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(threadId)) {
        newSet.delete(threadId)
      } else {
        newSet.add(threadId)
      }
      return newSet
    })
  }

  const toggleVisibility = (threadId: string, messageId: string) => {
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              messages: thread.messages.map((msg) =>
                msg.id === messageId ? { ...msg, isPublic: !msg.isPublic } : msg,
              ),
            }
          : thread,
      ),
    )
  }

  const handleSubmitQuestion = () => {
    if (!newQuestion.trim()) return

    const newThread: QAThread = {
      id: `new-${Date.now()}`,
      status: "pending",
      messages: [
        {
          id: `q-${Date.now()}`,
          type: "question",
          content: newQuestion,
          author: { name: "You", isVerified: true },
          timestamp: "Just now",
          isPublic: true,
          helpful: 0,
        },
      ],
    }

    setThreads((prev) => [newThread, ...prev])
    setNewQuestion("")
    setAskDialogOpen(false)
    setExpandedThreads((prev) => new Set([...prev, newThread.id]))
  }

  const handleReply = (threadId: string) => {
    const content = replyContent[threadId]
    if (!content?.trim()) return

    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id !== threadId) return thread

        const lastMessage = thread.messages[thread.messages.length - 1]
        let newType: QAMessage["type"]

        if (isVendor) {
          newType = lastMessage.type === "follow-up" ? "follow-up-reply" : "answer"
        } else {
          newType = "follow-up"
        }

        const newMessage: QAMessage = {
          id: `msg-${Date.now()}`,
          type: newType,
          content,
          author: isVendor ? { name: vendorName, isVendor: true } : { name: "You", isVerified: true },
          timestamp: "Just now",
          isPublic: true,
        }

        const newStatus =
          newType === "follow-up-reply" || (newType === "answer" && thread.messages.length >= 2)
            ? "closed"
            : newType === "answer"
              ? "answered"
              : thread.status

        return {
          ...thread,
          status: newStatus,
          messages: [...thread.messages, newMessage],
        }
      }),
    )

    setReplyContent((prev) => ({ ...prev, [threadId]: "" }))
  }

  const getMessageLabel = (type: QAMessage["type"]) => {
    switch (type) {
      case "question":
        return "Question"
      case "answer":
        return "Vendor Response"
      case "follow-up":
        return "Follow-up"
      case "follow-up-reply":
        return "Final Response"
    }
  }

  const canReply = (thread: QAThread) => {
    const messageCount = thread.messages.length
    const lastMessage = thread.messages[messageCount - 1]

    if (messageCount >= 4) return false

    if (isVendor) {
      return lastMessage.type === "question" || lastMessage.type === "follow-up"
    } else {
      return lastMessage.type === "answer" && messageCount < 3
    }
  }

  const filteredThreads = threads.filter((thread) => {
    const statusMatch = filter === "all" || thread.status === filter
    const categoryMatch = categoryFilter === "all" || thread.category === categoryFilter
    const publicMatch = isVendor || thread.messages.some((m) => m.isPublic)
    return statusMatch && categoryMatch && publicMatch
  })

  const categories = [...new Set(threads.map((t) => t.category).filter(Boolean))]
  const pendingCount = threads.filter((t) => t.status === "pending").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Questions & Answers
            {pendingCount > 0 && isVendor && (
              <Badge variant="destructive" className="ml-2">
                {pendingCount} pending
              </Badge>
            )}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {threads.length} questions · Ask anything about this service
          </p>
        </div>

        <Dialog open={askDialogOpen} onOpenChange={setAskDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <HelpCircle className="h-4 w-4" />
              Ask a Question
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Ask {vendorName}</DialogTitle>
              <DialogDescription>
                Your question will be visible to other users unless the vendor marks it as private.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Textarea
                placeholder="What would you like to know about this service?"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="min-h-[120px] resize-none"
                maxLength={500}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{newQuestion.length}/500 characters</span>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setAskDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmitQuestion} disabled={!newQuestion.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Question
                  </Button>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Tip:</span> Vendors typically respond within 2-4 hours.
                  You'll receive a notification when they reply.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          className={filter !== "all" ? "bg-transparent" : ""}
        >
          All ({threads.length})
        </Button>
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("pending")}
          className={filter !== "pending" ? "bg-transparent" : ""}
        >
          <Clock className="h-3.5 w-3.5 mr-1.5" />
          Awaiting Reply ({pendingCount})
        </Button>
        <Button
          variant={filter === "answered" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("answered")}
          className={filter !== "answered" ? "bg-transparent" : ""}
        >
          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
          Answered
        </Button>

        <Separator orientation="vertical" className="h-8 mx-2 hidden sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="bg-transparent">
              {categoryFilter === "all" ? "All Categories" : categoryFilter}
              <ChevronDown className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setCategoryFilter("all")}>All Categories</DropdownMenuItem>
            {categories.map((cat) => (
              <DropdownMenuItem key={cat} onClick={() => setCategoryFilter(cat!)}>
                {cat}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Q&A Threads */}
      <div className="space-y-4">
        {filteredThreads.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h4 className="font-medium mb-2">No questions yet</h4>
              <p className="text-sm text-muted-foreground mb-4">Be the first to ask about this service</p>
              <Button onClick={() => setAskDialogOpen(true)}>Ask a Question</Button>
            </CardContent>
          </Card>
        ) : (
          filteredThreads.map((thread) => {
            const isExpanded = expandedThreads.has(thread.id)
            const firstMessage = thread.messages[0]
            const hasPrivateMessages = thread.messages.some((m) => !m.isPublic)

            return (
              <Card
                key={thread.id}
                className={cn(
                  "overflow-hidden transition-all",
                  thread.status === "pending" && isVendor && "border-amber-500/50 bg-amber-500/5",
                )}
              >
                {/* Thread Header - Always Visible */}
                <div
                  className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => toggleThread(thread.id)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={firstMessage.author.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {firstMessage.author.name[0]}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-sm">{firstMessage.author.name}</span>
                        {firstMessage.author.isVerified && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                        {thread.category && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            {thread.category}
                          </Badge>
                        )}
                        {hasPrivateMessages && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>Contains private messages</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <span className="text-xs text-muted-foreground">{firstMessage.timestamp}</span>
                      </div>

                      <p className={cn("text-sm", !isExpanded && "line-clamp-2")}>{firstMessage.content}</p>

                      <div className="flex items-center gap-4 mt-2">
                        {thread.status === "pending" ? (
                          <Badge variant="outline" className="text-amber-500 border-amber-500/50 bg-amber-500/10">
                            <Clock className="h-3 w-3 mr-1" />
                            Awaiting Reply
                          </Badge>
                        ) : thread.status === "closed" ? (
                          <Badge variant="outline" className="text-green-500 border-green-500/50 bg-green-500/10">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-primary border-primary/50 bg-primary/10">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {thread.messages.length} {thread.messages.length === 1 ? "message" : "messages"}
                          </Badge>
                        )}

                        {(firstMessage.helpful ?? 0) > 0 && (
                          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                            <ThumbsUp className="h-3.5 w-3.5" />
                            {firstMessage.helpful} found helpful
                          </button>
                        )}
                      </div>
                    </div>

                    <Button variant="ghost" size="icon" className="flex-shrink-0">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Expanded Thread Content */}
                {isExpanded && (
                  <div className="border-t border-border">
                    {/* All Messages */}
                    <div className="divide-y divide-border">
                      {thread.messages.slice(1).map((message, idx) => (
                        <div
                          key={message.id}
                          className={cn(
                            "p-4",
                            message.author.isVendor && "bg-primary/5",
                            !message.isPublic && "bg-muted/50",
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "w-0.5 h-full absolute left-7 top-0",
                                idx < thread.messages.length - 2 && "bg-border",
                              )}
                            />
                            <Avatar className="h-9 w-9 flex-shrink-0">
                              <AvatarImage src={message.author.avatar || "/placeholder.svg"} />
                              <AvatarFallback
                                className={cn(
                                  message.author.isVendor ? "bg-primary text-primary-foreground" : "bg-muted",
                                )}
                              >
                                {message.author.name[0]}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm">{message.author.name}</span>
                                  {message.author.isVendor && (
                                    <Badge className="text-xs px-1.5 py-0 bg-primary/20 text-primary border-0">
                                      <Shield className="h-3 w-3 mr-1" />
                                      Vendor
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                                    {getMessageLabel(message.type)}
                                  </Badge>
                                  {!message.isPublic && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs px-1.5 py-0 text-amber-500 border-amber-500/50"
                                    >
                                      <Lock className="h-3 w-3 mr-1" />
                                      Private
                                    </Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                                </div>

                                <div className="flex items-center gap-1">
                                  {/* Vendor visibility toggle */}
                                  {isVendor && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              toggleVisibility(thread.id, message.id)
                                            }}
                                          >
                                            {message.isPublic ? (
                                              <Globe className="h-4 w-4 text-green-500" />
                                            ) : (
                                              <EyeOff className="h-4 w-4 text-amber-500" />
                                            )}
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          {message.isPublic ? "Visible to everyone" : "Only visible to participants"}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}

                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem>
                                        <ThumbsUp className="h-4 w-4 mr-2" />
                                        Mark as Helpful
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-destructive">
                                        <Flag className="h-4 w-4 mr-2" />
                                        Report
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>

                              <p className="text-sm leading-relaxed">{message.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Reply Input */}
                    {canReply(thread) && (
                      <div className="p-4 bg-muted/30 border-t border-border">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-9 w-9 flex-shrink-0">
                            <AvatarFallback className={isVendor ? "bg-primary text-primary-foreground" : "bg-muted"}>
                              {isVendor ? vendorName[0] : "Y"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-3">
                            <Textarea
                              placeholder={
                                isVendor
                                  ? "Write your response..."
                                  : "Ask a follow-up question (1 follow-up allowed)..."
                              }
                              value={replyContent[thread.id] || ""}
                              onChange={(e) => setReplyContent((prev) => ({ ...prev, [thread.id]: e.target.value }))}
                              className="min-h-[80px] resize-none bg-background"
                              maxLength={500}
                            />
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {isVendor && (
                                  <div className="flex items-center gap-2">
                                    <Switch id={`public-${thread.id}`} defaultChecked />
                                    <label
                                      htmlFor={`public-${thread.id}`}
                                      className="text-xs text-muted-foreground flex items-center gap-1"
                                    >
                                      <Globe className="h-3.5 w-3.5" />
                                      Public
                                    </label>
                                  </div>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {(replyContent[thread.id] || "").length}/500
                                </span>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleReply(thread.id)}
                                disabled={!replyContent[thread.id]?.trim()}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                {isVendor ? "Send Response" : "Send Follow-up"}
                              </Button>
                            </div>

                            {/* Thread Progress Indicator */}
                            <div className="flex items-center gap-2 pt-2">
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4].map((step) => (
                                  <div
                                    key={step}
                                    className={cn(
                                      "h-1.5 w-6 rounded-full transition-colors",
                                      step <= thread.messages.length
                                        ? "bg-primary"
                                        : step === thread.messages.length + 1
                                          ? "bg-primary/40"
                                          : "bg-muted",
                                    )}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {thread.messages.length}/4 messages in thread
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Thread Closed Notice */}
                    {thread.messages.length >= 4 && (
                      <div className="p-4 bg-muted/50 border-t border-border">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <AlertCircle className="h-4 w-4" />
                          <span>
                            This thread has reached its limit. For more questions,{" "}
                            <button className="text-primary hover:underline" onClick={() => setAskDialogOpen(true)}>
                              start a new thread
                            </button>
                            .
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>

      {/* Vendor Quick Stats */}
      {isVendor && (
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Response Analytics</p>
                  <p className="text-sm text-muted-foreground">Last 30 days</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">2.4h</p>
                  <p className="text-xs text-muted-foreground">Avg Response</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">98%</p>
                  <p className="text-xs text-muted-foreground">Response Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">24</p>
                  <p className="text-xs text-muted-foreground">Questions</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
