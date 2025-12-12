"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Send,
  Settings,
  ShoppingBag,
  Store,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  Briefcase,
  DollarSign,
  TrendingUp,
  CalendarIcon,
  Star,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Types
type BookingStatus = "pending" | "accepted" | "confirmed" | "in_progress" | "completed" | "cancelled" | "rejected"
type UserRole = "customer" | "vendor" | "both"
type CalendarView = "week" | "month"
type CalendarFilter = "all" | "customer" | "vendor" | "completed"

interface Booking {
  id: string
  bookingNumber: string
  status: BookingStatus
  service: {
    title: string
    image: string
  }
  counterparty: {
    name: string
    avatar: string
    role: "customer" | "vendor"
  }
  requestedStart: string
  requestedEnd: string
  confirmedStart?: string
  confirmedEnd?: string
  totalPrice: number
  currency: string
  isVendorBooking: boolean
}

interface ServiceRequest {
  id: string
  title: string
  description: string
  budgetMin: number
  budgetMax: number
  currency: string
  location: string
  viewCount: number
  proposalCount: number
  status: "open" | "closed"
  createdAt: string
}

interface Proposal {
  id: string
  requestId: string
  requestTitle: string
  vendor: {
    name: string
    avatar: string
    rating: number
  }
  price: number
  currency: string
  message: string
  status: "pending" | "accepted" | "rejected"
  createdAt: string
}

// Mock data
const mockBookings: Booking[] = [
  {
    id: "1",
    bookingNumber: "BK-2024-001",
    status: "confirmed",
    service: { title: "Professional Home Cleaning", image: "/professional-cleaning-service.png" },
    counterparty: { name: "Swiss Clean Pro", avatar: "/partner-logo.png", role: "vendor" },
    requestedStart: "2024-12-15T10:00:00",
    requestedEnd: "2024-12-15T14:00:00",
    confirmedStart: "2024-12-15T10:00:00",
    confirmedEnd: "2024-12-15T14:00:00",
    totalPrice: 180,
    currency: "CHF",
    isVendorBooking: false,
  },
  {
    id: "2",
    bookingNumber: "BK-2024-002",
    status: "pending",
    service: { title: "Plumbing Repair", image: "/professional-plumber-working.png" },
    counterparty: { name: "AquaFix Switzerland", avatar: "/plumber-avatar.png", role: "vendor" },
    requestedStart: "2024-12-18T14:00:00",
    requestedEnd: "2024-12-18T16:00:00",
    totalPrice: 120,
    currency: "CHF",
    isVendorBooking: false,
  },
  {
    id: "3",
    bookingNumber: "BK-2024-003",
    status: "in_progress",
    service: { title: "Personal Training Session", image: "/personal-trainer-fitness-gym.jpg" },
    counterparty: { name: "Maria Schmidt", avatar: "/professional-woman-portrait.png", role: "customer" },
    requestedStart: "2024-12-12T09:00:00",
    requestedEnd: "2024-12-12T10:00:00",
    confirmedStart: "2024-12-12T09:00:00",
    confirmedEnd: "2024-12-12T10:00:00",
    totalPrice: 80,
    currency: "CHF",
    isVendorBooking: true,
  },
  {
    id: "4",
    bookingNumber: "BK-2024-004",
    status: "accepted",
    service: { title: "Math Tutoring", image: "/tutor-teaching-student.jpg" },
    counterparty: { name: "Thomas Weber", avatar: "/male-student-studying.png", role: "customer" },
    requestedStart: "2024-12-20T15:00:00",
    requestedEnd: "2024-12-20T17:00:00",
    totalPrice: 90,
    currency: "CHF",
    isVendorBooking: true,
  },
  {
    id: "5",
    bookingNumber: "BK-2024-005",
    status: "completed",
    service: { title: "Photography Session", image: "/professional-photographer-event.jpg" },
    counterparty: { name: "LensArt Studio", avatar: "/photography-logo.jpg", role: "vendor" },
    requestedStart: "2024-11-28T14:00:00",
    requestedEnd: "2024-11-28T18:00:00",
    confirmedStart: "2024-11-28T14:00:00",
    confirmedEnd: "2024-11-28T18:00:00",
    totalPrice: 350,
    currency: "CHF",
    isVendorBooking: false,
  },
  {
    id: "6",
    bookingNumber: "BK-2024-006",
    status: "completed",
    service: { title: "IT Support", image: "/it-technician-computer-repair.jpg" },
    counterparty: { name: "Lisa Müller", avatar: "/professional-woman.png", role: "customer" },
    requestedStart: "2024-11-25T10:00:00",
    requestedEnd: "2024-11-25T12:00:00",
    confirmedStart: "2024-11-25T10:00:00",
    confirmedEnd: "2024-11-25T12:00:00",
    totalPrice: 150,
    currency: "CHF",
    isVendorBooking: true,
  },
  {
    id: "7",
    bookingNumber: "BK-2024-007",
    status: "cancelled",
    service: { title: "Garden Maintenance", image: "/lush-garden-landscape.png" },
    counterparty: { name: "GreenThumb Services", avatar: "/gardening-logo.jpg", role: "vendor" },
    requestedStart: "2024-11-20T08:00:00",
    requestedEnd: "2024-11-20T12:00:00",
    totalPrice: 200,
    currency: "CHF",
    isVendorBooking: false,
  },
]

