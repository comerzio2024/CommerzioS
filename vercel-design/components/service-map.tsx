"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Star, Search, List, Map, Navigation, Phone, Clock, ChevronRight, Locate } from "lucide-react"

const providers = [
  {
    id: 1,
    name: "Sparkle Clean Pro",
    category: "Home Services",
    rating: 4.9,
    reviews: 234,
    distance: "0.8 km",
    address: "Bahnhofstrasse 42, 8001 Zurich",
    phone: "+41 44 123 4567",
    hours: "Mon-Sat 8:00-18:00",
    available: true,
    lat: 47.3769,
    lng: 8.5417,
  },
  {
    id: 2,
    name: "SwissPlumb AG",
    category: "Plumbing",
    rating: 4.8,
    reviews: 189,
    distance: "1.2 km",
    address: "Limmatstrasse 78, 8005 Zurich",
    phone: "+41 44 234 5678",
    hours: "Mon-Fri 7:00-19:00",
    available: true,
    lat: 47.3849,
    lng: 8.5302,
  },
  {
    id: 3,
    name: "TechFix Solutions",
    category: "Tech Support",
    rating: 4.8,
    reviews: 267,
    distance: "1.5 km",
    address: "Europaallee 21, 8004 Zurich",
    phone: "+41 44 345 6789",
    hours: "Mon-Sun 9:00-21:00",
    available: true,
    lat: 47.3782,
    lng: 8.532,
  },
  {
    id: 4,
    name: "FitLife Coaching",
    category: "Health & Wellness",
    rating: 5.0,
    reviews: 156,
    distance: "2.1 km",
    address: "Seefeldstrasse 123, 8008 Zurich",
    phone: "+41 44 456 7890",
    hours: "Mon-Sat 6:00-22:00",
    available: false,
    lat: 47.3545,
    lng: 8.5512,
  },
  {
    id: 5,
    name: "Academic Excellence",
    category: "Education",
    rating: 4.9,
    reviews: 312,
    distance: "2.8 km",
    address: "Universitätstrasse 15, 8006 Zurich",
    phone: "+41 44 567 8901",
    hours: "Mon-Fri 10:00-20:00",
    available: true,
    lat: 47.3967,
    lng: 8.5481,
  },
]

