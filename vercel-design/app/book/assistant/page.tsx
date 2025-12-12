"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bot,
  Send,
  Sparkles,
  Loader2,
  MapPin,
  Star,
  Clock,
  Phone,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Search,
  Zap,
  Shield,
  MessageCircle,
  ChevronRight,
  Home,
  Wrench,
  GraduationCap,
  Camera,
  Monitor,
  Dumbbell,
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

// Types for booking flow
interface BookingState {
  step: "searching" | "selecting" | "booking" | "confirmed"
  criteria: {
    service?: string
    budget?: string
    location?: string
    radius?: string
  }
  selectedProvider?: Provider
  booking?: {
    date: string
    time: string
    name: string
    phone: string
    confirmationNumber: string
  }
}

interface Provider {
  id: string
  name: string
  service: string
  rating: number
  distance: number
  availability: string[]
  image: string
  verified: boolean
  price: string
}

const initialBookingState: BookingState = {
  step: "searching",
  criteria: {},
}

// Quick service suggestions
const quickServices = [
  { icon: Home, label: "House Cleaning", query: "I need house cleaning" },
  { icon: Wrench, label: "Plumber", query: "I need a plumber" },
  { icon: Dumbbell, label: "Personal Trainer", query: "Looking for a personal trainer" },
  { icon: GraduationCap, label: "Tutor", query: "I need a tutor" },
  { icon: Camera, label: "Photographer", query: "Need a photographer" },
  { icon: Monitor, label: "Tech Support", query: "Computer repair help" },
]

