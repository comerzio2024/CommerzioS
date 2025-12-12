"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  Star,
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  Download,
  Share2,
  CreditCard,
  Camera,
  Send,
  Play,
  RefreshCw,
  Ban,
  Flag,
  ChevronRight,
  Info,
  Receipt,
  CheckCheck,
  CircleDot,
  Loader2,
  ImageIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

type BookingStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "disputed"

interface BookingData {
  id: string
  service: string
  vendor: {
    name: string
    avatar: string
    rating: number
    completedJobs: number
    phone: string
    email: string
  }
  date: string
  time: string
  duration: string
  address: string
  status: BookingStatus
  price: number
  platformFee: number
  discount: number
  total: number
  paymentMethod: string
  paymentStatus: "pending" | "held" | "released" | "refunded"
  notes: string
  createdAt: string
  confirmedAt?: string
  startedAt?: string
  completedAt?: string
  review?: {
    rating: number
    comment: string
    date: string
  }
}

export default function BookingDetailPage() {
  const params = useParams()
  const bookingId = params.id as string

  // Simulated booking data - in production this would come from an API
  const [booking, setBooking] = useState<BookingData>({
    id: bookingId || "BK-2025-1234",
    service: "Professional Home Cleaning",
    vendor: {
      name: "Swiss Clean Pro",
      avatar: "/professional-cleaning-service.png",
      rating: 4.9,
      completedJobs: 234,
      phone: "+41 44 123 45 67",
      email: "contact@swisscleanpro.ch",
    },
    date: "December 15, 2025",
    time: "10:00 AM",
    duration: "2 hours",
    address: "Bahnhofstrasse 1, 8001 Zürich",
    status: "confirmed",
    price: 90,
    platformFee: 4.5,
    discount: 10,
    total: 84.5,
    paymentMethod: "Visa •••• 1234",
    paymentStatus: "held",
    notes: "Please bring eco-friendly cleaning supplies. Pet-friendly products preferred.",
    createdAt: "December 10, 2025",
    confirmedAt: "December 10, 2025",
  })

  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [showDisputeDialog, setShowDisputeDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState("")
  const [disputeReason, setDisputeReason] = useState("")
  const [disputeDescription, setDisputeDescription] = useState("")
  const [disputeImages, setDisputeImages] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: "vendor",
      message: "Hi! I've confirmed your booking for December 15th at 10 AM. Looking forward to it!",
      time: "Dec 10, 2:15 PM",
    },
    { id: 2, sender: "user", message: "Great! Do you have eco-friendly cleaning supplies?", time: "Dec 10, 2:20 PM" },
    {
      id: 3,
      sender: "vendor",
      message: "Yes, we use 100% eco-friendly and pet-safe products. No worries!",
      time: "Dec 10, 2:22 PM",
    },
  ])
  const [newMessage, setNewMessage] = useState("")

  // Status configuration
  const statusConfig = {
    pending: { label: "Pending Confirmation", color: "bg-yellow-500", icon: Clock },
    confirmed: { label: "Confirmed", color: "bg-blue-500", icon: CheckCircle2 },
    in_progress: { label: "In Progress", color: "bg-purple-500", icon: Play },
    completed: { label: "Completed", color: "bg-green-500", icon: CheckCheck },
    cancelled: { label: "Cancelled", color: "bg-gray-500", icon: XCircle },
    disputed: { label: "Disputed", color: "bg-red-500", icon: AlertTriangle },
  }

  const currentStatus = statusConfig[booking.status]
  const StatusIcon = currentStatus.icon

  // Timeline steps
  const timelineSteps = [
    { id: "booked", label: "Booked", date: booking.createdAt, completed: true },
    {
      id: "confirmed",
      label: "Confirmed",
      date: booking.confirmedAt,
      completed: ["confirmed", "in_progress", "completed"].includes(booking.status),
    },
    {
      id: "in_progress",
      label: "Service Started",
      date: booking.startedAt,
      completed: ["in_progress", "completed"].includes(booking.status),
    },
    { id: "completed", label: "Completed", date: booking.completedAt, completed: booking.status === "completed" },
  ]

  const handleSendMessage = () => {
    if (!newMessage.trim()) return
    setChatMessages([
      ...chatMessages,
      { id: chatMessages.length + 1, sender: "user", message: newMessage, time: "Just now" },
    ])
    setNewMessage("")
  }

  const handleConfirmCompletion = () => {
    setBooking((prev) => ({
      ...prev,
      status: "completed",
      completedAt: "December 15, 2025",
      paymentStatus: "released",
    }))
    setShowReviewDialog(true)
  }

  const handleSubmitReview = async () => {
    setIsSubmitting(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setBooking((prev) => ({
      ...prev,
      review: {
        rating: reviewRating,
        comment: reviewComment,
        date: "December 15, 2025",
      },
    }))
    setIsSubmitting(false)
    setShowReviewDialog(false)
  }

  const handleOpenDispute = async () => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setBooking((prev) => ({
      ...prev,
      status: "disputed",
      paymentStatus: "held",
    }))
    setIsSubmitting(false)
    setShowDisputeDialog(false)
  }

  const handleCancelBooking = async () => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setBooking((prev) => ({
      ...prev,
      status: "cancelled",
      paymentStatus: "refunded",
    }))
    setIsSubmitting(false)
    setShowCancelDialog(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Back Button & Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold">Booking #{booking.id}</h1>
                <Badge className={cn("text-white", currentStatus.color)}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {currentStatus.label}
                </Badge>
              </div>
              <p className="text-muted-foreground">Created on {booking.createdAt}</p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Receipt
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Booking Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="flex justify-between">
                    {timelineSteps.map((step, index) => (
                      <div key={step.id} className="flex flex-col items-center flex-1">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all z-10 bg-background",
                            step.completed
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/30 text-muted-foreground",
                          )}
                        >
                          {step.completed ? <CheckCircle2 className="h-5 w-5" /> : <CircleDot className="h-5 w-5" />}
                        </div>
                        <p
                          className={cn(
                            "text-xs font-medium mt-2 text-center",
                            step.completed ? "text-foreground" : "text-muted-foreground",
                          )}
                        >
                          {step.label}
                        </p>
                        {step.date && <p className="text-xs text-muted-foreground mt-1">{step.date}</p>}
                        {/* Connection line */}
                        {index < timelineSteps.length - 1 && (
                          <div
                            className={cn(
                              "absolute h-0.5 top-5 -z-0",
                              step.completed && timelineSteps[index + 1]?.completed
                                ? "bg-primary"
                                : "bg-muted-foreground/30",
                            )}
                            style={{
                              left: `${(index + 0.5) * (100 / timelineSteps.length)}%`,
                              width: `${100 / timelineSteps.length}%`,
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons based on status */}
                <div className="mt-8 pt-6 border-t border-border">
                  {booking.status === "confirmed" && (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        className="flex-1"
                        onClick={() =>
                          setBooking((prev) => ({ ...prev, status: "in_progress", startedAt: "December 15, 2025" }))
                        }
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Mark Service Started
                      </Button>
                      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="flex-1 bg-transparent">
                            <Ban className="h-4 w-4 mr-2" />
                            Cancel Booking
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cancellation within 24 hours of the scheduled time may incur a 50% fee. Your refund will
                              be processed within 3-5 business days.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleCancelBooking}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancel Booking"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}

                  {booking.status === "in_progress" && (
                    <div className="space-y-4">
                      <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
                          <span className="font-semibold text-purple-400">Service in Progress</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          The vendor is currently providing the service. Mark as complete once you're satisfied.
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleConfirmCompletion}>
                          <CheckCheck className="h-4 w-4 mr-2" />
                          Confirm Completion & Release Payment
                        </Button>
                        <Dialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="flex-1 border-red-500/50 text-red-500 hover:bg-red-500/10 bg-transparent"
                            >
                              <Flag className="h-4 w-4 mr-2" />
                              Report Issue
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Report an Issue</DialogTitle>
                              <DialogDescription>
                                Let us know what went wrong. Our team will help resolve this.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <Label>Issue Type</Label>
                                <select
                                  className="w-full mt-2 p-2 rounded-md border border-border bg-background"
                                  value={disputeReason}
                                  onChange={(e) => setDisputeReason(e.target.value)}
                                >
                                  <option value="">Select an issue...</option>
                                  <option value="no_show">Vendor didn't show up</option>
                                  <option value="incomplete">Service incomplete</option>
                                  <option value="quality">Quality not as expected</option>
                                  <option value="damage">Property damage</option>
                                  <option value="overcharge">Overcharged</option>
                                  <option value="other">Other</option>
                                </select>
                              </div>
                              <div>
                                <Label>Describe the issue</Label>
                                <Textarea
                                  className="mt-2"
                                  rows={4}
                                  placeholder="Please provide details about what happened..."
                                  value={disputeDescription}
                                  onChange={(e) => setDisputeDescription(e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>Upload Evidence (Optional)</Label>
                                <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center">
                                  <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                  <p className="text-sm text-muted-foreground">Drag & drop images or click to upload</p>
                                  <Input type="file" accept="image/*" multiple className="hidden" id="dispute-images" />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2 bg-transparent"
                                    onClick={() => document.getElementById("dispute-images")?.click()}
                                  >
                                    Select Files
                                  </Button>
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setShowDisputeDialog(false)}>
                                Cancel
                              </Button>
                              <Button
                                onClick={handleOpenDispute}
                                disabled={!disputeReason || !disputeDescription || isSubmitting}
                              >
                                {isSubmitting ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <Flag className="h-4 w-4 mr-2" />
                                )}
                                Submit Report
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  )}

                  {booking.status === "completed" && !booking.review && (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <CheckCheck className="h-5 w-5 text-green-500" />
                          <span className="font-semibold text-green-400">Service Completed!</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Payment has been released to the vendor. Please leave a review to help others.
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                          <DialogTrigger asChild>
                            <Button className="flex-1">
                              <Star className="h-4 w-4 mr-2" />
                              Leave a Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>How was your experience?</DialogTitle>
                              <DialogDescription>
                                Your review helps other customers and the vendor improve.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                              {/* Star Rating */}
                              <div className="text-center">
                                <p className="text-sm font-medium mb-3">Rate your experience</p>
                                <div className="flex justify-center gap-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      onClick={() => setReviewRating(star)}
                                      className="transition-transform hover:scale-110"
                                    >
                                      <Star
                                        className={cn(
                                          "h-10 w-10 transition-colors",
                                          star <= reviewRating
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-muted-foreground",
                                        )}
                                      />
                                    </button>
                                  ))}
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                  {reviewRating === 0 && "Select a rating"}
                                  {reviewRating === 1 && "Poor"}
                                  {reviewRating === 2 && "Fair"}
                                  {reviewRating === 3 && "Good"}
                                  {reviewRating === 4 && "Very Good"}
                                  {reviewRating === 5 && "Excellent!"}
                                </p>
                              </div>

                              {/* Quick Tags */}
                              <div>
                                <p className="text-sm font-medium mb-2">What stood out?</p>
                                <div className="flex flex-wrap gap-2">
                                  {[
                                    "Professional",
                                    "On time",
                                    "Great communication",
                                    "Quality work",
                                    "Fair price",
                                    "Friendly",
                                  ].map((tag) => (
                                    <Badge
                                      key={tag}
                                      variant="outline"
                                      className="cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              {/* Comment */}
                              <div>
                                <Label>Your Review</Label>
                                <Textarea
                                  className="mt-2"
                                  rows={4}
                                  placeholder="Tell others about your experience..."
                                  value={reviewComment}
                                  onChange={(e) => setReviewComment(e.target.value)}
                                />
                              </div>

                              {/* Photo Upload */}
                              <div>
                                <Label>Add Photos (Optional)</Label>
                                <div className="mt-2 flex gap-2">
                                  <div className="w-20 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                                    <Camera className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                                Skip
                              </Button>
                              <Button onClick={handleSubmitReview} disabled={reviewRating === 0 || isSubmitting}>
                                {isSubmitting ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <Send className="h-4 w-4 mr-2" />
                                )}
                                Submit Review
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Dialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="flex-1 bg-transparent">
                              <Flag className="h-4 w-4 mr-2" />
                              Report Issue
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Report an Issue</DialogTitle>
                              <DialogDescription>
                                Even after completion, you can report issues within 48 hours.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <Label>Issue Type</Label>
                                <select
                                  className="w-full mt-2 p-2 rounded-md border border-border bg-background"
                                  value={disputeReason}
                                  onChange={(e) => setDisputeReason(e.target.value)}
                                >
                                  <option value="">Select an issue...</option>
                                  <option value="incomplete">Service was incomplete</option>
                                  <option value="quality">Quality not as expected</option>
                                  <option value="damage">Property damage discovered</option>
                                  <option value="other">Other</option>
                                </select>
                              </div>
                              <div>
                                <Label>Describe the issue</Label>
                                <Textarea
                                  className="mt-2"
                                  rows={4}
                                  placeholder="Please provide details about what happened..."
                                  value={disputeDescription}
                                  onChange={(e) => setDisputeDescription(e.target.value)}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setShowDisputeDialog(false)}>
                                Cancel
                              </Button>
                              <Button
                                onClick={handleOpenDispute}
                                disabled={!disputeReason || !disputeDescription || isSubmitting}
                              >
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Submit Report
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  )}

                  {booking.status === "completed" && booking.review && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                "h-4 w-4",
                                star <= booking.review!.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground",
                              )}
                            />
                          ))}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{booking.review.comment}</p>
                          <p className="text-xs text-muted-foreground mt-1">Reviewed on {booking.review.date}</p>
                        </div>
                        <Badge variant="secondary">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Reviewed
                        </Badge>
                      </div>
                    </div>
                  )}

                  {booking.status === "disputed" && (
                    <div className="space-y-4">
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                          <span className="font-semibold text-red-400">Dispute in Progress</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Your payment is held in escrow while we resolve this issue. You have 48 hours to reach an
                          amicable resolution with the vendor.
                        </p>
                      </div>
                      <Button asChild>
                        <Link href={`/disputes/${booking.id}`}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Go to Dispute Resolution Center
                        </Link>
                      </Button>
                    </div>
                  )}

                  {booking.status === "cancelled" && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold">Booking Cancelled</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        This booking was cancelled. Your refund of CHF {booking.total} has been processed.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Service Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Service Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <img
                    src="/professional-cleaning-service.png"
                    alt={booking.service}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{booking.service}</h3>
                    <p className="text-muted-foreground text-sm mb-2">by {booking.vendor.name}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{booking.vendor.rating}</span>
                        <span className="text-muted-foreground">({booking.vendor.completedJobs} jobs)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">{booking.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Time</p>
                      <p className="font-medium">
                        {booking.time} ({booking.duration})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:col-span-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{booking.address}</p>
                    </div>
                  </div>
                </div>

                {booking.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Special Instructions</p>
                      <p className="text-sm p-3 bg-muted/50 rounded-lg">{booking.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Chat with Vendor */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Messages</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/messages">
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={cn("flex gap-3", msg.sender === "user" ? "flex-row-reverse" : "")}>
                      <Avatar className="h-8 w-8">
                        {msg.sender === "vendor" ? (
                          <AvatarImage src={booking.vendor.avatar || "/placeholder.svg"} />
                        ) : null}
                        <AvatarFallback>{msg.sender === "vendor" ? "SC" : "ME"}</AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          "max-w-[75%] rounded-lg p-3",
                          msg.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                        )}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p
                          className={cn(
                            "text-xs mt-1",
                            msg.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground",
                          )}
                        >
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button size="icon" onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service ({booking.duration})</span>
                    <span>CHF {booking.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform fee</span>
                    <span>CHF {booking.platformFee.toFixed(2)}</span>
                  </div>
                  {booking.discount > 0 && (
                    <div className="flex justify-between text-green-500">
                      <span>Discount</span>
                      <span>-CHF {booking.discount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>CHF {booking.total.toFixed(2)}</span>
                </div>

                <div className="pt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Payment Method</span>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span>{booking.paymentMethod}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Payment Status</span>
                    <Badge
                      variant={
                        booking.paymentStatus === "released"
                          ? "default"
                          : booking.paymentStatus === "refunded"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {booking.paymentStatus === "held" && <Shield className="h-3 w-3 mr-1" />}
                      {booking.paymentStatus === "released" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {booking.paymentStatus === "refunded" && <RefreshCw className="h-3 w-3 mr-1" />}
                      {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                    </Badge>
                  </div>
                </div>

                {booking.paymentStatus === "held" && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-blue-500 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-blue-400">Escrow Protected</p>
                        <p className="text-xs text-muted-foreground">
                          Payment is held securely until service completion.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vendor Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vendor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={booking.vendor.avatar || "/placeholder.svg"} />
                    <AvatarFallback>SC</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{booking.vendor.name}</h3>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{booking.vendor.rating}</span>
                      <span className="text-muted-foreground">• {booking.vendor.completedJobs} jobs</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                    <a href={`tel:${booking.vendor.phone}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      {booking.vendor.phone}
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                    <a href={`mailto:${booking.vendor.email}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      {booking.vendor.email}
                    </a>
                  </Button>
                </div>

                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/services/1">
                    View Profile
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Info className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Need Help?</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Our support team is available 24/7 to assist you.
                    </p>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/help">Contact Support</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
