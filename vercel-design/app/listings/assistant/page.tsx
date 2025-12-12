"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bot,
  Send,
  Sparkles,
  ImagePlus,
  X,
  Check,
  Loader2,
  DollarSign,
  MapPin,
  Tag,
  FileText,
  Eye,
  Wand2,
  CheckCircle2,
  Circle,
  ArrowRight,
  Camera,
  Zap,
  Star,
  Home,
  Heart,
  GraduationCap,
  PartyPopper,
  Monitor,
  Car,
  Shield,
  RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import Link from "next/link"

// Types for listing data
interface ListingData {
  title: string
  description: string
  shortDescription: string
  category: string
  subcategory: string
  pricingType: "fixed" | "hourly" | "package" | ""
  basePrice: number | null
  hourlyRate: number | null
  tags: string[]
  experience: string
  serviceArea: "local" | "regional" | "remote" | ""
  city: string
  availableDays: string[]
  startTime: string
  endTime: string
  images: { id: string; url: string; name: string }[]
}

const initialListingData: ListingData = {
  title: "",
  description: "",
  shortDescription: "",
  category: "",
  subcategory: "",
  pricingType: "",
  basePrice: null,
  hourlyRate: null,
  tags: [],
  experience: "",
  serviceArea: "",
  city: "",
  availableDays: [],
  startTime: "09:00",
  endTime: "17:00",
  images: [],
}

const categoryIcons: Record<string, typeof Home> = {
  "home-services": Home,
  "health-wellness": Heart,
  education: GraduationCap,
  events: PartyPopper,
  "tech-support": Monitor,
  automotive: Car,
  security: Shield,
}

const categoryNames: Record<string, string> = {
  "home-services": "Home Services",
  "health-wellness": "Health & Wellness",
  education: "Education",
  events: "Events",
  "tech-support": "Tech Support",
  automotive: "Automotive",
  security: "Security",
}

// Progress steps
const progressSteps = [
  { id: "service", label: "Service Info", icon: FileText },
  { id: "category", label: "Category", icon: Tag },
  { id: "pricing", label: "Pricing", icon: DollarSign },
  { id: "location", label: "Location", icon: MapPin },
  { id: "media", label: "Media", icon: Camera },
  { id: "review", label: "Review", icon: Eye },
]