export default function BookingAssistantPage() {
  const [bookingState, setBookingState] = useState<BookingState>(initialBookingState)
  const [inputValue, setInputValue] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/booking-assistant" }),
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hi there! I'm your booking assistant. Tell me what service you're looking for, and I'll help you find and book the perfect provider in just a few messages. What do you need help with today?",
      },
    ],
    onToolCall: ({ toolCall }) => {
      if (toolCall.toolName === "searchServices") {
        setBookingState((prev) => ({ ...prev, step: "selecting" }))
      }
      if (toolCall.toolName === "createBooking") {
        setBookingState((prev) => ({ ...prev, step: "confirmed" }))
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

  const handleQuickService = async (query: string) => {
    setShowSuggestions(false)
    setInputValue("")
    sendMessage({ text: query })
  }

  const handleProviderSelect = (provider: Provider) => {
    setBookingState((prev) => ({ ...prev, selectedProvider: provider }))
    sendMessage({ text: `I'd like to book with ${provider.name}` })
  }

  const handleTimeSelect = (slot: string) => {
    sendMessage({ text: `I'll take the ${slot} slot` })
  }

  const providers = [
    {
      id: "1",
      name: "Provider A",
      service: "House Cleaning",
      rating: 4.5,
      distance: 2,
      availability: ["10:00 AM", "12:00 PM", "2:00 PM"],
      image: "/placeholder.svg",
      verified: true,
      price: "$50/hr",
    },
    {
      id: "2",
      name: "Provider B",
      service: "Plumber",
      rating: 4.7,
      distance: 5,
      availability: ["11:00 AM", "1:00 PM", "3:00 PM"],
      image: "/placeholder.svg",
      verified: false,
      price: "$75/hr",
    },
    {
      id: "3",
      name: "Provider C",
      service: "Personal Trainer",
      rating: 4.3,
      distance: 3,
      availability: ["10:30 AM", "12:30 PM", "2:30 PM"],
      image: "/placeholder.svg",
      verified: true,
      price: "$60/hr",
    },
  ]

  const handleReset = () => {
    setBookingState(initialBookingState)
    setShowSuggestions(true)
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        content: "Starting fresh! What service can I help you find today?",
      },
    ])
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-accent shadow-lg shadow-primary/25">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 ring-2 ring-background">
                  <Sparkles className="h-2.5 w-2.5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-semibold">Booking Assistant</h1>
                <p className="text-xs text-muted-foreground">Find & book services instantly</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Start Over
              </Button>
              <Link href="/services">
                <Button variant="outline" size="sm">
                  Browse Services
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="mx-auto max-w-4xl">
          {/* Main Chat Card */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl overflow-hidden">
            {/* Chat Messages */}
            <ScrollArea className="h-[calc(100vh-280px)] min-h-[400px]">
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
                      {/* Message Row */}
                      <div className={cn("flex gap-3", message.role === "user" ? "flex-row-reverse" : "flex-row")}>
                        {/* Avatar */}
                        <Avatar
                          className={cn("h-8 w-8 shrink-0", message.role === "assistant" && "ring-2 ring-primary/20")}
                        >
                          {message.role === "assistant" ? (
                            <AvatarFallback className="bg-gradient-to-br from-primary to-accent">
                              <Bot className="h-4 w-4 text-white" />
                            </AvatarFallback>
                          ) : (
                            <>
                              <AvatarImage src="/diverse-user-avatars.png" />
                              <AvatarFallback className="bg-muted">U</AvatarFallback>
                            </>
                          )}
                        </Avatar>

                        {/* Message Content */}
                        <div className={cn("flex flex-col gap-2 max-w-[85%]")}>
                          {/* Text Bubble */}
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

                          {/* Tool Results - Provider Cards */}
                          {message.role === "assistant" &&
                            message.content.includes("found") &&
                            bookingState.step === "selecting" && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mt-2 space-y-2"
                              >
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Search className="h-3 w-3" />
                                  Found providers based on your criteria
                                </p>
                                <div className="grid gap-2">
                                  {providers.map((provider) => (
                                    <ProviderCard
                                      key={provider.id}
                                      provider={provider}
                                      onSelect={() => handleProviderSelect(provider)}
                                    />
                                  ))}
                                </div>
                              </motion.div>
                            )}

                          {/* Availability Results */}
                          {message.role === "assistant" &&
                            message.content.includes("available") &&
                            bookingState.selectedProvider && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mt-2"
                              >
                                <Card className="border-border/50 bg-background/50">
                                  <CardContent className="p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Calendar className="h-4 w-4 text-primary" />
                                      <span className="text-sm font-medium">Available times for your selection</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {bookingState.selectedProvider.availability.map((slot: string) => (
                                        <Button
                                          key={slot}
                                          variant="outline"
                                          size="sm"
                                          className="text-xs bg-transparent"
                                          onClick={() => handleTimeSelect(slot)}
                                        >
                                          <Clock className="mr-1 h-3 w-3" />
                                          {slot}
                                        </Button>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            )}

                          {/* Booking Confirmation */}
                          {message.role === "assistant" &&
                            message.content.includes("confirmed") &&
                            bookingState.booking && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mt-2"
                              >
                                <Card className="border-green-500/50 bg-green-500/10 overflow-hidden">
                                  <div className="bg-green-500 px-4 py-2">
                                    <div className="flex items-center gap-2 text-white">
                                      <CheckCircle2 className="h-5 w-5" />
                                      <span className="font-semibold">Booking Confirmed!</span>
                                    </div>
                                  </div>
                                  <CardContent className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-muted-foreground">Confirmation #</span>
                                      <Badge variant="secondary" className="font-mono">
                                        {bookingState.booking.confirmationNumber}
                                      </Badge>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Provider</span>
                                        <span className="font-medium">{bookingState.booking.name}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Service</span>
                                        <span>{bookingState.selectedProvider?.service}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Date & Time</span>
                                        <span>
                                          {bookingState.booking.date} at {bookingState.booking.time}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Price</span>
                                        <span className="text-primary font-semibold">
                                          {bookingState.selectedProvider?.price}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="pt-2 border-t border-border/50 flex gap-2">
                                      <Button size="sm" className="flex-1">
                                        <Calendar className="mr-2 h-4 w-4" />
                                        Add to Calendar
                                      </Button>
                                      <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                                        <Phone className="mr-2 h-4 w-4" />
                                        Contact Provider
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            )}

                          {message.role === "assistant" &&
                            message.content.includes("found") &&
                            bookingState.step === "selecting" && (
                              <div className="mt-3 grid gap-2">
                                {providers.slice(0, 3).map((provider) => (
                                  <Card
                                    key={provider.id}
                                    className="cursor-pointer overflow-hidden transition-all hover:shadow-md hover:ring-1 hover:ring-primary/50"
                                    onClick={() => handleProviderSelect(provider)}
                                  >
                                    <CardContent className="p-3">
                                      <div className="flex gap-3">
                                        <Avatar className="h-12 w-12 rounded-lg">
                                          <AvatarImage src={provider.image || "/placeholder.svg"} />
                                          <AvatarFallback>{provider.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                          <div className="flex items-start justify-between">
                                            <div>
                                              <h4 className="font-medium">{provider.name}</h4>
                                              <p className="text-xs text-muted-foreground">{provider.service}</p>
                                            </div>
                                            <Badge variant="secondary" className="text-xs">
                                              {provider.price}
                                            </Badge>
                                          </div>
                                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                              {provider.rating}
                                            </div>
                                            <span>•</span>
                                            <div className="flex items-center gap-1">
                                              <MapPin className="h-3 w-3" />
                                              {provider.distance}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            )}

                          {message.role === "assistant" &&
                            message.content.includes("available") &&
                            bookingState.selectedProvider && (
                              <div className="mt-3">
                                <p className="mb-2 text-xs text-muted-foreground">Available times:</p>
                                <div className="flex flex-wrap gap-2">
                                  {bookingState.selectedProvider.availability.map((slot) => (
                                    <Button
                                      key={slot}
                                      variant="outline"
                                      size="sm"
                                      className="h-8 text-xs bg-transparent"
                                      onClick={() => handleTimeSelect(slot)}
                                    >
                                      <Clock className="mr-1 h-3 w-3" />
                                      {slot}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Loading Indicator */}
                {isLoading && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                    <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60">
                        <Bot className="h-4 w-4 text-white" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2 rounded-2xl bg-muted/60 border border-border/50 px-4 py-3">
                      <div className="flex gap-1">
                        <span
                          className="h-2 w-2 animate-bounce rounded-full bg-primary/60"
                          style={{ animationDelay: "0ms" }}
                        />
                        <span
                          className="h-2 w-2 animate-bounce rounded-full bg-primary/60"
                          style={{ animationDelay: "150ms" }}
                        />
                        <span
                          className="h-2 w-2 animate-bounce rounded-full bg-primary/60"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Quick Service Suggestions */}
            {showSuggestions && messages.length <= 2 && (
              <div className="border-t border-border/50 bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground mb-3">Popular services:</p>
                <div className="flex flex-wrap gap-2">
                  {quickServices.map((service, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleQuickService(service.query)}
                      className="group flex items-center gap-2 rounded-full border border-border/50 bg-background px-3 py-2 text-sm transition-all hover:border-primary/50 hover:bg-primary/5"
                    >
                      <service.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span>{service.label}</span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t border-border/50 p-4 bg-background/50">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Tell me what you need..."
                    className="pr-4 py-6 rounded-xl bg-muted/30 border-border/50 focus:border-primary/50"
                    disabled={isLoading}
                  />
                </div>
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  className="h-12 w-12 rounded-xl shadow-lg shadow-primary/25"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
              </div>
              <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Secure booking
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Instant confirmation
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Verified providers
                </span>
              </div>
            </div>
          </Card>

          {/* Trust Badges */}
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="font-medium text-foreground">10,000+</p>
                <p>Bookings made</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Star className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">4.9 avg</p>
                <p>Customer rating</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10">
                <Shield className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="font-medium text-foreground">100%</p>
                <p>Verified pros</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Provider Card Component
function ProviderCard({
  provider,
  onSelect,
}: {
  provider: Provider
  onSelect: () => void
}) {
  return (
    <Card
      className="group border-border/50 bg-background/80 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer overflow-hidden"
      onClick={onSelect}
    >
      <CardContent className="p-0">
        <div className="flex gap-3 p-3">
          {/* Provider Image */}
          <div className="relative h-20 w-20 shrink-0 rounded-lg overflow-hidden">
            <Image src={provider.image || "/placeholder.svg"} alt={provider.name} fill className="object-cover" />
            {provider.verified && (
              <div className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                <CheckCircle2 className="h-3 w-3 text-white" />
              </div>
            )}
          </div>

          {/* Provider Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                  {provider.name}
                </h4>
                <p className="text-xs text-muted-foreground">{provider.service}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-primary">{provider.price}</p>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="font-medium text-foreground">{provider.rating}</span>
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {provider.distance} mi
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <Badge variant="secondary" className="text-[10px] h-5">
                <Clock className="mr-1 h-2.5 w-2.5" />
                {provider.availability[0]}
              </Badge>
              <Button size="sm" variant="ghost" className="h-6 text-xs text-primary hover:text-primary">
                Book Now
                <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
