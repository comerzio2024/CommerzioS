/**
 * Unified Bookings Page
 * 
 * Comprehensive view with clear tabs:
 * - As Customer (active bookings I have made)
 * - As Vendor (customers who booked my services) - only shown if user is a vendor
 * - Completed as Customer (completed services I have booked)
 * - Completed as Vendor (completed services I have provided) - only shown if user is a vendor
 * - Service Requests (community service requests)
 * - Vendor Dashboard (quick stats and management) - only shown if user is a vendor
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { fetchApi } from "@/lib/config";
import { 
  Calendar as CalendarIcon,
  Clock, 
  MapPin,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Star,
  Loader2,
  Package,
  User,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  MessageSquare,
  ExternalLink,
  Megaphone,
  LayoutDashboard,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";

interface Booking {
  id: string;
  bookingNumber: string;
  status: string;
  requestedStartTime: string;
  requestedEndTime: string;
  confirmedStartTime: string | null;
  confirmedEndTime: string | null;
  customerMessage: string | null;
  vendorMessage: string | null;
  totalPrice: string | null;
  currency: string;
  createdAt: string;
  completedAt?: string | null;
  customerId?: string;
  vendorId?: string;
  serviceId?: string;
  service?: {
    id: string;
    title: string;
    price: string;
    images: string[];
  };
  vendor?: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  bookingType?: "customer" | "vendor";
}

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  budget: string | null;
  currency: string;
  location: string | null;
  status: string;
  createdAt: string;
  responseCount?: number;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { 
    label: "Pending", 
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: <Clock className="w-4 h-4" />
  },
  accepted: { 
    label: "Accepted", 
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    icon: <CheckCircle2 className="w-4 h-4" />
  },
  alternative_proposed: { 
    label: "Alternative", 
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    icon: <RefreshCw className="w-4 h-4" />
  },
  confirmed: { 
    label: "Confirmed", 
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    icon: <CheckCircle2 className="w-4 h-4" />
  },
  in_progress: { 
    label: "In Progress", 
    color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
    icon: <Loader2 className="w-4 h-4 animate-spin" />
  },
  completed: { 
    label: "Completed", 
    color: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
    icon: <CheckCircle2 className="w-4 h-4" />
  },
  cancelled: { 
    label: "Cancelled", 
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    icon: <XCircle className="w-4 h-4" />
  },
  rejected: { 
    label: "Rejected", 
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    icon: <XCircle className="w-4 h-4" />
  },
};

export default function MyBookingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);
  
  const [activeTab, setActiveTab] = useState<string>("as-customer");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Scroll to content when tab changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeTab]);

  // Check if user is a vendor (has services)
  const { data: userServices = [] } = useQuery<Array<{ id: string; title: string }>>({
    queryKey: ["my-services-list"],
    queryFn: async () => {
      const res = await fetchApi("/api/services?owner=me");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
  });

  const isVendor = userServices.length > 0;

  // Fetch customer bookings (services I have booked) - active only
  const { data: customerActiveBookings = [], isLoading: customerActiveLoading } = useQuery<Booking[]>({
    queryKey: ["my-bookings-customer-active"],
    queryFn: async () => {
      const res = await fetchApi("/api/bookings/my");
      if (!res.ok) return [];
      const data = await res.json();
      return (Array.isArray(data) ? data : [])
        .filter((b: Booking) => ["pending", "accepted", "confirmed", "in_progress", "alternative_proposed"].includes(b.status))
        .map((b: Booking) => ({ ...b, bookingType: "customer" as const }));
    },
    enabled: !!user,
  });

  // Fetch customer bookings - completed only
  const { data: customerCompletedBookings = [], isLoading: customerCompletedLoading } = useQuery<Booking[]>({
    queryKey: ["my-bookings-customer-completed"],
    queryFn: async () => {
      const res = await fetchApi("/api/bookings/my");
      if (!res.ok) return [];
      const data = await res.json();
      return (Array.isArray(data) ? data : [])
        .filter((b: Booking) => ["completed", "cancelled", "rejected"].includes(b.status))
        .map((b: Booking) => ({ ...b, bookingType: "customer" as const }));
    },
    enabled: !!user,
  });

  // Fetch vendor bookings (customers who booked my services) - active only
  const { data: vendorActiveBookings = [], isLoading: vendorActiveLoading } = useQuery<Booking[]>({
    queryKey: ["my-bookings-vendor-active"],
    queryFn: async () => {
      const res = await fetchApi("/api/vendor/bookings?limit=500");
      if (!res.ok) return [];
      const data = await res.json();
      return (Array.isArray(data) ? data : [])
        .filter((b: Booking) => ["pending", "accepted", "confirmed", "in_progress", "alternative_proposed"].includes(b.status))
        .map((b: Booking) => ({ ...b, bookingType: "vendor" as const }));
    },
    enabled: !!user && isVendor,
  });

  // Fetch vendor bookings - completed only
  const { data: vendorCompletedBookings = [], isLoading: vendorCompletedLoading } = useQuery<Booking[]>({
    queryKey: ["my-bookings-vendor-completed"],
    queryFn: async () => {
      const res = await fetchApi("/api/vendor/bookings?limit=500");
      if (!res.ok) return [];
      const data = await res.json();
      return (Array.isArray(data) ? data : [])
        .filter((b: Booking) => ["completed", "cancelled", "rejected"].includes(b.status))
        .map((b: Booking) => ({ ...b, bookingType: "vendor" as const }));
    },
    enabled: !!user && isVendor,
  });

  // Fetch service requests - API returns { requests: [], total: number }
  const { data: serviceRequestsData, isLoading: requestsLoading } = useQuery<{ requests: ServiceRequest[]; total: number }>({
    queryKey: ["service-requests"],
    queryFn: async () => {
      const res = await fetchApi("/api/service-requests");
      if (!res.ok) return { requests: [], total: 0 };
      return res.json();
    },
    enabled: !!user,
  });
  const serviceRequests = serviceRequestsData?.requests || [];

  // Fetch vendor stats for dashboard
  const { data: vendorStats } = useQuery({
    queryKey: ["vendor-stats"],
    queryFn: async () => {
      const res = await fetchApi("/api/vendor/bookings/pending-count");
      if (!res.ok) return { count: 0 };
      return res.json();
    },
    enabled: !!user && isVendor,
  });

  // Sort bookings by date
  const sortByDate = (bookings: Booking[]) => {
    return [...bookings].sort((a, b) => {
      const dateA = new Date(a.confirmedStartTime || a.requestedStartTime).getTime();
      const dateB = new Date(b.confirmedStartTime || b.requestedStartTime).getTime();
      return dateB - dateA;
    });
  };

  // Handle chat navigation
  const handleChat = (booking: Booking) => {
    if (booking.bookingType === "customer") {
      const vendorId = booking.vendorId || booking.vendor?.id;
      if (vendorId) {
        setLocation(`/chat?vendor=${vendorId}&booking=${booking.id}&service=${booking.serviceId || booking.service?.id}`);
      }
    } else {
      const customerId = booking.customerId || booking.customer?.id;
      if (customerId) {
        setLocation(`/chat?customer=${customerId}&booking=${booking.id}&service=${booking.serviceId || booking.service?.id}`);
      }
    }
    setSelectedBooking(null);
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-8 px-4">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto py-8 px-4 text-center">
          <Card>
            <CardContent className="py-16">
              <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Sign in to view your bookings</h2>
              <p className="text-muted-foreground mb-4">Track and manage all your service bookings in one place</p>
              <Button onClick={() => setLocation("/login")}>Sign In</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Booking card component
  const BookingListItem = ({ booking }: { booking: Booking }) => {
    const isCustomerBooking = booking.bookingType === "customer";
    const statusInfo = statusConfig[booking.status] || statusConfig.pending;
    const dateTime = new Date(booking.confirmedStartTime || booking.requestedStartTime);

    return (
      <Card 
        className={cn(
          "hover:shadow-md transition-shadow cursor-pointer",
          isCustomerBooking 
            ? "border-l-4 border-l-blue-500" 
            : "border-l-4 border-l-green-500"
        )}
        onClick={() => setSelectedBooking(booking)}
      >
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {booking.service?.images?.[0] ? (
              <div className="w-full sm:w-20 h-20 flex-shrink-0">
                <img
                  src={booking.service.images[0]}
                  alt={booking.service.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            ) : (
              <div className="w-full sm:w-20 h-20 flex-shrink-0 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-semibold truncate">{booking.service?.title || "Service"}</h3>
                  <span className="text-xs text-muted-foreground">#{booking.bookingNumber}</span>
                </div>
                <Badge className={cn("flex-shrink-0", statusInfo.color)}>
                  {statusInfo.icon}
                  <span className="ml-1">{statusInfo.label}</span>
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                {isCustomerBooking ? (
                  <>
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={booking.vendor?.profileImageUrl} />
                      <AvatarFallback className="text-xs">
                        {booking.vendor?.firstName?.[0]}{booking.vendor?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span>with {booking.vendor?.firstName} {booking.vendor?.lastName}</span>
                  </>
                ) : (
                  <>
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={booking.customer?.profileImageUrl} />
                      <AvatarFallback className="text-xs">
                        {booking.customer?.firstName?.[0]}{booking.customer?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span>from {booking.customer?.firstName} {booking.customer?.lastName}</span>
                  </>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <CalendarIcon className="w-4 h-4" />
                  {format(dateTime, "MMM d, yyyy")}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {format(dateTime, "HH:mm")}
                </div>
                {booking.totalPrice && (
                  <div className="flex items-center gap-1 font-medium">
                    {booking.currency} {parseFloat(booking.totalPrice).toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ message, action }: { message: string; action?: React.ReactNode }) => (
    <Card>
      <CardContent className="py-12 text-center">
        <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
        <p className="text-muted-foreground">{message}</p>
        {action && <div className="mt-4">{action}</div>}
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-950 dark:to-indigo-950">
        <div className="container mx-auto py-8 px-4 max-w-6xl" ref={contentRef}>
          <div className="flex items-center gap-4 mb-6">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <CalendarIcon className="w-8 h-8 text-primary" />
                My Bookings
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage all your bookings in one place
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="flex flex-wrap h-auto gap-1 p-1 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
              <TabsTrigger value="as-customer" className="gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800">
                <ArrowUpRight className="w-4 h-4" />
                As Customer
                {customerActiveBookings.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{customerActiveBookings.length}</Badge>
                )}
              </TabsTrigger>
              
              {isVendor && (
                <TabsTrigger value="as-vendor" className="gap-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-800">
                  <ArrowDownLeft className="w-4 h-4" />
                  As Vendor
                  {vendorActiveBookings.length > 0 && (
                    <Badge variant="secondary" className="ml-1">{vendorActiveBookings.length}</Badge>
                  )}
                </TabsTrigger>
              )}
              
              <TabsTrigger value="completed-customer" className="gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Completed (Customer)
              </TabsTrigger>
              
              {isVendor && (
                <TabsTrigger value="completed-vendor" className="gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Completed (Vendor)
                </TabsTrigger>
              )}
              
              <TabsTrigger value="service-requests" className="gap-2">
                <Megaphone className="w-4 h-4" />
                Service Requests
              </TabsTrigger>
              
              {isVendor && (
                <TabsTrigger value="dashboard" className="gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="as-customer" className="space-y-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ArrowUpRight className="w-5 h-5 text-blue-500" />
                    Active Bookings (As Customer)
                  </CardTitle>
                  <CardDescription>Services you have booked from other vendors</CardDescription>
                </CardHeader>
              </Card>
              
              {customerActiveLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                </div>
              ) : customerActiveBookings.length === 0 ? (
                <EmptyState 
                  message="No active bookings as a customer"
                  action={<Button onClick={() => setLocation("/")}>Browse Services</Button>}
                />
              ) : (
                <div className="space-y-4">
                  {sortByDate(customerActiveBookings).map(booking => (
                    <BookingListItem key={booking.id} booking={booking} />
                  ))}
                </div>
              )}
            </TabsContent>

            {isVendor && (
              <TabsContent value="as-vendor" className="space-y-4">
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <ArrowDownLeft className="w-5 h-5 text-green-500" />
                      Active Bookings (As Vendor)
                    </CardTitle>
                    <CardDescription>Customers who have booked your services</CardDescription>
                  </CardHeader>
                </Card>
                
                {vendorActiveLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                  </div>
                ) : vendorActiveBookings.length === 0 ? (
                  <EmptyState message="No active bookings as a vendor" />
                ) : (
                  <div className="space-y-4">
                    {sortByDate(vendorActiveBookings).map(booking => (
                      <BookingListItem key={booking.id} booking={booking} />
                    ))}
                  </div>
                )}
              </TabsContent>
            )}

            <TabsContent value="completed-customer" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle2 className="w-5 h-5 text-slate-500" />
                    Completed Bookings (As Customer)
                  </CardTitle>
                  <CardDescription>Past services you have booked</CardDescription>
                </CardHeader>
              </Card>
              
              {customerCompletedLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                </div>
              ) : customerCompletedBookings.length === 0 ? (
                <EmptyState message="No completed bookings yet" />
              ) : (
                <div className="space-y-4">
                  {sortByDate(customerCompletedBookings).map(booking => (
                    <BookingListItem key={booking.id} booking={booking} />
                  ))}
                </div>
              )}
            </TabsContent>

            {isVendor && (
              <TabsContent value="completed-vendor" className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CheckCircle2 className="w-5 h-5 text-slate-500" />
                      Completed Bookings (As Vendor)
                    </CardTitle>
                    <CardDescription>Past services you have provided</CardDescription>
                  </CardHeader>
                </Card>
                
                {vendorCompletedLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                  </div>
                ) : vendorCompletedBookings.length === 0 ? (
                  <EmptyState message="No completed bookings as a vendor yet" />
                ) : (
                  <div className="space-y-4">
                    {sortByDate(vendorCompletedBookings).map(booking => (
                      <BookingListItem key={booking.id} booking={booking} />
                    ))}
                  </div>
                )}
              </TabsContent>
            )}

            <TabsContent value="service-requests" className="space-y-4">
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Megaphone className="w-5 h-5 text-orange-500" />
                      Service Requests
                    </CardTitle>
                    <CardDescription>Community requests for services</CardDescription>
                  </div>
                  <Link href="/service-requests">
                    <Button size="sm">
                      <Megaphone className="w-4 h-4 mr-2" />
                      Create Request
                    </Button>
                  </Link>
                </CardHeader>
              </Card>
              
              {requestsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                </div>
              ) : serviceRequests.length === 0 ? (
                <EmptyState 
                  message="No service requests yet"
                  action={
                    <Link href="/service-requests">
                      <Button>Create Service Request</Button>
                    </Link>
                  }
                />
              ) : (
                <div className="space-y-4">
                  {serviceRequests.map(request => (
                    <Card key={request.id} className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-orange-500">
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold">{request.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{request.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              {request.budget && (
                                <span className="font-medium text-green-600">
                                  {request.currency} {request.budget}
                                </span>
                              )}
                              {request.location && (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <MapPin className="w-3 h-3" />
                                  {request.location}
                                </span>
                              )}
                              <span className="text-muted-foreground">
                                {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                          <Badge variant={request.status === "open" ? "default" : "secondary"}>
                            {request.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {isVendor && (
              <TabsContent value="dashboard" className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="border-l-4 border-l-yellow-500">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Pending</p>
                          <p className="text-2xl font-bold">{vendorStats?.count || 0}</p>
                        </div>
                        <Clock className="w-8 h-8 text-yellow-500 opacity-50" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Active</p>
                          <p className="text-2xl font-bold">{vendorActiveBookings.length}</p>
                        </div>
                        <RefreshCw className="w-8 h-8 text-blue-500 opacity-50" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Completed</p>
                          <p className="text-2xl font-bold">{vendorCompletedBookings.filter(b => b.status === "completed").length}</p>
                        </div>
                        <CheckCircle2 className="w-8 h-8 text-green-500 opacity-50" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Services</p>
                          <p className="text-2xl font-bold">{userServices.length}</p>
                        </div>
                        <Package className="w-8 h-8 text-purple-500 opacity-50" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Link href="/vendor/bookings">
                        <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                          <CalendarIcon className="w-6 h-6" />
                          <span>Manage Bookings</span>
                        </Button>
                      </Link>
                      <Link href="/profile?tab=services">
                        <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                          <Package className="w-6 h-6" />
                          <span>My Services</span>
                        </Button>
                      </Link>
                      <Link href="/profile?tab=reviews">
                        <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                          <Star className="w-6 h-6" />
                          <span>Reviews</span>
                        </Button>
                      </Link>
                      <Link href="/profile?tab=payments">
                        <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                          <DollarSign className="w-6 h-6" />
                          <span>Payments</span>
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {vendorActiveBookings.filter(b => b.status === "pending").length > 0 && (
                  <Card className="border-2 border-yellow-200 dark:border-yellow-800">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                        Pending Requests
                      </CardTitle>
                      <CardDescription>These bookings need your response</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {vendorActiveBookings
                        .filter(b => b.status === "pending")
                        .slice(0, 3)
                        .map(booking => (
                          <BookingListItem key={booking.id} booking={booking} />
                        ))}
                      {vendorActiveBookings.filter(b => b.status === "pending").length > 3 && (
                        <Button variant="link" className="w-full" onClick={() => setActiveTab("as-vendor")}>
                          View all pending bookings
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedBooking && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Booking #{selectedBooking.bookingNumber}
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      selectedBooking.bookingType === "customer"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-green-50 text-green-700 border-green-200"
                    )}
                  >
                    {selectedBooking.bookingType === "customer" ? "As Customer" : "As Vendor"}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge className={statusConfig[selectedBooking.status]?.color}>
                    {statusConfig[selectedBooking.status]?.icon}
                    <span className="ml-1">{statusConfig[selectedBooking.status]?.label}</span>
                  </Badge>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Service</h4>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    {selectedBooking.service?.images?.[0] ? (
                      <img
                        src={selectedBooking.service.images[0]}
                        alt={selectedBooking.service.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center">
                        <Package className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{selectedBooking.service?.title}</p>
                      {selectedBooking.totalPrice && (
                        <p className="text-sm text-muted-foreground">
                          {selectedBooking.currency} {parseFloat(selectedBooking.totalPrice).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">
                    {selectedBooking.bookingType === "customer" ? "Vendor" : "Customer"}
                  </h4>
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <Avatar>
                      <AvatarImage 
                        src={selectedBooking.bookingType === "customer" 
                          ? selectedBooking.vendor?.profileImageUrl 
                          : selectedBooking.customer?.profileImageUrl
                        } 
                      />
                      <AvatarFallback>
                        {selectedBooking.bookingType === "customer"
                          ? `${selectedBooking.vendor?.firstName?.[0]}${selectedBooking.vendor?.lastName?.[0]}`
                          : `${selectedBooking.customer?.firstName?.[0]}${selectedBooking.customer?.lastName?.[0]}`
                        }
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <span className="font-medium">
                        {selectedBooking.bookingType === "customer"
                          ? `${selectedBooking.vendor?.firstName} ${selectedBooking.vendor?.lastName}`
                          : `${selectedBooking.customer?.firstName} ${selectedBooking.customer?.lastName}`
                        }
                      </span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleChat(selectedBooking)}>
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Chat
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Schedule</h4>
                  <div className="space-y-1 text-sm p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                      {format(
                        parseISO(selectedBooking.confirmedStartTime || selectedBooking.requestedStartTime),
                        "EEEE, MMMM d, yyyy"
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      {format(
                        parseISO(selectedBooking.confirmedStartTime || selectedBooking.requestedStartTime),
                        "HH:mm"
                      )}
                      {" - "}
                      {format(
                        parseISO(selectedBooking.confirmedEndTime || selectedBooking.requestedEndTime),
                        "HH:mm"
                      )}
                    </div>
                  </div>
                </div>
                
                {(selectedBooking.customerMessage || selectedBooking.vendorMessage) && (
                  <div>
                    <h4 className="font-medium mb-2">Messages</h4>
                    <div className="space-y-2 text-sm">
                      {selectedBooking.customerMessage && (
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <span className="font-medium">Customer:</span> {selectedBooking.customerMessage}
                        </div>
                      )}
                      {selectedBooking.vendorMessage && (
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                          <span className="font-medium">Vendor:</span> {selectedBooking.vendorMessage}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                <Button variant="outline" onClick={() => setSelectedBooking(null)}>
                  Close
                </Button>
                <Link href={selectedBooking.bookingType === "customer" ? `/bookings?booking=${selectedBooking.id}` : `/vendor/bookings?booking=${selectedBooking.id}`}>
                  <Button>
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Full Details
                  </Button>
                </Link>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
