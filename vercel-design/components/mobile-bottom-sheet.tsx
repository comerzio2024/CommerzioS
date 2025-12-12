"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Star, 
  MapPin, 
  Clock, 
  Shield, 
  Heart,
  Share2,
  MessageCircle,
  Calendar,
  ChevronUp,
  ChevronDown
} from "lucide-react"

interface ServiceDetailsSheetProps {
  service: {
    id: string
    title: string
    vendor: string
    rating: number
    reviews: number
    price: number
    location: string
    image: string
    description: string
    features: string[]
  }
  children: React.ReactNode
}

export function ServiceDetailsSheet({ service, children }: ServiceDetailsSheetProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent 
        side="bottom" 
        className="h-[90vh] rounded-t-3xl border-t-4 border-primary/20"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Service Details</SheetTitle>
        </SheetHeader>
        {/* Drag Handle */}
        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4" />
        
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex-shrink-0 pb-4">
            <div className="flex items-start gap-4 mb-4">
              <img 
                src={service.image} 
                alt={service.title}
                className="w-20 h-20 rounded-2xl object-cover"
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold mb-1 line-clamp-2">{service.title}</h2>
                <p className="text-muted-foreground text-sm mb-2">{service.vendor}</p>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{service.rating}</span>
                    <span className="text-muted-foreground">({service.reviews})</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{service.location}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Price & Quick Actions */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xl font-bold text-primary">CHF {service.price}</p>
                <p className="text-sm text-muted-foreground">per hour</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Chat
                </Button>
                <Button size="sm" className="bg-gradient-to-r from-primary to-accent">
                  <Calendar className="h-4 w-4 mr-1" />
                  Book Now
                </Button>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Features */}
            <div>
              <h3 className="font-semibold mb-3">What's Included</h3>
              <div className="grid grid-cols-2 gap-2">
                {service.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">About This Service</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
              <p className={`text-sm text-muted-foreground leading-relaxed ${
                isExpanded ? '' : 'line-clamp-3'
              }`}>
                {service.description}
              </p>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-xs font-medium text-green-900 dark:text-green-100">Verified</p>
                      <p className="text-xs text-green-700 dark:text-green-300">Background checked</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-xs font-medium text-blue-900 dark:text-blue-100">Fast Response</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">Usually within 2h</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Reviews Preview */}
            <div>
              <h3 className="font-semibold mb-3">Recent Reviews</h3>
              <div className="space-y-3">
                {[
                  { name: "Sarah M.", rating: 5, comment: "Excellent service! Very thorough and professional." },
                  { name: "Michael K.", rating: 5, comment: "Punctual and did an amazing job. Highly recommend!" }
                ].map((review, i) => (
                  <Card key={i} className="bg-muted/30">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium">{review.name[0]}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{review.name}</p>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: review.rating }).map((_, j) => (
                              <Star key={j} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{review.comment}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-3">
                View All Reviews ({service.reviews})
              </Button>
            </div>
          </div>

          {/* Fixed Bottom Actions */}
          <div className="flex-shrink-0 pt-4 border-t bg-background">
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1">
                <MessageCircle className="h-4 w-4 mr-2" />
                Message Vendor
              </Button>
              <Button className="flex-1 bg-gradient-to-r from-primary to-accent">
                <Calendar className="h-4 w-4 mr-2" />
                Book Service
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}