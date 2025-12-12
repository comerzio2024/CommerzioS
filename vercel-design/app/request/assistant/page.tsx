"use client"

import React from "react"
import { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bot,
  Send,
  Sparkles,
  Loader2,
  Star,
  Clock,
  Phone,
  CheckCircle2,
  ArrowRight,
  Megaphone,
  Users,
  MessageSquare,
  ChevronRight,
  Home,
  Wrench,
  Paintbrush,
  ZapIcon,
  Truck,
  Leaf,
  ImageIcon,
  Bell,
  Shield,
  ThumbsUp,
  HelpCircle,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"

interface RequestState {
  step: "gathering" | "published" | "proposals" | "accepted"
  request?: {
    id: string
    title: string
    description: string
    category: string
    location: string
    budget: string
    vendorsNotified: number
  }
  proposals?: Proposal[]
  acceptedProposal?: {
    vendorName: string
    bookingId: string
  }
}

interface Proposal {
  id: string
  vendorName: string
  rating: number
  reviews: number
  price: string
  message: string
  availability: string
  verified: boolean
}

const initialRequestState: RequestState = {
  step: "gathering",
}

const quickRequests = [
  { icon: Wrench, label: "Plumbing Issue", query: "I have a plumbing problem that needs fixing" },
  { icon: ZapIcon, label: "Electrical Work", query: "I need an electrician for some work" },
  { icon: Paintbrush, label: "Painting", query: "I need painting done in my home" },
  { icon: Leaf, label: "Landscaping", query: "Looking for landscaping services" },
  { icon: Truck, label: "Moving Help", query: "I need help moving furniture" },
  { icon: Home, label: "Home Repair", query: "I have some home repairs needed" },
]

export default function RequestAssistantPage() {
  const [requestState, setRequestState] = useState<RequestState>(initialRequestState)
  const [inputValue, setInputValue] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/request-assistant" }),
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hi! I'm here to help you post a service request. Tell me what you need done, and I'll publish it to our network of verified vendors who can send you proposals. What kind of help are you looking for today?",
      },
    ],
    onToolCall: ({ toolCall }) => {
      if (toolCall.toolName === "createServiceRequest") {
        setRequestState((prev) => ({ ...prev, step: "published" }))
      }
      if (toolCall.toolName === "getProposals") {
        setRequestState((prev) => ({ ...prev, step: "proposals" }))
      }
      if (toolCall.toolName === "acceptProposal") {
        setRequestState((prev) => ({ ...prev, step: "accepted" }))
      }
    },
  })

  const isLoading = status === "streaming" || status === "submitted"

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return
    setShowSuggestions(false)
    const message = inputValue
    setInputValue("")
    sendMessage({ text: message })
  }

  const handleQuickRequest = async (query: string) => {
    setShowSuggestions(false)
    setInputValue("")
    sendMessage({ text: query })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend()
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newImages = Array.from(files).map((file) => URL.createObjectURL(file))
      setUploadedImages((prev) => [...prev, ...newImages])
    }
  }

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleReset = () => {
    setRequestState(initialRequestState)
    setShowSuggestions(true)
    setUploadedImages([])
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        content: "Let's start fresh! What service do you need help with?",
      },
    ])
  }

  // Mock proposals for UI demonstration
  const mockProposals: Proposal[] = [
    {
      id: "prop-1",
      vendorName: "Mike's Plumbing",
      rating: 4.8,
      reviews: 127,
      price: "$120",
      message: "I can help with this today! I have 15 years experience with similar jobs.",
      availability: "Available today",
      verified: true,
    },
    {
      id: "prop-2",
      vendorName: "Quick Fix Services",
      rating: 4.6,
      reviews: 89,
      price: "$95",
      message: "Happy to take a look. Can be there within 2 hours.",
      availability: "Available now",
      verified: true,
    },
    {
      id: "prop-3",
      vendorName: "Pro Home Repairs",
      rating: 4.9,
      reviews: 234,
      price: "$150",
      message: "Expert in this area. Free diagnostic included.",
      availability: "Tomorrow morning",
      verified: true,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 shadow-lg shadow-orange-500/25">
                  <Megaphone className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 ring-2 ring-background">
                  <Sparkles className="h-2.5 w-2.5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-semibold">Post a Request</h1>
                <p className="text-xs text-muted-foreground">Get proposals from verified vendors</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Start Over
              </Button>
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  My Requests
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Chat Area */}
          <div className="lg:col-span-2">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl overflow-hidden">
              {/* Progress Indicator */}
              <div className="border-b border-border/50 bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-2">
                  {[
                    { step: "gathering", label: "Describe", icon: MessageSquare },
                    { step: "published", label: "Published", icon: Megaphone },
                    { step: "proposals", label: "Proposals", icon: Users },
                    { step: "accepted", label: "Hired", icon: CheckCircle2 },
                  ].map((s, index) => {
                    const Icon = s.icon
                    const isActive = requestState.step === s.step
                    const isPast =
                      ["gathering", "published", "proposals", "accepted"].indexOf(requestState.step) >
                      ["gathering", "published", "proposals", "accepted"].indexOf(s.step)
                    return (
                      <React.Fragment key={s.step}>
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                              isActive && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                              isPast && "bg-green-500 text-white",
                              !isActive && !isPast && "bg-muted text-muted-foreground",
                            )}
                          >
                            {isPast ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                          </div>
                          <span
                            className={cn(
                              "text-xs font-medium hidden sm:block",
                              isActive && "text-primary",
                              isPast && "text-green-500",
                              !isActive && !isPast && "text-muted-foreground",
                            )}
                          >
                            {s.label}
                          </span>
                        </div>
                        {index < 3 && (
                          <div className={cn("h-0.5 flex-1 rounded-full", isPast ? "bg-green-500" : "bg-border")} />
                        )}
                      </React.Fragment>
                    )
                  })}
                </div>
              </div>

              {/* Chat Messages */}
              <ScrollArea className="h-[calc(100vh-380px)] min-h-[350px]">
                <div className="p-4 space-y-4">
                  <AnimatePresence initial={false}>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className={cn("flex gap-3", message.role === "user" ? "flex-row-reverse" : "flex-row")}>
                          <Avatar
                            className={cn(
                              "h-8 w-8 shrink-0",
                              message.role === "assistant" && "ring-2 ring-orange-500/20",
                            )}
                          >
                            {message.role === "assistant" ? (
                              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-500">
                                <Bot className="h-4 w-4 text-white" />
                              </AvatarFallback>
                            ) : (
                              <>
                                <AvatarImage src="/diverse-user-avatars.png" />
                                <AvatarFallback className="bg-muted">U</AvatarFallback>
                              </>
                            )}
                          </Avatar>

                          <div className={cn("flex flex-col gap-2 max-w-[85%]")}>
                            <div
                              className={cn(
                                "rounded-2xl px-4 py-3",
                                message.role === "user"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted/60 border border-border/50",
                              )}
                            >
                              {message.parts ? (
                                message.parts.map((part: any, idx: number) => {
                                  if (part.type === "text" && part.text) {
                                    return (
                                      <p key={idx} className="text-sm leading-relaxed whitespace-pre-wrap">
                                        {part.text}
                                      </p>
                                    )
                                  }
                                  return null
                                })
                              ) : (
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                              )}
                            </div>

                            {/* Request Published Card */}
                            {message.role === "assistant" &&
                              (message.content.includes("published") || message.content.includes("posted")) &&
                              requestState.step === "published" && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="mt-2"
                                >
                                  <Card className="border-green-500/50 bg-green-500/10 overflow-hidden">
                                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2">
                                      <div className="flex items-center gap-2 text-white">
                                        <CheckCircle2 className="h-5 w-5" />
                                        <span className="font-semibold">Request Published!</span>
                                      </div>
                                    </div>
                                    <CardContent className="p-4 space-y-3">
                                      <div className="flex items-center gap-3 text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                          <Bell className="h-4 w-4 text-orange-500" />
                                          <span>12 vendors notified</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                          <Clock className="h-4 w-4" />
                                          <span>Expires in 7 days</span>
                                        </div>
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        Vendors are being notified. You'll receive proposals soon!
                                      </p>
                                      <Button
                                        size="sm"
                                        className="w-full bg-green-600 hover:bg-green-700"
                                        onClick={() => sendMessage({ text: "Show me the proposals" })}
                                      >
                                        <Users className="mr-2 h-4 w-4" />
                                        View Proposals (3 received)
                                      </Button>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              )}

                            {/* Proposals List */}
                            {message.role === "assistant" &&
                              (message.content.includes("proposal") || message.content.includes("received")) &&
                              requestState.step === "proposals" && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="mt-2 space-y-2"
                                >
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Users className="h-3 w-3" />3 vendors sent proposals
                                  </p>
                                  {mockProposals.map((proposal) => (
                                    <ProposalCard
                                      key={proposal.id}
                                      proposal={proposal}
                                      onAccept={() => {
                                        setRequestState((prev) => ({
                                          ...prev,
                                          step: "accepted",
                                          acceptedProposal: {
                                            vendorName: proposal.vendorName,
                                            bookingId: `BK-${Date.now().toString(36).toUpperCase()}`,
                                          },
                                        }))
                                        sendMessage({ text: `I'd like to accept ${proposal.vendorName}'s proposal` })
                                      }}
                                      onAsk={() =>
                                        sendMessage({
                                          text: `I have a question for ${proposal.vendorName}`,
                                        })
                                      }
                                    />
                                  ))}
                                </motion.div>
                              )}

                            {/* Accepted Confirmation */}
                            {message.role === "assistant" &&
                              (message.content.includes("accepted") || message.content.includes("hired")) &&
                              requestState.step === "accepted" && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="mt-2"
                                >
                                  <Card className="border-primary/50 bg-primary/10 overflow-hidden">
                                    <div className="bg-gradient-to-r from-primary to-blue-600 px-4 py-3">
                                      <div className="flex items-center gap-2 text-white">
                                        <ThumbsUp className="h-5 w-5" />
                                        <span className="font-semibold">Vendor Hired!</span>
                                      </div>
                                    </div>
                                    <CardContent className="p-4 space-y-3">
                                      <div className="flex items-center gap-3">
                                        <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                                          <AvatarFallback className="bg-primary/20 text-primary">
                                            {requestState.acceptedProposal?.vendorName?.[0] || "V"}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-semibold">
                                            {requestState.acceptedProposal?.vendorName || "Vendor"}
                                          </p>
                                          <p className="text-xs text-muted-foreground">Will contact you shortly</p>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <Button size="sm" variant="outline" className="bg-transparent">
                                          <Phone className="mr-2 h-4 w-4" />
                                          Call Vendor
                                        </Button>
                                        <Button size="sm" variant="outline" className="bg-transparent">
                                          <MessageSquare className="mr-2 h-4 w-4" />
                                          Message
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {isLoading && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                      <Avatar className="h-8 w-8 ring-2 ring-orange-500/20">
                        <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-500">
                          <Bot className="h-4 w-4 text-white" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-2 rounded-2xl bg-muted/60 border border-border/50 px-4 py-3">
                        <div className="flex gap-1">
                          <span
                            className="h-2 w-2 animate-bounce rounded-full bg-orange-500/60"
                            style={{ animationDelay: "0ms" }}
                          />
                          <span
                            className="h-2 w-2 animate-bounce rounded-full bg-orange-500/60"
                            style={{ animationDelay: "150ms" }}
                          />
                          <span
                            className="h-2 w-2 animate-bounce rounded-full bg-orange-500/60"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Quick Suggestions */}
              {showSuggestions && messages.length <= 2 && (
                <div className="border-t border-border/50 bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground mb-3">Common requests:</p>
                  <div className="flex flex-wrap gap-2">
                    {quickRequests.map((request, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleQuickRequest(request.query)}
                        className="group flex items-center gap-2 rounded-full border border-border/50 bg-background px-3 py-2 text-sm transition-all hover:border-orange-500/50 hover:bg-orange-500/5"
                      >
                        <request.icon className="h-4 w-4 text-muted-foreground group-hover:text-orange-500 transition-colors" />
                        <span>{request.label}</span>
                        <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Uploaded Images Preview */}
              {uploadedImages.length > 0 && (
                <div className="border-t border-border/50 bg-muted/30 px-4 py-2">
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {uploadedImages.map((img, index) => (
                      <div key={index} className="relative shrink-0">
                        <Image
                          src={img || "/placeholder.svg"}
                          alt={`Upload ${index + 1}`}
                          width={60}
                          height={60}
                          className="rounded-lg object-cover"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="border-t border-border/50 p-4 bg-background/50">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-12 w-12 rounded-xl"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  </Button>
                  <div className="relative flex-1">
                    <Input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Describe what you need..."
                      className="pr-4 py-6 rounded-xl bg-muted/30 border-border/50 focus:border-orange-500/50"
                      disabled={isLoading}
                    />
                  </div>
                  <Button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isLoading}
                    className="h-12 w-12 rounded-xl shadow-lg shadow-orange-500/25 bg-gradient-to-br from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar - How It Works */}
          <div className="space-y-4">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-orange-500" />
                  How It Works
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      icon: MessageSquare,
                      title: "Describe Your Need",
                      description: "Tell us what you need done in your own words",
                    },
                    {
                      icon: Megaphone,
                      title: "We Publish & Alert",
                      description: "Your request is sent to matching verified vendors",
                    },
                    {
                      icon: Users,
                      title: "Receive Proposals",
                      description: "Vendors send you quotes and availability",
                    },
                    {
                      icon: ThumbsUp,
                      title: "Choose & Hire",
                      description: "Pick the best offer and we'll connect you",
                    },
                  ].map((step, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/10">
                        <step.icon className="h-4 w-4 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{step.title}</p>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  Your Guarantees
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span>All vendors are verified</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span>Free to post requests</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span>No obligation to hire</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span>Compare multiple quotes</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-amber-500/10">
              <CardContent className="p-4 text-center">
                <div className="flex justify-center mb-3">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <Avatar key={i} className="h-8 w-8 ring-2 ring-background">
                        <AvatarImage src={`/market-vendor.png?key=47whl&height=32&width=32&query=vendor${i}`} />
                        <AvatarFallback>V{i}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
                <p className="text-2xl font-bold text-orange-500">500+</p>
                <p className="text-sm text-muted-foreground">Verified vendors ready to help</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProposalCard({
  proposal,
  onAccept,
  onAsk,
}: {
  proposal: Proposal
  onAccept: () => void
  onAsk: () => void
}) {
  return (
    <Card className="border-border/50 bg-background/80 hover:border-primary/50 transition-all overflow-hidden">
      <CardContent className="p-3">
        <div className="flex gap-3">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={`/.jpg?key=wgtaq&height=48&width=48&query=${proposal.vendorName}`} />
            <AvatarFallback>{proposal.vendorName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm">{proposal.vendorName}</h4>
                  {proposal.verified && (
                    <Badge variant="secondary" className="h-5 text-[10px]">
                      <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" />
                      Verified
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {proposal.rating}
                  </span>
                  <span>({proposal.reviews} reviews)</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-primary text-lg">{proposal.price}</p>
                <p className="text-[10px] text-muted-foreground">{proposal.availability}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{proposal.message}</p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" className="flex-1 h-8" onClick={onAccept}>
                <ThumbsUp className="mr-1 h-3 w-3" />
                Accept
              </Button>
              <Button size="sm" variant="outline" className="flex-1 h-8 bg-transparent" onClick={onAsk}>
                <HelpCircle className="mr-1 h-3 w-3" />
                Ask Question
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
