"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Clock,
  CreditCard,
  Shield,
  AlertCircle,
  CheckCircle2,
  Calendar,
  MapPin,
  Star,
  ArrowLeft,
  ChevronRight,
  Phone,
  MessageSquare,
  Smartphone,
  Banknote,
  CalendarClock,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Types
interface BookingFormData {
  // Step 1: Date & Time
  startDate: Date | null
  startTime: string
  endDate: Date | null
  endTime: string
  // Step 2: Details
  phoneNumber: string
  serviceAddress: string
  messageToVendor: string
  // Step 3: Payment
  paymentMethod: "card" | "twint" | "cash"
  // Pricing
  selectedPackage?: PricingPackage
}

interface PricingPackage {
  id: string
  name: string
  description: string
  pricePerHour: number
  pricePerDay?: number
  features: string[]
}

interface PricingBreakdown {
  hours: number
  days: number
  baseCost: number
  platformFee: number
  total: number
  isLoading: boolean
}

interface Service {
  id: string
  title: string
  vendorName: string
  vendorAvatar: string
  vendorVerified: boolean
  rating: number
  reviewCount: number
  basePrice: number
  priceUnit: "hour" | "day"
  thumbnail: string
  acceptCardPayments: boolean
  acceptTwintPayments: boolean
  acceptCashPayments: boolean
  packages: PricingPackage[]
}

// Mock service data (in real app, fetch from API)
const mockService: Service = {
  id: "1",
  title: "Professional Home Cleaning Service",
  vendorName: "Swiss Clean Pro",
  vendorAvatar: "/placeholder.svg",
  vendorVerified: true,
  rating: 4.9,
  reviewCount: 234,
  basePrice: 45,
  priceUnit: "hour",
  thumbnail: "/modern-clean-interior.png",
  acceptCardPayments: true,
  acceptTwintPayments: true,
  acceptCashPayments: true,
  packages: [
    {
      id: "standard",
      name: "Standard Cleaning",
      description: "Perfect for regular maintenance",
      pricePerHour: 45,
      features: ["Basic cleaning tasks", "Eco-friendly products", "2 hour minimum"],
    },
    {
      id: "deep",
      name: "Deep Cleaning",
      description: "Comprehensive cleaning service",
      pricePerHour: 65,
      features: ["All standard tasks", "Cabinet cleaning", "Behind furniture", "3 hour minimum"],
    },
  ],
}

// Initial form state
const initialFormData: BookingFormData = {
  startDate: null,
  startTime: "",
  endDate: null,
  endTime: "",
  phoneNumber: "",
  serviceAddress: "",
  messageToVendor: "",
  paymentMethod: "card",
  selectedPackage: undefined,
}

