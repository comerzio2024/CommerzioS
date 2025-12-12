"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Shield,
  Star,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  Home,
  ClipboardList,
  Bot,
  ChevronRight,
  Zap,
  Clock,
  Users,
  Building2,
  Briefcase,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface OnboardingTutorialProps {
  onComplete: () => void
  onSkip: () => void
}

const tutorialSteps = [
  {
    id: "welcome",
    title: "Welcome to Commerzio",
    subtitle: "Switzerland's Trusted Service Marketplace",
    description:
      "Connect with verified local service providers for all your needs. Let us show you around in just 60 seconds.",
    icon: Sparkles,
    color: "from-primary to-accent",
    features: [
      { icon: Shield, text: "Secure escrow payments" },
      { icon: Star, text: "Verified reviews only" },
      { icon: Clock, text: "24h average response" },
    ],
  },
  {
    id: "find-services",
    title: "Find Services Easily",
    subtitle: "Search, Browse, or Ask AI",
    description: "Three powerful ways to find exactly what you need:",
    icon: Search,
    color: "from-primary to-accent",
    options: [
      {
        icon: Search,
        title: "Search Bar",
        description: "Type what you need and filter by location, price, and ratings",
      },
      {
        icon: Home,
        title: "Browse Categories",
        description: "Explore 50+ service categories from home repair to wellness",
      },
      {
        icon: Bot,
        title: "AI Assistant",
        description: "Just describe your problem - our AI finds the perfect match",
      },
    ],
  },
  {
    id: "ai-assistant",
    title: "Meet Your AI Assistant",
    subtitle: "The Easiest Way to Get Things Done",
    description: "Simply chat with our AI to find, compare, and book services. No forms, no hassle.",
    icon: Bot,
    color: "from-accent to-success",
    chatDemo: [
      { role: "user", message: "I need someone to fix a leaky faucet in my kitchen" },
      { role: "assistant", message: "I found 12 verified plumbers near you. What's your budget range?" },
      { role: "user", message: "Around 100-150 CHF" },
      { role: "assistant", message: "Great! Here are 3 top-rated plumbers available this week..." },
    ],
  },
  {
    id: "booking",
    title: "Book with Confidence",
    subtitle: "Secure Escrow Protection",
    description: "Your payment is protected until the job is done right.",
    icon: CreditCard,
    color: "from-success to-primary",
    steps: [
      { number: 1, title: "Choose Provider", description: "Compare quotes, reviews & availability" },
      { number: 2, title: "Pay Securely", description: "Funds held in escrow protection" },
      { number: 3, title: "Service Delivered", description: "Provider completes the work" },
      { number: 4, title: "Release Payment", description: "Approve & rate your experience" },
    ],
  },
  {
    id: "vendors",
    title: "Are You a Service Provider?",
    subtitle: "Grow Your Business with Commerzio",
    description: "Join 5,000+ verified vendors and reach new customers effortlessly.",
    icon: Briefcase,
    color: "from-primary to-accent",
    benefits: [
      { icon: Users, title: "50K+ Customers", description: "Active user base looking for services" },
      { icon: Bot, title: "AI Listing Creator", description: "Create listings just by chatting" },
      { icon: CreditCard, title: "Guaranteed Payments", description: "Get paid securely, every time" },
      { icon: Zap, title: "Instant Leads", description: "Get notified of matching requests" },
    ],
  },
  {
    id: "get-started",
    title: "You're All Set!",
    subtitle: "Start Exploring Commerzio",
    description: "Choose how you'd like to begin your journey:",
    icon: CheckCircle2,
    color: "from-success to-primary",
    actions: [
      { icon: Search, title: "Find a Service", description: "Browse local providers", href: "/services" },
      { icon: Bot, title: "Chat with AI", description: "Get personalized help", href: "/book/assistant" },
      {
        icon: ClipboardList,
        title: "Post a Request",
        description: "Let vendors come to you",
        href: "/request/assistant",
      },
      { icon: Building2, title: "Become a Vendor", description: "List your services", href: "/listings/assistant" },
    ],
  },
]

