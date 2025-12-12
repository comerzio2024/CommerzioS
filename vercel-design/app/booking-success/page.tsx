"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Calendar, MessageSquare, Home, Clock, MapPin } from "lucide-react"
import confetti from "canvas-confetti"

export default function BookingSuccessPage() {
  const [bookingNumber] = useState(`BK${Date.now().toString(36).toUpperCase()}`)

  useEffect(() => {
    // Celebrate with confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    })
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navigation />

      <div className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Booking Confirmed!</h1>
            <p className="text-muted-foreground text-lg">Your booking has been successfully placed</p>
          </div>

          {/* Booking Details Card */}
          <Card className="mb-8 text-left">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Confirmation Number</span>
                <Badge variant="secondary" className="font-mono text-base">
                  {bookingNumber}
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Monday, December 16, 2025</p>
                    <p className="text-sm text-muted-foreground">10:00 AM - 2:00 PM (4 hours)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Bahnhofstrasse 1</p>
                    <p className="text-sm text-muted-foreground">8001 Zürich, Switzerland</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Professional Home Cleaning</p>
                    <p className="text-sm text-muted-foreground">by Swiss Clean Pro</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Paid</span>
                  <span>CHF 198.00</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What's Next */}
          <Card className="mb-8 text-left bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <h2 className="font-semibold mb-4">What happens next?</h2>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                    1
                  </div>
                  <p>You'll receive a confirmation email with booking details</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                    2
                  </div>
                  <p>The vendor may contact you to confirm any special requirements</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                    3
                  </div>
                  <p>After service completion, confirm it in your dashboard to release payment</p>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <Link href="/my-bookings">
                <Calendar className="mr-2 h-5 w-5" />
                View My Bookings
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent" asChild>
              <Link href="/messages">
                <MessageSquare className="mr-2 h-5 w-5" />
                Message Vendor
              </Link>
            </Button>
            <Button size="lg" variant="ghost" asChild>
              <Link href="/">
                <Home className="mr-2 h-5 w-5" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