export default function ListingAssistantPage() {
  const [listingData, setListingData] = useState<ListingData>(initialListingData)
  const [uploadedImages, setUploadedImages] = useState<{ id: string; url: string; name: string }[]>([])
  const [inputValue, setInputValue] = useState("")
  const [showPreview, setShowPreview] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/listing-assistant" }),
    onToolCall: ({ toolCall }) => {
      // Handle tool calls to update listing data
      if (toolCall.toolName === "updateListing" && toolCall.args) {
        const args = toolCall.args as Partial<ListingData>
        setListingData((prev) => ({
          ...prev,
          ...Object.fromEntries(Object.entries(args).filter(([_, v]) => v !== undefined && v !== null)),
        }))
      }
    },
  })

  const isLoading = status === "in_progress"

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Send initial greeting on mount
  useEffect(() => {
    if (messages.length === 0) {
      // Trigger the AI to send a greeting
      sendMessage({ text: "Hello, I want to create a new listing" })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Calculate progress
  const calculateProgress = useCallback(() => {
    let completed = 0
    const total = 6

    if (listingData.title || listingData.description) completed++
    if (listingData.category && listingData.subcategory) completed++
    if (listingData.pricingType && (listingData.basePrice || listingData.hourlyRate)) completed++
    if (listingData.city || listingData.serviceArea) completed++
    if (uploadedImages.length > 0 || listingData.images.length > 0) completed++
    if (completed >= 4) completed++ // Review step

    return Math.round((completed / total) * 100)
  }, [listingData, uploadedImages])

  const getStepStatus = (stepId: string): "complete" | "current" | "upcoming" => {
    switch (stepId) {
      case "service":
        if (listingData.title && listingData.description) return "complete"
        if (listingData.title || listingData.description) return "current"
        return messages.length > 0 ? "current" : "upcoming"
      case "category":
        if (listingData.category && listingData.subcategory) return "complete"
        if (listingData.title) return "current"
        return "upcoming"
      case "pricing":
        if (listingData.pricingType && (listingData.basePrice || listingData.hourlyRate)) return "complete"
        if (listingData.category) return "current"
        return "upcoming"
      case "location":
        if (listingData.city || listingData.serviceArea) return "complete"
        if (listingData.pricingType) return "current"
        return "upcoming"
      case "media":
        if (uploadedImages.length > 0) return "complete"
        if (listingData.city || listingData.serviceArea) return "current"
        return "upcoming"
      case "review":
        if (calculateProgress() >= 80) return "current"
        return "upcoming"
      default:
        return "upcoming"
    }
  }

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return
    sendMessage({ text: inputValue })
    setInputValue("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file)
      const newImage = { id: crypto.randomUUID(), url, name: file.name }
      setUploadedImages((prev) => [...prev, newImage])

      // Notify the AI about the image
      sendMessage({ text: `I've uploaded an image: ${file.name}` })
    })
  }

  const removeImage = (id: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id))
  }

  const handleReset = () => {
    setListingData(initialListingData)
    setUploadedImages([])
    setMessages([])
    // Restart conversation
    setTimeout(() => {
      sendMessage({ text: "Hello, I want to create a new listing" })
    }, 100)
  }

  const quickPrompts = [
    "I offer home cleaning services",
    "I'm a personal fitness trainer",
    "I do photography for events",
    "I repair computers and phones",
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
                <Wand2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">AI Listing Assistant</h1>
                <p className="text-xs text-muted-foreground">Create your listing in minutes</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Start Over
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="hidden md:flex"
              >
                <Eye className="mr-2 h-4 w-4" />
                {showPreview ? "Hide" : "Show"} Preview
              </Button>
              <Link href="/listings/new">
                <Button variant="outline" size="sm">
                  Manual Mode
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
          {/* Main Chat Area */}
          <div className="flex flex-col">
            {/* Progress Bar */}
            <Card className="mb-4 border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium">Listing Progress</span>
                  <span className="text-sm text-muted-foreground">{calculateProgress()}% Complete</span>
                </div>
                <Progress value={calculateProgress()} className="h-2 mb-4" />

                {/* Steps */}
                <div className="flex items-center justify-between">
                  {progressSteps.map((step, index) => {
                    const status = getStepStatus(step.id)
                    const StepIcon = step.icon
                    return (
                      <div key={step.id} className="flex flex-col items-center gap-1">
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                            status === "complete" && "bg-primary text-primary-foreground",
                            status === "current" && "bg-primary/20 text-primary ring-2 ring-primary/50",
                            status === "upcoming" && "bg-muted text-muted-foreground",
                          )}
                        >
                          {status === "complete" ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                        </div>
                        <span
                          className={cn(
                            "text-[10px] font-medium",
                            status === "complete" && "text-primary",
                            status === "current" && "text-foreground",
                            status === "upcoming" && "text-muted-foreground",
                          )}
                        >
                          {step.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Chat Container */}
            <Card className="flex flex-1 flex-col border-border/50 bg-card/50 backdrop-blur">
              {/* Messages */}
              <ScrollArea className="flex-1 p-4" style={{ height: "calc(100vh - 420px)" }}>
                <div className="space-y-4">
                  <AnimatePresence initial={false}>
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={cn("flex gap-3", message.role === "user" ? "flex-row-reverse" : "flex-row")}
                      >
                        {/* Avatar */}
                        <Avatar
                          className={cn("h-8 w-8 shrink-0", message.role === "assistant" && "ring-2 ring-primary/20")}
                        >
                          {message.role === "assistant" ? (
                            <>
                              <AvatarFallback className="bg-gradient-to-br from-primary to-accent">
                                <Bot className="h-4 w-4 text-white" />
                              </AvatarFallback>
                            </>
                          ) : (
                            <>
                              <AvatarImage src="/diverse-user-avatars.png" />
                              <AvatarFallback>U</AvatarFallback>
                            </>
                          )}
                        </Avatar>

                        {/* Message Bubble */}
                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl px-4 py-3",
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted/50 border border-border/50",
                          )}
                        >
                          {message.parts.map((part, partIndex) => {
                            if (part.type === "text") {
                              return (
                                <p key={partIndex} className="text-sm leading-relaxed whitespace-pre-wrap">
                                  {part.text}
                                </p>
                              )
                            }
                            // Handle tool results display
                            if (part.type === "tool-updateListing" && part.state === "output-available") {
                              return (
                                <div key={partIndex} className="mt-2 flex items-center gap-2 text-xs text-primary">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>Listing updated</span>
                                </div>
                              )
                            }
                            return null
                          })}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Loading indicator */}
                  {isLoading && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                      <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent">
                          <Bot className="h-4 w-4 text-white" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-2 rounded-2xl bg-muted/50 border border-border/50 px-4 py-3">
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

              {/* Quick Prompts (only show at start) */}
              {messages.length <= 2 && (
                <div className="border-t border-border/50 p-4">
                  <p className="mb-2 text-xs text-muted-foreground">Quick start:</p>
                  <div className="flex flex-wrap gap-2">
                    {quickPrompts.map((prompt, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="h-auto py-1.5 text-xs bg-transparent"
                        onClick={() => {
                          setInputValue(prompt)
                        }}
                      >
                        <Zap className="mr-1.5 h-3 w-3 text-primary" />
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Uploaded Images Preview */}
              {uploadedImages.length > 0 && (
                <div className="border-t border-border/50 p-4">
                  <p className="mb-2 text-xs text-muted-foreground">Uploaded images:</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {uploadedImages.map((img) => (
                      <div key={img.id} className="relative shrink-0">
                        <img
                          src={img.url || "/placeholder.svg"}
                          alt={img.name}
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                        <button
                          onClick={() => removeImage(img.id)}
                          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="border-t border-border/50 p-4">
                <div className="flex items-end gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Tell me about your service..."
                      className="pr-24 py-6 rounded-xl bg-muted/30 border-border/50"
                      disabled={isLoading}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImagePlus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isLoading}
                    className="h-12 w-12 rounded-xl"
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </Button>
                </div>
                <p className="mt-2 text-center text-[10px] text-muted-foreground">
                  AI assistant powered by Claude. Your data is processed securely.
                </p>
              </div>
            </Card>
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <Card className="border-border/50 bg-card/50 backdrop-blur overflow-hidden">
                  <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/10 to-accent/10 pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Eye className="h-4 w-4 text-primary" />
                        Live Preview
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px]">
                        Auto-updating
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {/* Preview Card */}
                    <div className="p-4">
                      {/* Service Image */}
                      <div className="relative aspect-video rounded-lg bg-muted/50 overflow-hidden mb-4">
                        {uploadedImages.length > 0 ? (
                          <img
                            src={uploadedImages[0].url || "/placeholder.svg"}
                            alt="Service preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <div className="text-center">
                              <Camera className="mx-auto h-8 w-8 text-muted-foreground/50" />
                              <p className="mt-2 text-xs text-muted-foreground">Upload images to preview</p>
                            </div>
                          </div>
                        )}
                        {listingData.category && (
                          <Badge className="absolute left-2 top-2 bg-background/80 backdrop-blur text-xs">
                            {categoryNames[listingData.category] || listingData.category}
                          </Badge>
                        )}
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-2 mb-4">
                        {listingData.title ? (
                          <h3 className="font-semibold text-lg leading-tight">{listingData.title}</h3>
                        ) : (
                          <div className="h-6 w-3/4 rounded bg-muted/50 animate-pulse" />
                        )}
                        {listingData.shortDescription ? (
                          <p className="text-sm text-muted-foreground">{listingData.shortDescription}</p>
                        ) : listingData.description ? (
                          <p className="text-sm text-muted-foreground line-clamp-2">{listingData.description}</p>
                        ) : (
                          <div className="space-y-1">
                            <div className="h-4 w-full rounded bg-muted/50 animate-pulse" />
                            <div className="h-4 w-2/3 rounded bg-muted/50 animate-pulse" />
                          </div>
                        )}
                      </div>

                      <Separator className="my-4" />

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {/* Pricing */}
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                            <DollarSign className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">Pricing</p>
                            {listingData.basePrice ? (
                              <p className="font-medium">${listingData.basePrice}</p>
                            ) : listingData.hourlyRate ? (
                              <p className="font-medium">${listingData.hourlyRate}/hr</p>
                            ) : (
                              <p className="text-muted-foreground">Not set</p>
                            )}
                          </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                            <MapPin className="h-4 w-4 text-accent" />
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">Location</p>
                            {listingData.city ? (
                              <p className="font-medium">{listingData.city}</p>
                            ) : listingData.serviceArea ? (
                              <p className="font-medium capitalize">{listingData.serviceArea}</p>
                            ) : (
                              <p className="text-muted-foreground">Not set</p>
                            )}
                          </div>
                        </div>

                        {/* Category */}
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                            {listingData.category ? (
                              (() => {
                                const CategoryIcon = categoryIcons[listingData.category] || Tag
                                return <CategoryIcon className="h-4 w-4 text-foreground" />
                              })()
                            ) : (
                              <Tag className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">Category</p>
                            {listingData.subcategory ? (
                              <p className="font-medium">{listingData.subcategory}</p>
                            ) : listingData.category ? (
                              <p className="font-medium">{categoryNames[listingData.category]}</p>
                            ) : (
                              <p className="text-muted-foreground">Not set</p>
                            )}
                          </div>
                        </div>

                        {/* Experience */}
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                            <Star className="h-4 w-4 text-yellow-500" />
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">Experience</p>
                            {listingData.experience ? (
                              <p className="font-medium">{listingData.experience}</p>
                            ) : (
                              <p className="text-muted-foreground">Not set</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Tags */}
                      {listingData.tags.length > 0 && (
                        <div className="mt-4">
                          <p className="mb-2 text-[10px] text-muted-foreground">Tags</p>
                          <div className="flex flex-wrap gap-1">
                            {listingData.tags.slice(0, 5).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-[10px]">
                                {tag}
                              </Badge>
                            ))}
                            {listingData.tags.length > 5 && (
                              <Badge variant="outline" className="text-[10px]">
                                +{listingData.tags.length - 5}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Completion Status */}
                    <div className="border-t border-border/50 p-4 bg-muted/20">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium">Completion Status</span>
                        <span className="text-xs text-primary font-semibold">{calculateProgress()}%</span>
                      </div>
                      <div className="space-y-2">
                        {[
                          { label: "Service Info", done: !!listingData.title && !!listingData.description },
                          { label: "Category", done: !!listingData.category && !!listingData.subcategory },
                          {
                            label: "Pricing",
                            done: !!listingData.pricingType && (!!listingData.basePrice || !!listingData.hourlyRate),
                          },
                          { label: "Location", done: !!listingData.city || !!listingData.serviceArea },
                          { label: "Media", done: uploadedImages.length > 0 },
                        ].map((item, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            {item.done ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span className={item.done ? "text-foreground" : "text-muted-foreground"}>
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-4 border-t border-border/50">
                      <Button className="w-full" disabled={calculateProgress() < 60}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        {calculateProgress() >= 60 ? "Publish Listing" : "Complete More Info"}
                      </Button>
                      <p className="mt-2 text-center text-[10px] text-muted-foreground">
                        {calculateProgress() >= 60
                          ? "Your listing is ready to publish!"
                          : `Add more details to publish (${60 - calculateProgress()}% more needed)`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
