"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { 
  Plus, 
  Calendar, 
  MessageCircle, 
  Star, 
  Search,
  Sparkles,
  Clock,
  MapPin,
  Zap
} from "lucide-react"

interface QuickAction {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  action: () => void
  badge?: string
}

export function QuickActionsBar() {
  const [isOpen, setIsOpen] = useState(false)

  const quickActions: QuickAction[] = [
    {
      id: "book",
      label: "Quick Book",
      icon: Calendar,
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      action: () => console.log("Quick book"),
      badge: "Popular"
    },
    {
      id: "message",
      label: "Messages",
      icon: MessageCircle,
      color: "bg-gradient-to-br from-green-500 to-green-600",
      action: () => console.log("Messages"),
      badge: "3"
    },
    {
      id: "review",
      label: "Leave Review",
      icon: Star,
      color: "bg-gradient-to-br from-yellow-500 to-orange-500",
      action: () => console.log("Review")
    },
    {
      id: "search",
      label: "Smart Search",
      icon: Search,
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      action: () => console.log("Search")
    }
  ]

  const recentServices = [
    {
      id: "1",
      title: "Home Cleaning",
      vendor: "Swiss Clean Pro",
      lastBooked: "2 days ago",
      image: "/placeholder.jpg"
    },
    {
      id: "2", 
      title: "Plumbing Repair",
      vendor: "Fix-It Fast",
      lastBooked: "1 week ago",
      image: "/placeholder.jpg"
    }
  ]

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-primary to-accent hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          
          <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl border-t-4 border-primary/20">
            {/* Drag Handle */}
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4" />
            
            <div className="flex flex-col h-full">
              <SheetHeader className="pb-4">
                <SheetTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Quick Actions
                </SheetTitle>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto space-y-6">
                {/* Main Actions Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {quickActions.map((action) => (
                    <Card 
                      key={action.id}
                      className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 border-2 border-transparent hover:border-primary/20"
                      onClick={() => {
                        action.action()
                        setIsOpen(false)
                      }}
                    >
                      <CardContent className="p-4 text-center">
                        <div className={`w-12 h-12 rounded-2xl ${action.color} text-white flex items-center justify-center mx-auto mb-3 shadow-md`}>
                          <action.icon className="h-6 w-6" />
                        </div>
                        <p className="font-medium text-sm">{action.label}</p>
                        {action.badge && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            {action.badge}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* AI Quick Book */}
                <Card className="border-2 border-dashed border-purple-200 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-purple-900 dark:text-purple-100">AI Quick Book</h3>
                        <p className="text-sm text-purple-700 dark:text-purple-300">Tell us what you need, we'll find the perfect match</p>
                      </div>
                      <Button size="sm" variant="outline" className="border-purple-200 hover:bg-purple-50">
                        Try It
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Services */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Book Again
                  </h3>
                  <div className="space-y-3">
                    {recentServices.map((service) => (
                      <Card key={service.id} className="cursor-pointer hover:shadow-md transition-all">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src={service.image} 
                              alt={service.title}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm line-clamp-1">{service.title}</p>
                              <p className="text-xs text-muted-foreground">{service.vendor}</p>
                              <p className="text-xs text-muted-foreground">Last booked {service.lastBooked}</p>
                            </div>
                            <Button size="sm" variant="outline">
                              Book Again
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Quick Filters */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Popular Near You
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Cleaning", "Plumbing", "Electrician", "Tutoring", 
                      "Pet Care", "Gardening", "Moving", "Handyman"
                    ].map((category) => (
                      <Button 
                        key={category}
                        variant="outline" 
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          console.log("Search category:", category)
                          setIsOpen(false)
                        }}
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Mini Quick Actions (Always Visible) */}
      <div className="fixed bottom-6 left-6 z-40 flex flex-col gap-3">
        <Button
          size="icon"
          variant="outline"
          className="h-12 w-12 rounded-full shadow-lg bg-background/80 backdrop-blur-xl border-2"
          onClick={() => console.log("Quick message")}
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
        
        <Button
          size="icon"
          variant="outline"
          className="h-12 w-12 rounded-full shadow-lg bg-background/80 backdrop-blur-xl border-2"
          onClick={() => console.log("Quick search")}
        >
          <Search className="h-5 w-5" />
        </Button>
      </div>
    </>
  )
}