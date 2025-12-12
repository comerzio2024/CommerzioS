"use client"

import { useState } from "react"
import Link from "next/link"
import { Bug, ExternalLink, Server, Layout } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const apiEndpoints = [
  { path: "/api/booking-assistant", method: "POST", label: "Booking Assistant" },
  { path: "/api/dispute-resolution", method: "POST", label: "Dispute Resolution" },
  { path: "/api/listing-assistant", method: "POST", label: "Listing Assistant" },
  { path: "/api/request-assistant", method: "POST", label: "Request Assistant" },
]

const pages = [
  { path: "/", label: "Home" },
  { path: "/services", label: "Services" },
  { path: "/services/1", label: "Service Detail" },
  { path: "/services/1/book", label: "Service Booking Wizard" },
  { path: "/booking-success", label: "Booking Success" },
  { path: "/dashboard", label: "Dashboard" },
  { path: "/admin", label: "Admin" },
  { path: "/book/assistant", label: "Book Assistant (AI)" },
  { path: "/booking/new", label: "New Booking (Legacy)" },
  { path: "/disputes", label: "Disputes" },
  { path: "/favorites", label: "Favorites" },
  { path: "/help", label: "Help" },
  { path: "/how-it-works", label: "How It Works" },
  { path: "/listings/assistant", label: "Listings Assistant" },
  { path: "/listings/new", label: "New Listing" },
  { path: "/messages", label: "Messages" },
  { path: "/my-bookings", label: "My Bookings" },
  { path: "/notifications", label: "Notifications" },
  { path: "/profile", label: "Profile" },
  { path: "/request/assistant", label: "Request Assistant" },
  { path: "/trust-safety", label: "Trust & Safety" },
  { path: "/vendor/dashboard", label: "Vendor Dashboard" },
]

export function DevMenu() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg border-2 border-primary bg-background hover:bg-primary hover:text-primary-foreground"
          >
            <Bug className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 max-h-[70vh] overflow-y-auto">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Dev Testing Menu
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
              <Server className="h-3 w-3" />
              API Endpoints
            </DropdownMenuLabel>
            {apiEndpoints.map((endpoint) => (
              <DropdownMenuItem key={endpoint.path} asChild>
                <Link href={endpoint.path} target="_blank" className="flex items-center justify-between">
                  <span className="text-sm">{endpoint.label}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px]">{endpoint.method}</span>
                    <ExternalLink className="h-3 w-3" />
                  </span>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
              <Layout className="h-3 w-3" />
              Pages
            </DropdownMenuLabel>
            {pages.map((page) => (
              <DropdownMenuItem key={page.path} asChild>
                <Link href={page.path} className="flex items-center justify-between">
                  <span className="text-sm">{page.label}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{page.path}</span>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