const mockServiceRequests: ServiceRequest[] = [
  {
    id: "sr-1",
    title: "Need help moving furniture",
    description: "Looking for someone to help move furniture from 3rd floor apartment",
    budgetMin: 100,
    budgetMax: 200,
    currency: "CHF",
    location: "Zürich",
    viewCount: 45,
    proposalCount: 3,
    status: "open",
    createdAt: "2024-12-10T10:00:00",
  },
  {
    id: "sr-2",
    title: "Wedding photographer needed",
    description: "Looking for an experienced wedding photographer for June 2025",
    budgetMin: 2000,
    budgetMax: 4000,
    currency: "CHF",
    location: "Bern",
    viewCount: 128,
    proposalCount: 8,
    status: "open",
    createdAt: "2024-12-08T14:00:00",
  },
]

const mockProposals: Proposal[] = [
  {
    id: "prop-1",
    requestId: "sr-1",
    requestTitle: "Need help moving furniture",
    vendor: { name: "QuickMove Services", avatar: "/moving-company.png", rating: 4.8 },
    price: 150,
    currency: "CHF",
    message: "I can help with your move! I have a van and experience with furniture.",
    status: "pending",
    createdAt: "2024-12-11T09:00:00",
  },
  {
    id: "prop-2",
    requestId: "sr-1",
    requestTitle: "Need help moving furniture",
    vendor: { name: "Strong Arms Moving", avatar: "/mover-avatar.jpg", rating: 4.9 },
    price: 180,
    currency: "CHF",
    message: "Professional movers with insurance. We handle everything with care.",
    status: "pending",
    createdAt: "2024-12-11T11:00:00",
  },
]

const mockBrowseRequests: ServiceRequest[] = [
  {
    id: "br-1",
    title: "Dog walker needed weekly",
    description: "Need someone to walk my golden retriever 3x per week",
    budgetMin: 50,
    budgetMax: 100,
    currency: "CHF",
    location: "Geneva",
    viewCount: 32,
    proposalCount: 5,
    status: "open",
    createdAt: "2024-12-11T08:00:00",
  },
  {
    id: "br-2",
    title: "House painting - 2 bedrooms",
    description: "Need interior painting for 2 bedrooms, approximately 40m²",
    budgetMin: 500,
    budgetMax: 800,
    currency: "CHF",
    location: "Lausanne",
    viewCount: 67,
    proposalCount: 4,
    status: "open",
    createdAt: "2024-12-10T16:00:00",
  },
]

// Status configuration
const statusConfig: Record<BookingStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pending: { label: "Pending", color: "bg-amber-500", icon: Clock },
  accepted: { label: "Accepted", color: "bg-blue-500", icon: CheckCircle2 },
  confirmed: { label: "Confirmed", color: "bg-blue-600", icon: CheckCircle2 },
  in_progress: { label: "In Progress", color: "bg-purple-500", icon: Play },
  completed: { label: "Completed", color: "bg-green-500", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-gray-500", icon: XCircle },
  rejected: { label: "Rejected", color: "bg-red-500", icon: XCircle },
}

