"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"


import { 
  Clock, 
  CreditCard, 
  Shield, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight,
  MapPin,
  Phone,
  Camera,
  Sparkles,
  Wand2
} from "lucide-react"

interface BookingData {
  service: {
    id: string
    title: string
    vendor: string
    price: number
    image: string
  }
  date?: Date
  time?: string
  duration?: number
  address?: string
  phone?: string
  notes?: string
  images?: string[]
  paymentMethod?: string
}

export default function BookingWizardPage() {
  const [step, setStep] = useState(1)
  const [bookingData, setBookingData] = useState<BookingData>({
    service: {
      id: "1",
      title: "Professional Home Cleaning",
      vendor: "Swiss Clean Pro",
      price: 45,
      image: "/placeholder.jpg"
    }
  })

  const totalSteps = 3
  const progress = (step / totalSteps) * 100

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const updateBookingData = (updates: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...updates }))
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-muted/20 to-background">
      <Navigation />

      {/* Mobile-First Header */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-xl border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="sm" onClick={prevStep} disabled={step === 1}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Badge variant="secondary" className="px-3 py-1">
              Step {step} of {totalSteps}
            </Badge>
            <div className="w-16" />
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          
          {/* Step 1: Quick Booking */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-2">Book Your Service</h1>
                <p className="text-muted-foreground">Let's get you scheduled quickly</p>
              </div>

              {/* Service Summary Card */}
              <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src={bookingData.service.image} 
                      alt={bookingData.service.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{bookingData.service.title}</h3>
                      <p className="text-sm text-muted-foreground">{bookingData.service.vendor}</p>
                      <p className="text-lg font-bold text-primary">CHF {bookingData.service.price}/hour</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Date & Time Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    When do you need this service?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Quick Date Options */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Choose a date</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Today", date: new Date(), available: false },
                        { label: "Tomorrow", date: new Date(Date.now() + 86400000), available: true },
                        { label: "This Weekend", date: new Date(Date.now() + 2 * 86400000), available: true },
                        { label: "Next Week", date: new Date(Date.now() + 7 * 86400000), available: true }
                      ].map((option, i) => (
                        <Button
                          key={i}
                          variant={bookingData.date?.toDateString() === option.date.toDateString() ? "default" : "outline"}
                          className="h-auto p-3 flex flex-col items-start"
                          disabled={!option.available}
                          onClick={() => updateBookingData({ date: option.date })}
                        >
                          <span className="font-medium">{option.label}</span>
                          <span className="text-xs opacity-70">
                            {option.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>



                  {/* Time Slots */}
                  {bookingData.date && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <Label className="text-sm font-medium mb-3 block">Available times</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"].map((time) => (
                          <Button
                            key={time}
                            variant={bookingData.time === time ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateBookingData({ time })}
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Duration */}
                  {bookingData.time && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <Label className="text-sm font-medium mb-3 block">How long?</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { hours: 2, label: "2 hours", price: 90 },
                          { hours: 3, label: "3 hours", price: 135 },
                          { hours: 4, label: "4 hours", price: 180 },
                          { hours: 6, label: "6 hours", price: 270 }
                        ].map((option) => (
                          <Button
                            key={option.hours}
                            variant={bookingData.duration === option.hours ? "default" : "outline"}
                            className="h-auto p-3 flex flex-col"
                            onClick={() => updateBookingData({ duration: option.hours })}
                          >
                            <span className="font-medium">{option.label}</span>
                            <span className="text-xs opacity-70">CHF {option.price}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Quick Setup */}
              <Card className="border-2 border-dashed border-purple-200 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                      <Wand2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-purple-900 dark:text-purple-100">AI Quick Setup</h3>
                      <p className="text-sm text-purple-700 dark:text-purple-300">Let AI fill in your details automatically</p>
                    </div>
                    <Button size="sm" variant="outline" className="border-purple-200 hover:bg-purple-50">
                      <Sparkles className="w-4 h-4 mr-1" />
                      Try It
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Location & Details */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-2">Service Details</h1>
                <p className="text-muted-foreground">Where should we provide the service?</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Service Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input 
                      id="address" 
                      placeholder="Enter your address"
                      value={bookingData.address || ""}
                      onChange={(e) => updateBookingData({ address: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input id="city" placeholder="Zürich" />
                    </div>
                    <div>
                      <Label htmlFor="postal">Postal Code</Label>
                      <Input id="postal" placeholder="8001" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      placeholder="+41 XX XXX XX XX"
                      value={bookingData.phone || ""}
                      onChange={(e) => updateBookingData({ phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Special Instructions (Optional)</Label>
                    <Textarea 
                      id="notes" 
                      placeholder="Any special requirements or notes..."
                      value={bookingData.notes || ""}
                      onChange={(e) => updateBookingData({ notes: e.target.value })}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Photo Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-primary" />
                    Photos (Optional)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Help your vendor prepare by sharing photos
                    </p>
                    <Button variant="outline" size="sm">
                      Add Photos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Payment & Confirmation */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-2">Secure Payment</h1>
                <p className="text-muted-foreground">Your payment is protected by escrow</p>
              </div>

              {/* Booking Summary */}
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service:</span>
                    <span className="font-medium">{bookingData.service.title}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date & Time:</span>
                    <span className="font-medium">
                      {bookingData.date?.toLocaleDateString()} at {bookingData.time}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">{bookingData.duration} hours</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>CHF {(bookingData.duration || 2) * bookingData.service.price}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { id: "card", label: "Credit/Debit Card", icon: CreditCard, recommended: true },
                    { id: "twint", label: "TWINT", icon: Phone },
                    { id: "cash", label: "Cash on Delivery", icon: Shield }
                  ].map((method) => (
                    <Button
                      key={method.id}
                      variant={bookingData.paymentMethod === method.id ? "default" : "outline"}
                      className="w-full justify-between h-auto p-4"
                      onClick={() => updateBookingData({ paymentMethod: method.id })}
                    >
                      <div className="flex items-center gap-3">
                        <method.icon className="h-5 w-5" />
                        <span>{method.label}</span>
                      </div>
                      {method.recommended && (
                        <Badge variant="secondary" className="ml-2">Recommended</Badge>
                      )}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Escrow Protection */}
              <Card className="bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-900 dark:text-green-100 text-sm mb-1">
                        100% Secure Escrow Payment
                      </p>
                      <p className="text-xs text-green-800 dark:text-green-200 leading-relaxed">
                        Your payment is held securely and only released after you confirm service completion. 
                        Full refund available through our dispute resolution process.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-6">
            {step > 1 && (
              <Button variant="outline" onClick={prevStep} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            {step < totalSteps ? (
              <Button 
                onClick={nextStep} 
                className="flex-1"
                disabled={
                  (step === 1 && (!bookingData.date || !bookingData.time || !bookingData.duration)) ||
                  (step === 2 && (!bookingData.address || !bookingData.phone))
                }
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button className="flex-1 bg-gradient-to-r from-primary to-accent">
                <Shield className="h-4 w-4 mr-2" />
                Confirm & Pay
              </Button>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}