export function OnboardingTutorial({ onComplete, onSkip }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    setIsExiting(true)
    setTimeout(() => {
      onComplete()
    }, 300)
  }

  const handleSkip = () => {
    setIsExiting(true)
    setTimeout(() => {
      onSkip()
    }, 300)
  }

  const step = tutorialSteps[currentStep]
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100
  const StepIcon = step.icon

  return (
    <div
      className={cn(
        "fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-500",
        isVisible && !isExiting ? "opacity-100" : "opacity-0",
      )}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/95 backdrop-blur-md" onClick={handleSkip} />

      {/* Tutorial Card */}
      <Card
        className={cn(
          "relative w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border-2 transition-all duration-500",
          isVisible && !isExiting ? "scale-100 translate-y-0" : "scale-95 translate-y-8",
        )}
      >
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10 group"
        >
          <X className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>

        {/* Step indicators */}
        <div className="absolute top-4 left-4 flex items-center gap-1.5 z-10">
          {tutorialSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentStep
                  ? "w-6 bg-primary"
                  : index < currentStep
                    ? "w-2 bg-primary/60"
                    : "w-2 bg-muted-foreground/30",
              )}
            />
          ))}
        </div>

        <CardContent className="p-0 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Header with gradient */}
          <div className={cn("relative px-8 pt-16 pb-8 bg-gradient-to-br", step.color)}>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:20px_20px]" />
            <div className="relative text-center text-white">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <StepIcon className="h-8 w-8" />
              </div>
              <Badge className="mb-3 bg-white/20 text-white border-white/30 hover:bg-white/30">
                Step {currentStep + 1} of {tutorialSteps.length}
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">{step.title}</h2>
              <p className="text-white/90 text-lg">{step.subtitle}</p>
            </div>
          </div>

          {/* Content area */}
          <div className="p-8">
            <p className="text-center text-muted-foreground mb-8">{step.description}</p>

            {/* Welcome step - features */}
            {step.id === "welcome" && step.features && (
              <div className="flex flex-wrap justify-center gap-4 mb-6">
                {step.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border">
                    <feature.icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{feature.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Find services step - options */}
            {step.id === "find-services" && step.options && (
              <div className="grid gap-4">
                {step.options.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <option.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{option.title}</h4>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto self-center opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            )}

            {/* AI Assistant step - chat demo */}
            {step.id === "ai-assistant" && step.chatDemo && (
              <div className="bg-muted/30 rounded-2xl border p-4 space-y-3">
                {step.chatDemo.map((chat, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex animate-in fade-in slide-in-from-bottom-2",
                      chat.role === "user" ? "justify-end" : "justify-start",
                    )}
                    style={{ animationDelay: `${index * 200}ms`, animationFillMode: "both" }}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] px-4 py-2.5 rounded-2xl text-sm",
                        chat.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-card border rounded-bl-md",
                      )}
                    >
                      {chat.message}
                    </div>
                  </div>
                ))}
                <div className="flex justify-center pt-2">
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    Live AI Demo
                  </Badge>
                </div>
              </div>
            )}

            {/* Booking step - process steps */}
            {step.id === "booking" && step.steps && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {step.steps.map((processStep, index) => (
                  <div key={index} className="relative text-center group">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-success to-primary text-white flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
                      {processStep.number}
                    </div>
                    <h4 className="font-semibold text-sm mb-1">{processStep.title}</h4>
                    <p className="text-xs text-muted-foreground">{processStep.description}</p>
                    {index < step.steps.length - 1 && (
                      <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-px bg-gradient-to-r from-border to-transparent" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Vendors step - benefits */}
            {step.id === "vendors" && step.benefits && (
              <div className="grid grid-cols-2 gap-4">
                {step.benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-muted/30 border hover:border-primary/50 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <benefit.icon className="h-5 w-5" />
                    </div>
                    <h4 className="font-semibold text-sm mb-1">{benefit.title}</h4>
                    <p className="text-xs text-muted-foreground">{benefit.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Get started step - actions */}
            {step.id === "get-started" && step.actions && (
              <div className="grid grid-cols-2 gap-4">
                {step.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={handleComplete}
                    className="p-4 rounded-xl bg-muted/30 border hover:border-primary hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <action.icon className="h-5 w-5" />
                    </div>
                    <h4 className="font-semibold text-sm mb-1">{action.title}</h4>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="px-8 pb-8 flex items-center justify-between gap-4">
            <Button variant="ghost" onClick={handlePrev} disabled={currentStep === 0} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
                Skip Tutorial
              </Button>
              <Button
                onClick={handleNext}
                className="gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 min-w-[120px]"
              >
                {currentStep === tutorialSteps.length - 1 ? (
                  <>
                    Get Started
                    <Sparkles className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