// Date/Time helper functions
function formatDate(date: Date | null): string {
  if (!date) return ""
  return date.toLocaleDateString("en-CH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatDuration(hours: number): string {
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? "s" : ""}`
  }
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  if (remainingHours === 0) {
    return `${days} day${days !== 1 ? "s" : ""}`
  }
  return `${days} day${days !== 1 ? "s" : ""}, ${remainingHours} hour${remainingHours !== 1 ? "s" : ""}`
}

const QUICK_SELECT_DURATIONS = [
  { label: "1h", hours: 1 },
  { label: "2h", hours: 2 },
  { label: "4h", hours: 4 },
  { label: "8h", hours: 8 },
  { label: "1 day", hours: 24 },
  { label: "3 days", hours: 72 },
  { label: "1 week", hours: 168 },
]

function StepIndicator({
  currentStep,
  steps,
}: {
  currentStep: number
  steps: { num: number; label: string }[]
}) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 transition-all shadow-sm",
                currentStep >= s.num
                  ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-md"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {currentStep > s.num ? <CheckCircle2 className="h-5 w-5" /> : s.num}
            </div>
            <span
              className={cn(
                "text-sm font-medium text-center transition-colors",
                currentStep >= s.num ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                "h-px flex-1 transition-all",
                currentStep > s.num ? "bg-gradient-to-r from-blue-500 to-purple-600" : "bg-muted",
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// Step 1: Date & Time Selection
function DateTimeStep({
  formData,
  onUpdate,
}: {
  formData: BookingFormData
  onUpdate: (data: Partial<BookingFormData>) => void
}) {
  const timeSlots = [
    "07:00",
    "07:30",
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
    "20:00",
    "20:30",
    "21:00",
  ]

  const [currentMonth, setCurrentMonth] = useState(new Date())

  const availableDates = Array.from({ length: 28 }, (_, i) => {
    const date = new Date(currentMonth)
    date.setDate(date.getDate() + i)
    return date
  })

  const handleQuickSelect = (hours: number) => {
    let start: Date

    // If start date and time already selected, use that as base
    if (formData.startDate && formData.startTime) {
      start = new Date(formData.startDate)
      const [sh, sm] = formData.startTime.split(":").map(Number)
      start.setHours(sh, sm, 0, 0)
    } else {
      // Otherwise default to tomorrow at 9 AM
      const now = new Date()
      start = new Date(now)
      start.setDate(start.getDate() + 1)
      start.setHours(9, 0, 0, 0)
    }

    const end = new Date(start)
    end.setHours(end.getHours() + hours)

    onUpdate({
      startDate: start,
      startTime: `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`,
      endDate: end,
      endTime: `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`,
    })
  }

  const goToNextMonth = () => {
    const next = new Date(currentMonth)
    next.setMonth(next.getMonth() + 1)
    setCurrentMonth(next)
  }

  const goToPreviousMonth = () => {
    const prev = new Date(currentMonth)
    prev.setMonth(prev.getMonth() - 1)
    // Don't go before current month
    const today = new Date()
    if (prev >= new Date(today.getFullYear(), today.getMonth(), 1)) {
      setCurrentMonth(prev)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-blue-600" />
          Select Date & Time
        </CardTitle>
        <p className="text-sm text-gray-600">Choose when you'd like the service to start and end</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <Label className="text-base font-semibold">Quick Select Duration</Label>
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
              Popular
            </Badge>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {QUICK_SELECT_DURATIONS.map((duration) => (
              <Button
                key={duration.label}
                variant="outline"
                size="sm"
                className="h-auto py-3 flex flex-col gap-1 bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-200 hover:border-blue-300 transition-all"
                onClick={() => handleQuickSelect(duration.hours)}
              >
                <Zap className="h-3 w-3 text-amber-500" />
                <span className="font-bold text-sm text-gray-800">{duration.label}</span>
              </Button>
            ))}
          </div>
          <p className="text-xs text-gray-600">
            {formData.startDate && formData.startTime
              ? "Add duration from your selected start time"
              : "Set start to tomorrow at 9 AM with chosen duration"}
          </p>
        </div>

        <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Start Date/Time */}
        <div className="space-y-4">
          <Label className="text-base font-semibold text-emerald-700">Start Date & Time</Label>

          <div>
            <div className="flex items-center justify-between mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
                disabled={
                  currentMonth.getMonth() === new Date().getMonth() &&
                  currentMonth.getFullYear() === new Date().getFullYear()
                }
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Label className="text-sm font-semibold">
                {currentMonth.toLocaleDateString("en-CH", { month: "long", year: "numeric" })}
              </Label>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {availableDates.map((date) => {
                const isSelected = formData.startDate?.toDateString() === date.toDateString()
                const isPast = date < new Date(new Date().setHours(0, 0, 0, 0))
                return (
                  <Button
                    key={date.toISOString()}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    disabled={isPast}
                    className={cn(
                      "flex flex-col h-auto py-2 transition-all",
                      !isSelected && "bg-transparent hover:bg-emerald-50 hover:border-emerald-300",
                      isSelected && "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md",
                      isPast && "opacity-30",
                    )}
                    onClick={() => onUpdate({ startDate: date })}
                  >
                    <span className="text-xs opacity-70">{date.toLocaleDateString("en-CH", { weekday: "short" })}</span>
                    <span className="text-lg font-semibold">{date.getDate()}</span>
                    <span className="text-xs opacity-70">{date.toLocaleDateString("en-CH", { month: "short" })}</span>
                  </Button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-700 mb-2 block">Select start time</Label>
            <div className="flex gap-2">
              <div className="flex-1 max-h-48 overflow-y-auto border rounded-lg p-2 bg-gradient-to-br from-emerald-50 to-teal-50">
                <div className="grid grid-cols-3 gap-1">
                  {timeSlots.map((time) => (
                    <Button
                      key={`start-${time}`}
                      variant={formData.startTime === time ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "justify-center transition-all text-xs",
                        formData.startTime !== time && "hover:bg-emerald-100",
                        formData.startTime === time && "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm",
                      )}
                      onClick={() => onUpdate({ startTime: time })}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-gray-600">Custom</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => onUpdate({ startTime: e.target.value })}
                  className="w-28 h-9 bg-white border-emerald-300 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* End Date/Time */}
        <div className="space-y-4">
          <Label className="text-base font-semibold text-rose-700">End Date & Time</Label>

          <div>
            <Label className="text-sm text-gray-700 mb-2 block">Select end date</Label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {availableDates.map((date) => {
                const isSelected = formData.endDate?.toDateString() === date.toDateString()
                const isBeforeStart = formData.startDate && date < formData.startDate
                const isPast = date < new Date(new Date().setHours(0, 0, 0, 0))
                return (
                  <Button
                    key={date.toISOString()}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    disabled={isBeforeStart || isPast}
                    className={cn(
                      "flex flex-col h-auto py-2 transition-all",
                      !isSelected && "bg-transparent hover:bg-rose-50 hover:border-rose-300",
                      isSelected && "bg-gradient-to-br from-rose-500 to-pink-600 shadow-md",
                      (isBeforeStart || isPast) && "opacity-30",
                    )}
                    onClick={() => onUpdate({ endDate: date })}
                  >
                    <span className="text-xs opacity-70">{date.toLocaleDateString("en-CH", { weekday: "short" })}</span>
                    <span className="text-lg font-semibold">{date.getDate()}</span>
                    <span className="text-xs opacity-70">{date.toLocaleDateString("en-CH", { month: "short" })}</span>
                  </Button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-700 mb-2 block">Select end time</Label>
            <div className="flex gap-2">
              <div className="flex-1 max-h-48 overflow-y-auto border rounded-lg p-2 bg-gradient-to-br from-rose-50 to-pink-50">
                <div className="grid grid-cols-3 gap-1">
                  {timeSlots.map((time) => {
                    // Disable times before start time if same day
                    const sameDay = formData.startDate?.toDateString() === formData.endDate?.toDateString()
                    const isBeforeStartTime = sameDay && formData.startTime && time <= formData.startTime
                    return (
                      <Button
                        key={`end-${time}`}
                        variant={formData.endTime === time ? "default" : "ghost"}
                        size="sm"
                        disabled={isBeforeStartTime}
                        className={cn(
                          "justify-center transition-all text-xs",
                          formData.endTime !== time && "hover:bg-rose-100",
                          formData.endTime === time && "bg-gradient-to-br from-rose-500 to-pink-600 shadow-sm",
                          isBeforeStartTime && "opacity-30",
                        )}
                        onClick={() => onUpdate({ endTime: time })}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {time}
                      </Button>
                    )
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-gray-600">Custom</Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => onUpdate({ endTime: e.target.value })}
                  className="w-28 h-9 bg-white border-rose-300 focus:border-rose-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Duration Summary */}
        {formData.startDate && formData.startTime && formData.endDate && formData.endTime && (
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Duration</span>
                </div>
                <Badge variant="secondary" className="bg-blue-600 text-white">
                  {(() => {
                    const start = new Date(formData.startDate)
                    const [sh, sm] = formData.startTime.split(":").map(Number)
                    start.setHours(sh, sm)

                    const end = new Date(formData.endDate)
                    const [eh, em] = formData.endTime.split(":").map(Number)
                    end.setHours(eh, em)

                    const hours = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60))
                    return formatDuration(Math.round(hours))
                  })()}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}

// Step 2: User Details
function DetailsStep({
  formData,
  onUpdate,
}: {
  formData: BookingFormData
  onUpdate: (data: Partial<BookingFormData>) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Your Details
        </CardTitle>
        <p className="text-sm text-muted-foreground">Provide your contact information and service location</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+41 XX XXX XX XX"
            value={formData.phoneNumber}
            onChange={(e) => onUpdate({ phoneNumber: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">The vendor may contact you regarding your booking</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Service Address
          </Label>
          <Input
            id="address"
            placeholder="Where should the service be provided?"
            value={formData.serviceAddress}
            onChange={(e) => onUpdate({ serviceAddress: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">
            Message to Vendor
            <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
          </Label>
          <Textarea
            id="message"
            placeholder="Any special requests or notes for the vendor..."
            rows={4}
            value={formData.messageToVendor}
            onChange={(e) => onUpdate({ messageToVendor: e.target.value })}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function PaymentStep({
  formData,
  onUpdate,
  service,
}: {
  formData: BookingFormData
  onUpdate: (data: Partial<BookingFormData>) => void
  service: Service
}) {
  const paymentMethods = [
    {
      id: "card" as const,
      name: "Credit / Debit Card",
      description: "Secure Escrow Payment. Funds held until service completion.",
      icon: CreditCard,
      enabled: service.acceptCardPayments,
      badge: "Recommended",
      color: "from-blue-50 to-indigo-50 border-blue-200",
      selectedColor: "border-blue-500 ring-2 ring-blue-500",
    },
    {
      id: "twint" as const,
      name: "TWINT",
      description: "Swiss mobile payment. Quick and secure.",
      icon: Smartphone,
      enabled: service.acceptTwintPayments,
      color: "from-cyan-50 to-blue-50 border-cyan-200",
      selectedColor: "border-cyan-500 ring-2 ring-cyan-500",
    },
    {
      id: "cash" as const,
      name: "Cash",
      description: "Pay vendor directly at time of service.",
      icon: Banknote,
      enabled: service.acceptCashPayments,
      color: "from-emerald-50 to-green-50 border-emerald-200",
      selectedColor: "border-emerald-500 ring-2 ring-emerald-500",
    },
  ]

  const enabledMethods = paymentMethods.filter((m) => m.enabled)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-600" />
          Payment Method
        </CardTitle>
        <p className="text-sm text-muted-foreground">Choose how you'd like to pay for this service</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={formData.paymentMethod}
          onValueChange={(value) => onUpdate({ paymentMethod: value as "card" | "twint" | "cash" })}
          className="space-y-3"
        >
          {enabledMethods.map((method) => (
            <Card
              key={method.id}
              className={cn(
                "cursor-pointer transition-all bg-gradient-to-br",
                method.color,
                formData.paymentMethod === method.id ? method.selectedColor : "hover:border-primary/50",
              )}
              onClick={() => onUpdate({ paymentMethod: method.id })}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <RadioGroupItem value={method.id} id={method.id} />
                  <method.icon className="h-5 w-5 text-gray-600" />
                  <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold mb-0.5 text-gray-900">{method.name}</p>
                        <p className="text-sm text-gray-700">{method.description}</p>
                      </div>
                      {method.badge && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                          {method.badge}
                        </Badge>
                      )}
                    </div>
                  </Label>
                </div>
              </CardContent>
            </Card>
          ))}
        </RadioGroup>

        {formData.paymentMethod !== "cash" && (
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Shield className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm mb-1 text-emerald-900">Secure Escrow Payment</p>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Your payment is held securely and only released to the vendor after you confirm service completion.
                    Full refund available through our dispute resolution process.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}

// Step 4: Confirmation
function ConfirmationStep({
  formData,
  service,
  pricing,
}: {
  formData: BookingFormData
  service: Service
  pricing: PricingBreakdown
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          Review & Confirm
        </CardTitle>
        <p className="text-sm text-muted-foreground">Please review your booking details before confirming</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date & Time Summary */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date & Time
          </h3>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Start:</span>
              <span className="font-medium">
                {formatDate(formData.startDate)} at {formData.startTime}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">End:</span>
              <span className="font-medium">
                {formatDate(formData.endDate)} at {formData.endTime}
              </span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Duration:</span>
              <Badge variant="secondary">{formatDuration(pricing.hours)}</Badge>
            </div>
          </div>
        </div>

        {/* Your Details Summary */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Your Details
          </h3>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Phone:</span>
              <span className="font-medium">{formData.phoneNumber || "Not provided"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Address:</span>
              <span className="font-medium text-right max-w-[60%]">{formData.serviceAddress || "Not provided"}</span>
            </div>
            {formData.messageToVendor && (
              <div className="pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground block mb-1">Message:</span>
                <p className="text-sm">{formData.messageToVendor}</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Summary */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment
          </h3>
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              {formData.paymentMethod === "card" && <CreditCard className="h-5 w-5 text-muted-foreground" />}
              {formData.paymentMethod === "twint" && <Smartphone className="h-5 w-5 text-muted-foreground" />}
              {formData.paymentMethod === "cash" && <Banknote className="h-5 w-5 text-muted-foreground" />}
              <span className="text-sm font-medium capitalize">{formData.paymentMethod}</span>
            </div>
          </div>
        </div>

        {/* Trust Signals */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <Shield className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-xs font-medium">Secure booking</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <MessageSquare className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-xs font-medium">Direct vendor chat</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-xs font-medium">Verified vendor</p>
          </div>
        </div>

        {/* Cancellation Policy */}
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">Cancellation Policy</p>
                <p className="text-amber-800 dark:text-amber-200 text-xs leading-relaxed">
                  Free cancellation up to 24 hours before the scheduled time. Cancellations within 24 hours may incur a
                  50% fee.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms Agreement */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" className="mt-1 rounded" />
          <span className="text-sm text-muted-foreground leading-relaxed">
            I agree to the{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </span>
        </label>
      </CardContent>
    </Card>
  )
}

// Pricing Breakdown Sidebar Component
function PricingBreakdownCard({
  pricing,
  service,
}: {
  pricing: PricingBreakdown
  service: Service
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Price Breakdown</h3>

      {pricing.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : pricing.hours > 0 ? (
        <>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium">{formatDuration(pricing.hours)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Base cost (CHF {service.basePrice}/{service.priceUnit})
              </span>
              <span className="font-medium">CHF {pricing.baseCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform fee (10%)</span>
              <span className="font-medium">CHF {pricing.platformFee.toFixed(2)}</span>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>CHF {pricing.total.toFixed(2)}</span>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Select date and time to see pricing</p>
      )}
    </div>
  )
}

// Main Booking Page Component
export default function ServiceBookingPage() {
  const params = useParams()
  const router = useRouter()
  const serviceId = params.id as string

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<BookingFormData>(initialFormData)
  const [pricing, setPricing] = useState<PricingBreakdown>({
    hours: 0,
    days: 0,
    baseCost: 0,
    platformFee: 0,
    total: 0,
    isLoading: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // In real app, fetch service data
  const service = mockService

  // Calculate pricing when dates change
  useEffect(() => {
    if (formData.startDate && formData.startTime && formData.endDate && formData.endTime) {
      setPricing((prev) => ({ ...prev, isLoading: true }))

      // Simulate API call for price calculation
      const timer = setTimeout(() => {
        const start = new Date(formData.startDate!)
        const [sh, sm] = formData.startTime.split(":").map(Number)
        start.setHours(sh, sm)

        const end = new Date(formData.endDate!)
        const [eh, em] = formData.endTime.split(":").map(Number)
        end.setHours(eh, em)

        const hours = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60))
        const days = Math.floor(hours / 24)
        const baseCost = hours * service.basePrice
        const platformFee = baseCost * 0.1

        setPricing({
          hours: Math.round(hours),
          days,
          baseCost,
          platformFee,
          total: baseCost + platformFee,
          isLoading: false,
        })
      }, 500)

      return () => clearTimeout(timer)
    } else {
      setPricing({
        hours: 0,
        days: 0,
        baseCost: 0,
        platformFee: 0,
        total: 0,
        isLoading: false,
      })
    }
  }, [formData.startDate, formData.startTime, formData.endDate, formData.endTime, service.basePrice])

  const updateFormData = (data: Partial<BookingFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return !!(formData.startDate && formData.startTime && formData.endDate && formData.endTime)
      case 2:
        return !!(formData.phoneNumber && formData.serviceAddress)
      case 3:
        return !!formData.paymentMethod
      case 4:
        return true
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    // Simulate booking submission
    await new Promise((resolve) => setTimeout(resolve, 1500))

    if (formData.paymentMethod === "cash") {
      // Direct redirect to success page
      router.push("/booking-success")
    } else {
      // Redirect to payment gateway (Stripe/TWINT)
      // In real app: redirect to external payment URL
      router.push("/booking-success")
    }
  }

  const steps = [
    { num: 1, label: "Date & Time" },
    { num: 2, label: "Your Details" },
    { num: 3, label: "Payment" },
    { num: 4, label: "Confirm" },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          href={`/services/${serviceId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to service
        </Link>

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Book Service</h1>
          <p className="text-muted-foreground">Complete your booking in just a few steps</p>
        </div>

        {/* Step Indicator */}
        <div className="max-w-4xl mx-auto">
          <StepIndicator currentStep={step} steps={steps} />
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Main Form Area */}
          <div className="lg:col-span-2 space-y-6">
            {step === 1 && <DateTimeStep formData={formData} onUpdate={updateFormData} />}

            {step === 2 && <DetailsStep formData={formData} onUpdate={updateFormData} />}

            {step === 3 && <PaymentStep formData={formData} onUpdate={updateFormData} service={service} />}

            {step === 4 && <ConfirmationStep formData={formData} service={service} pricing={pricing} />}

            {/* Navigation Buttons */}
            <div className="flex gap-3">
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1 bg-transparent">
                  Back
                </Button>
              )}
              {step < 4 ? (
                <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="flex-1">
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    "Processing..."
                  ) : formData.paymentMethod === "cash" ? (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Confirm Booking
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-5 w-5" />
                      Pay with {formData.paymentMethod === "card" ? "Card" : "TWINT"}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Persistent Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="p-6 space-y-6">
                {/* Service Summary */}
                <div className="flex items-start gap-3">
                  <img
                    src={service.thumbnail || "/placeholder.svg"}
                    alt={service.title}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/services/${serviceId}`}
                      className="font-semibold text-sm mb-1 line-clamp-2 hover:text-primary transition-colors block"
                    >
                      {service.title}
                    </Link>
                    <Link
                      href={`/vendor/${service.vendorName.toLowerCase().replace(/\s+/g, "-")}`}
                      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={service.vendorAvatar || "/placeholder.svg"} />
                        <AvatarFallback>{service.vendorName[0]}</AvatarFallback>
                      </Avatar>
                      {service.vendorName}
                      {service.vendorVerified && <Shield className="h-3 w-3 text-primary" />}
                    </Link>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-medium">{service.rating}</span>
                      <span className="text-xs text-muted-foreground">({service.reviewCount} reviews)</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Base Price */}
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold">CHF {service.basePrice}</span>
                  <span className="text-muted-foreground mb-0.5">/{service.priceUnit}</span>
                </div>

                <Separator />

                {/* Real-time Pricing Breakdown */}
                <PricingBreakdownCard pricing={pricing} service={service} />

                <Separator />

                {/* Security Features */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Shield className="h-3 w-3 text-primary" />
                    <span className="text-muted-foreground">Escrow payment protection</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    <span className="text-muted-foreground">Instant confirmation</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <MessageSquare className="h-3 w-3 text-primary" />
                    <span className="text-muted-foreground">Direct vendor chat</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
