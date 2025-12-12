"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import { Star, MapPin, Clock, Heart, ChevronLeft, ChevronRight, Verified, Sparkles } from "lucide-react"
import { ServiceDetailsSheet } from "@/components/mobile-bottom-sheet"
import Image from "next/image"

const featuredServices = [
  {
    id: 1,
    title: "Premium Home Cleaning",
    provider: "Sparkle Clean Pro",
    category: "Home Services",
    rating: 4.9,
    reviews: 234,
    price: "CHF 45/hr",
    location: "Zurich",
    image: "/professional-cleaning-service.png",
    responseTime: "< 1 hour",
    verified: true,
    featured: true,
  },
  {
    id: 2,
    title: "Expert Plumbing Services",
    provider: "SwissPlumb AG",
    category: "Home Services",
    rating: 4.8,
    reviews: 189,
    price: "CHF 85/hr",
    location: "Geneva",
    image: "/professional-plumber-working.png",
    responseTime: "< 2 hours",
    verified: true,
    featured: true,
  },
  {
    id: 3,
    title: "Personal Fitness Training",
    provider: "FitLife Coaching",
    category: "Health & Wellness",
    rating: 5.0,
    reviews: 156,
    price: "CHF 120/session",
    location: "Basel",
    image: "/personal-trainer-fitness-gym.jpg",
    responseTime: "< 4 hours",
    verified: true,
    featured: false,
  },
  {
    id: 4,
    title: "Math & Science Tutoring",
    provider: "Academic Excellence",
    category: "Education",
    rating: 4.9,
    reviews: 312,
    price: "CHF 60/hr",
    location: "Bern",
    image: "/tutor-teaching-student.jpg",
    responseTime: "< 3 hours",
    verified: true,
    featured: true,
  },
  {
    id: 5,
    title: "Event Photography",
    provider: "Capture Moments",
    category: "Events",
    rating: 4.7,
    reviews: 98,
    price: "CHF 200/event",
    location: "Lausanne",
    image: "/professional-photographer-event.jpg",
    responseTime: "< 6 hours",
    verified: true,
    featured: false,
  },
  {
    id: 6,
    title: "IT Support & Repairs",
    provider: "TechFix Solutions",
    category: "Tech Support",
    rating: 4.8,
    reviews: 267,
    price: "CHF 75/hr",
    location: "Zurich",
    image: "/it-technician-computer-repair.jpg",
    responseTime: "< 1 hour",
    verified: true,
    featured: true,
  },
]

export function FeaturedCarousel() {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)
  const [favorites, setFavorites] = useState<number[]>([])

  useEffect(() => {
    if (!api) return

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap())

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap())
    })
  }, [api])

  const scrollPrev = useCallback(() => {
    api?.scrollPrev()
  }, [api])

  const scrollNext = useCallback(() => {
    api?.scrollNext()
  }, [api])

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]))
  }

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <Badge className="mb-3 bg-gradient-to-r from-primary to-accent text-white border-0 px-4 py-1.5">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Top Rated
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-2 text-balance">Featured Services</h2>
            <p className="text-muted-foreground text-lg">Hand-picked top-rated service providers in Switzerland</p>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 mr-2">
              {Array.from({ length: count }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => api?.scrollTo(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === current ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-10 w-10 border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all bg-transparent"
              onClick={scrollPrev}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-10 w-10 border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all bg-transparent"
              onClick={scrollNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Carousel */}
        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {featuredServices.map((service) => (
              <CarouselItem key={service.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <ServiceDetailsSheet
                  service={{
                    id: service.id.toString(),
                    title: service.title,
                    vendor: service.provider,
                    rating: service.rating,
                    reviews: service.reviews,
                    price: parseInt(service.price.match(/\d+/)?.[0] || "0"),
                    location: service.location,
                    image: service.image,
                    description: `Professional ${service.category.toLowerCase()} service provided by ${service.provider}. Verified and trusted by hundreds of customers across Switzerland.`,
                    features: [
                      "Professional Service",
                      "Verified Provider",
                      "Fast Response",
                      "Quality Guaranteed",
                      "Secure Payment",
                      "Customer Support"
                    ]
                  }}
                >
                  <Card className="group overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 cursor-pointer">
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={service.image || "/placeholder.svg"}
                      alt={service.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {service.featured && (
                        <Badge className="bg-gradient-to-r from-primary to-accent text-white border-0 text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      {service.verified && (
                        <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-xs">
                          <Verified className="h-3 w-3 mr-1 text-primary" />
                          Verified
                        </Badge>
                      )}
                    </div>

                    {/* Favorite Button */}
                    <button
                      onClick={() => toggleFavorite(service.id)}
                      className={`absolute top-3 right-3 h-9 w-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                        favorites.includes(service.id)
                          ? "bg-red-500 text-white"
                          : "bg-background/90 backdrop-blur-sm text-muted-foreground hover:text-red-500"
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${favorites.includes(service.id) ? "fill-current" : ""}`} />
                    </button>

                    {/* Bottom Info */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="text-sm">{service.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-2 py-1">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{service.rating}</span>
                          <span className="text-xs text-white/70">({service.reviews})</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-5">
                    {/* Category */}
                    <Badge variant="outline" className="mb-3 text-xs font-normal">
                      {service.category}
                    </Badge>

                    {/* Title & Provider */}
                    <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors line-clamp-1">
                      {service.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">by {service.provider}</p>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{service.responseTime}</span>
                      </div>
                      <div className="font-semibold text-primary">{service.price}</div>
                    </div>
                  </CardContent>
                </Card>
                </ServiceDetailsSheet>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* View All Button */}
        <div className="mt-10 text-center">
          <Button
            variant="outline"
            size="lg"
            className="px-8 border-primary/50 hover:bg-primary hover:text-primary-foreground bg-transparent"
          >
            View All Services
          </Button>
        </div>
      </div>
    </section>
  )
}