export default function MyBookingsPage() {
  const [userRole] = useState<UserRole>("both") // In real app, this comes from auth
  const [activeTab, setActiveTab] = useState("dashboard")
  const [calendarOpen, setCalendarOpen] = useState(true)
  const [calendarView, setCalendarView] = useState<CalendarView>("week")
  const [calendarFilter, setCalendarFilter] = useState<CalendarFilter>("all")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [dashboardFilter, setDashboardFilter] = useState<"all" | "pending" | "active" | "completed">("all")
  const [requestsSubtab, setRequestsSubtab] = useState<"my" | "proposals" | "sent" | "browse">("my")

  // Filter bookings based on role
  const customerBookings = mockBookings.filter((b) => !b.isVendorBooking)
  const vendorBookings = mockBookings.filter((b) => b.isVendorBooking)
  const activeCustomerBookings = customerBookings.filter((b) =>
    ["pending", "accepted", "confirmed", "in_progress"].includes(b.status),
  )
  const activeVendorBookings = vendorBookings.filter((b) =>
    ["pending", "accepted", "confirmed", "in_progress"].includes(b.status),
  )
  const completedCustomerBookings = customerBookings.filter((b) =>
    ["completed", "cancelled", "rejected"].includes(b.status),
  )
  const completedVendorBookings = vendorBookings.filter((b) =>
    ["completed", "cancelled", "rejected"].includes(b.status),
  )

  // Dashboard stats
  const pendingActions = mockBookings.filter((b) => b.status === "pending" && b.isVendorBooking).length
  const activeVendorCount = activeVendorBookings.length
  const completedThisMonth = vendorBookings.filter((b) => b.status === "completed").length

  // Filtered list for dashboard
  const dashboardList = useMemo(() => {
    if (dashboardFilter === "pending") return vendorBookings.filter((b) => b.status === "pending")
    if (dashboardFilter === "active") return activeVendorBookings
    if (dashboardFilter === "completed") return vendorBookings.filter((b) => b.status === "completed")
    return vendorBookings.filter((b) => b.status === "pending").slice(0, 3)
  }, [dashboardFilter, vendorBookings, activeVendorBookings])

  // Calendar dates with bookings
  const bookingDates = mockBookings.map((b) => new Date(b.requestedStart))

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
  }

  // Booking Card Component
  const BookingCard = ({ booking, variant }: { booking: Booking; variant: "customer" | "vendor" }) => {
    const status = statusConfig[booking.status]
    const StatusIcon = status.icon
    const borderColor = variant === "customer" ? "border-l-blue-500" : "border-l-green-500"

    return (
      <Card className={cn("border-l-4 hover:shadow-md transition-shadow", borderColor)}>
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Service Image */}
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
              <img
                src={booking.service.image || "/placeholder.svg"}
                alt={booking.service.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-semibold text-sm line-clamp-1">{booking.service.title}</h3>
                  <p className="text-xs text-muted-foreground">#{booking.bookingNumber}</p>
                </div>
                <Badge className={cn("text-white text-xs", status.color)}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
              </div>

              {/* Counterparty */}
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={booking.counterparty.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{booking.counterparty.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">{booking.counterparty.name}</span>
              </div>

              {/* Date/Time and Price */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    {formatDate(booking.requestedStart)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(booking.requestedStart)}
                  </div>
                </div>
                <span className="font-semibold text-sm">
                  {booking.currency} {booking.totalPrice}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-end gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/bookings/${booking.id}`}>View Details</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </DropdownMenuItem>
                  {booking.status === "pending" && variant === "vendor" && (
                    <>
                      <DropdownMenuItem className="text-green-600">Accept</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Decline</DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/bookings/${booking.id}`}>View</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Service Request Card Component
  const ServiceRequestCard = ({ request, showActions = false }: { request: ServiceRequest; showActions?: boolean }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm line-clamp-1">{request.title}</h3>
              <Badge variant={request.status === "open" ? "default" : "secondary"}>{request.status}</Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{request.description}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {request.currency} {request.budgetMin} - {request.budgetMax}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {request.location}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {request.viewCount} views
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {request.proposalCount} proposals
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {showActions ? (
              <Button size="sm">Send Proposal</Button>
            ) : (
              <Button variant="outline" size="sm">
                View
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // Proposal Card Component
  const ProposalCard = ({ proposal }: { proposal: Proposal }) => (
    <Card className="hover:shadow-md transition-shadow border-l-4 border-l-amber-500">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={proposal.vendor.avatar || "/placeholder.svg"} />
            <AvatarFallback>{proposal.vendor.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <h3 className="font-semibold text-sm">{proposal.vendor.name}</h3>
                <p className="text-xs text-muted-foreground">For: {proposal.requestTitle}</p>
              </div>
              <Badge variant="outline">{proposal.status}</Badge>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-medium">{proposal.vendor.rating}</span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{proposal.message}</p>
            <div className="flex items-center justify-between">
              <span className="font-semibold">
                {proposal.currency} {proposal.price}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  Message
                </Button>
                <Button size="sm">Accept</Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">My Bookings</h1>
              <p className="text-sm text-muted-foreground">Manage all your booking interactions and service requests</p>
            </div>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <div className="flex flex-col gap-4">
              {/* Tab List - scrollable on mobile */}
              <div className="overflow-x-auto pb-2">
                <TabsList className="inline-flex h-auto p-1 bg-muted/50">
                  {userRole !== "customer" && (
                    <TabsTrigger value="dashboard" className="gap-2 px-4 py-2">
                      <LayoutDashboard className="h-4 w-4" />
                      <span className="hidden sm:inline">Dashboard</span>
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="customer" className="gap-2 px-4 py-2">
                    <ShoppingBag className="h-4 w-4" />
                    <span className="hidden sm:inline">As Customer</span>
                  </TabsTrigger>
                  {userRole !== "customer" && (
                    <TabsTrigger value="vendor" className="gap-2 px-4 py-2">
                      <Store className="h-4 w-4" />
                      <span className="hidden sm:inline">As Vendor</span>
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="completed" className="gap-2 px-4 py-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Completed</span>
                  </TabsTrigger>
                  <TabsTrigger value="requests" className="gap-2 px-4 py-2">
                    <Briefcase className="h-4 w-4" />
                    <span className="hidden sm:inline">Service Requests</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Collapsible Calendar */}
              <Collapsible open={calendarOpen} onOpenChange={setCalendarOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-5 w-5 text-primary" />
                          <CardTitle className="text-base">Calendar Overview</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Calendar filters */}
                          <div className="hidden md:flex items-center gap-1 mr-4">
                            <Button
                              variant={calendarFilter === "all" ? "secondary" : "ghost"}
                              size="sm"
                              className="h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                setCalendarFilter("all")
                              }}
                            >
                              All
                            </Button>
                            <Button
                              variant={calendarFilter === "customer" ? "secondary" : "ghost"}
                              size="sm"
                              className="h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                setCalendarFilter("customer")
                              }}
                            >
                              <span className="w-2 h-2 rounded-full bg-blue-500 mr-1" />
                              Customer
                            </Button>
                            {userRole !== "customer" && (
                              <Button
                                variant={calendarFilter === "vendor" ? "secondary" : "ghost"}
                                size="sm"
                                className="h-7 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setCalendarFilter("vendor")
                                }}
                              >
                                <span className="w-2 h-2 rounded-full bg-green-500 mr-1" />
                                Vendor
                              </Button>
                            )}
                          </div>
                          <ChevronDown className={cn("h-5 w-5 transition-transform", calendarOpen && "rotate-180")} />
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      {/* Calendar Controls */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent">
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            Today
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                          <span className="text-sm font-medium ml-2">December 2024</span>
                        </div>
                        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                          <Button
                            variant={calendarView === "week" ? "secondary" : "ghost"}
                            size="sm"
                            className="h-7"
                            onClick={() => setCalendarView("week")}
                          >
                            Week
                          </Button>
                          <Button
                            variant={calendarView === "month" ? "secondary" : "ghost"}
                            size="sm"
                            className="h-7"
                            onClick={() => setCalendarView("month")}
                          >
                            Month
                          </Button>
                        </div>
                      </div>

                      {/* Calendar Grid */}
                      {calendarView === "month" ? (
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                          className="rounded-md border w-full"
                          modifiers={{
                            hasBooking: bookingDates,
                          }}
                          modifiersStyles={{
                            hasBooking: {
                              fontWeight: "bold",
                              backgroundColor: "hsl(var(--primary) / 0.1)",
                            },
                          }}
                        />
                      ) : (
                        /* Week View */
                        <div className="border rounded-lg overflow-hidden">
                          <div className="grid grid-cols-7 border-b bg-muted/50">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                              <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground">
                                {day}
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-cols-7">
                            {[8, 9, 10, 11, 12, 13, 14].map((date) => (
                              <div
                                key={date}
                                className={cn(
                                  "min-h-24 p-2 border-r border-b last:border-r-0 cursor-pointer hover:bg-muted/30 transition-colors",
                                  date === 12 && "bg-primary/5",
                                )}
                              >
                                <span className={cn("text-sm font-medium", date === 12 && "text-primary")}>{date}</span>
                                {date === 12 && (
                                  <div className="mt-1 space-y-1">
                                    <div className="text-xs bg-green-500/20 text-green-700 dark:text-green-400 rounded px-1 py-0.5 truncate">
                                      9:00 Training
                                    </div>
                                  </div>
                                )}
                                {date === 15 && (
                                  <div className="mt-1 space-y-1">
                                    <div className="text-xs bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded px-1 py-0.5 truncate">
                                      10:00 Cleaning
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Legend */}
                      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded-full bg-blue-500" />
                          Customer bookings
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded-full bg-green-500" />
                          Vendor bookings
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </div>

            {/* Dashboard Tab (Vendor Only) */}
            {userRole !== "customer" && (
              <TabsContent value="dashboard" className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      dashboardFilter === "pending" && "ring-2 ring-amber-500",
                    )}
                    onClick={() => setDashboardFilter(dashboardFilter === "pending" ? "all" : "pending")}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Pending Actions</p>
                          <p className="text-3xl font-bold text-amber-500">{pendingActions}</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                          <AlertCircle className="h-6 w-6 text-amber-500" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Bookings needing response</p>
                    </CardContent>
                  </Card>

                  <Card
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      dashboardFilter === "active" && "ring-2 ring-green-500",
                    )}
                    onClick={() => setDashboardFilter(dashboardFilter === "active" ? "all" : "active")}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Active Bookings</p>
                          <p className="text-3xl font-bold text-green-500">{activeVendorCount}</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                          <TrendingUp className="h-6 w-6 text-green-500" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Currently in progress</p>
                    </CardContent>
                  </Card>

                  <Card
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      dashboardFilter === "completed" && "ring-2 ring-blue-500",
                    )}
                    onClick={() => setDashboardFilter(dashboardFilter === "completed" ? "all" : "completed")}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Completed This Month</p>
                          <p className="text-3xl font-bold text-blue-500">{completedThisMonth}</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <CheckCircle2 className="h-6 w-6 text-blue-500" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Services delivered</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-base">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => setActiveTab("vendor")}>
                        <Store className="h-4 w-4 mr-2" />
                        View Vendor Bookings
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/vendor/calendar">
                          <CalendarDays className="h-4 w-4 mr-2" />
                          Manage Calendar
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/listings/new">
                          <Plus className="h-4 w-4 mr-2" />
                          Create New Service
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Action List */}
                <Card>
                  <CardHeader className="py-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-base">
                      {dashboardFilter === "all"
                        ? "Recent Pending Bookings"
                        : dashboardFilter === "pending"
                          ? "All Pending Bookings"
                          : dashboardFilter === "active"
                            ? "All Active Bookings"
                            : "Completed Bookings"}
                    </CardTitle>
                    {dashboardFilter !== "all" && (
                      <Button variant="ghost" size="sm" onClick={() => setDashboardFilter("all")}>
                        Clear Filter
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {dashboardList.length > 0 ? (
                      dashboardList.map((booking) => (
                        <BookingCard key={booking.id} booking={booking} variant="vendor" />
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No bookings in this category</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* As Customer Tab */}
            <TabsContent value="customer" className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">Active Bookings</h2>
                <span className="text-sm text-muted-foreground">{activeCustomerBookings.length} bookings</span>
              </div>
              {activeCustomerBookings.length > 0 ? (
                <div className="space-y-3">
                  {activeCustomerBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} variant="customer" />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground mb-4">No active bookings as a customer</p>
                    <Button asChild>
                      <Link href="/services">Browse Services</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* As Vendor Tab */}
            {userRole !== "customer" && (
              <TabsContent value="vendor" className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold">Incoming Bookings</h2>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/vendor/bookings">
                      <Settings className="h-4 w-4 mr-2" />
                      Calendar & Management
                    </Link>
                  </Button>
                </div>
                {activeVendorBookings.length > 0 ? (
                  <div className="space-y-3">
                    {activeVendorBookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} variant="vendor" />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Store className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground mb-4">No incoming bookings at the moment</p>
                      <Button asChild>
                        <Link href="/listings/new">Create a Listing</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )}

            {/* Completed Tab */}
            <TabsContent value="completed" className="space-y-4">
              <Accordion type="multiple" defaultValue={["customer", "vendor"]} className="space-y-4">
                <AccordionItem value="customer" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500" />
                      <span>As Customer</span>
                      <Badge variant="secondary" className="ml-2">
                        {completedCustomerBookings.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-2">
                    {completedCustomerBookings.length > 0 ? (
                      completedCustomerBookings.map((booking) => (
                        <BookingCard key={booking.id} booking={booking} variant="customer" />
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No completed bookings</p>
                    )}
                  </AccordionContent>
                </AccordionItem>

                {userRole !== "customer" && (
                  <AccordionItem value="vendor" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500" />
                        <span>As Vendor</span>
                        <Badge variant="secondary" className="ml-2">
                          {completedVendorBookings.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-2">
                      {completedVendorBookings.length > 0 ? (
                        completedVendorBookings.map((booking) => (
                          <BookingCard key={booking.id} booking={booking} variant="vendor" />
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No completed bookings</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </TabsContent>

            {/* Service Requests Tab */}
            <TabsContent value="requests" className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">Service Requests</h2>
                <Button size="sm" asChild>
                  <Link href="/request/assistant">
                    <Plus className="h-4 w-4 mr-2" />
                    New Request
                  </Link>
                </Button>
              </div>

              {/* Subtabs */}
              <div className="flex gap-1 bg-muted/50 rounded-lg p-1 overflow-x-auto">
                <Button
                  variant={requestsSubtab === "my" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setRequestsSubtab("my")}
                >
                  My Requests
                </Button>
                <Button
                  variant={requestsSubtab === "proposals" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setRequestsSubtab("proposals")}
                  className="relative"
                >
                  Proposals
                  {mockProposals.length > 0 && (
                    <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-primary">
                      {mockProposals.length}
                    </Badge>
                  )}
                </Button>
                {userRole !== "customer" && (
                  <>
                    <Button
                      variant={requestsSubtab === "sent" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setRequestsSubtab("sent")}
                    >
                      Sent
                    </Button>
                    <Button
                      variant={requestsSubtab === "browse" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setRequestsSubtab("browse")}
                    >
                      Browse
                    </Button>
                  </>
                )}
              </div>

              {/* Subtab Content */}
              {requestsSubtab === "my" && (
                <div className="space-y-3">
                  {mockServiceRequests.length > 0 ? (
                    mockServiceRequests.map((request) => <ServiceRequestCard key={request.id} request={request} />)
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground mb-4">No service requests yet</p>
                        <Button asChild>
                          <Link href="/request/assistant">Create a Request</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {requestsSubtab === "proposals" && (
                <div className="space-y-3">
                  {mockProposals.length > 0 ? (
                    mockProposals.map((proposal) => <ProposalCard key={proposal.id} proposal={proposal} />)
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Send className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">No proposals received yet</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {requestsSubtab === "sent" && userRole !== "customer" && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Send className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground mb-4">No proposals sent yet</p>
                    <Button variant="outline" onClick={() => setRequestsSubtab("browse")}>
                      Browse Requests
                    </Button>
                  </CardContent>
                </Card>
              )}

              {requestsSubtab === "browse" && userRole !== "customer" && (
                <div className="space-y-3">
                  {mockBrowseRequests.map((request) => (
                    <ServiceRequestCard key={request.id} request={request} showActions />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  )
}