export function ServiceMap() {
  const [view, setView] = useState<"map" | "list">("map")
  const [selectedProvider, setSelectedProvider] = useState<number | null>(1)
  const [searchLocation, setSearchLocation] = useState("Zurich, Switzerland")

  const selectedData = providers.find((p) => p.id === selectedProvider)

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <Badge className="mb-3 bg-gradient-to-r from-accent to-success text-white border-0 px-4 py-1.5">
            <MapPin className="h-3.5 w-3.5 mr-1.5" />
            Near You
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Find Services Near You</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover trusted service providers in your neighborhood
          </p>
        </div>

        {/* Search & View Toggle */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter your location..."
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="pl-11 pr-11 h-12"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 transition-colors">
              <Locate className="h-5 w-5" />
            </button>
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setView("map")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                view === "map" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
              }`}
            >
              <Map className="h-4 w-4" />
              Map View
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                view === "list" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
              }`}
            >
              <List className="h-4 w-4" />
              List View
            </button>
          </div>
        </div>

        {/* Map & List Container */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map Area */}
          <div className={`lg:col-span-2 ${view === "list" ? "hidden lg:block" : ""}`}>
            <Card className="overflow-hidden border-border/50">
              <div className="relative aspect-[16/10] lg:aspect-[16/9] bg-muted">
                {/* Stylized Map Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5">
                  <svg
                    className="absolute inset-0 w-full h-full opacity-30"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    {/* Grid lines */}
                    {Array.from({ length: 10 }).map((_, i) => (
                      <line
                        key={`h-${i}`}
                        x1="0"
                        y1={i * 10}
                        x2="100"
                        y2={i * 10}
                        stroke="currentColor"
                        strokeWidth="0.1"
                        className="text-border"
                      />
                    ))}
                    {Array.from({ length: 10 }).map((_, i) => (
                      <line
                        key={`v-${i}`}
                        x1={i * 10}
                        y1="0"
                        x2={i * 10}
                        y2="100"
                        stroke="currentColor"
                        strokeWidth="0.1"
                        className="text-border"
                      />
                    ))}
                  </svg>

                  {/* Provider Markers */}
                  {providers.map((provider, index) => {
                    const positions = [
                      { top: "35%", left: "45%" },
                      { top: "25%", left: "35%" },
                      { top: "40%", left: "55%" },
                      { top: "60%", left: "65%" },
                      { top: "20%", left: "60%" },
                    ]
                    const pos = positions[index % positions.length]

                    return (
                      <button
                        key={provider.id}
                        onClick={() => setSelectedProvider(provider.id)}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                          selectedProvider === provider.id ? "z-20 scale-125" : "z-10 hover:scale-110"
                        }`}
                        style={{ top: pos.top, left: pos.left }}
                      >
                        <div className={`relative ${selectedProvider === provider.id ? "animate-pulse" : ""}`}>
                          {/* Pulse ring for selected */}
                          {selectedProvider === provider.id && (
                            <div className="absolute inset-0 -m-2 rounded-full bg-primary/20 animate-ping" />
                          )}
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                              selectedProvider === provider.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-card text-foreground border border-border hover:bg-primary hover:text-primary-foreground"
                            }`}
                          >
                            <MapPin className="h-5 w-5" />
                          </div>
                          {/* Label */}
                          <div
                            className={`absolute left-1/2 -translate-x-1/2 top-full mt-1 whitespace-nowrap text-xs font-medium px-2 py-1 rounded-full transition-opacity ${
                              selectedProvider === provider.id
                                ? "bg-primary text-primary-foreground opacity-100"
                                : "bg-card border border-border opacity-0 group-hover:opacity-100"
                            }`}
                          >
                            {provider.name}
                          </div>
                        </div>
                      </button>
                    )
                  })}

                  {/* User Location Marker */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
                    <div className="relative">
                      <div className="absolute inset-0 -m-3 rounded-full bg-accent/30 animate-ping" />
                      <div className="w-6 h-6 rounded-full bg-accent border-2 border-white shadow-lg flex items-center justify-center">
                        <Navigation className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Map Controls */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <Button size="icon" variant="secondary" className="h-9 w-9 rounded-lg shadow-md">
                    <span className="text-lg font-bold">+</span>
                  </Button>
                  <Button size="icon" variant="secondary" className="h-9 w-9 rounded-lg shadow-md">
                    <span className="text-lg font-bold">-</span>
                  </Button>
                </div>

                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-border/50">
                  <div className="text-xs font-medium mb-2">Legend</div>
                  <div className="flex flex-col gap-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-accent" />
                      <span>Your Location</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span>Service Provider</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Providers List */}
          <div className={`${view === "map" ? "hidden lg:block" : ""}`}>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {providers.map((provider) => (
                <Card
                  key={provider.id}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-md ${
                    selectedProvider === provider.id
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border/50 hover:border-primary/30"
                  }`}
                  onClick={() => setSelectedProvider(provider.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold truncate">{provider.name}</h4>
                          {provider.available ? (
                            <span className="w-2 h-2 rounded-full bg-success shrink-0" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-muted-foreground shrink-0" />
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs font-normal mb-2">
                          {provider.category}
                        </Badge>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium text-foreground">{provider.rating}</span>
                            <span>({provider.reviews})</span>
                          </div>
                          <span className="text-border">•</span>
                          <span>{provider.distance}</span>
                        </div>
                      </div>
                      <ChevronRight
                        className={`h-5 w-5 shrink-0 transition-colors ${
                          selectedProvider === provider.id ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Provider Details */}
        {selectedData && (
          <Card className="mt-6 border-primary/30 bg-gradient-to-r from-primary/5 via-transparent to-accent/5">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{selectedData.name}</h3>
                    {selectedData.available ? (
                      <Badge className="bg-success/10 text-success border-success/30">Available Now</Badge>
                    ) : (
                      <Badge variant="secondary">Busy</Badge>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">{selectedData.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 text-primary shrink-0" />
                      <span>{selectedData.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4 text-primary shrink-0" />
                      <span>{selectedData.hours}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="border-primary/50 bg-transparent">
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </Button>
                  <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                    Book Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  )
}
