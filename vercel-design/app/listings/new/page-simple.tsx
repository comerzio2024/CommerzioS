"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Upload, X, ArrowRight, ArrowLeft, Check, Sparkles, MapPin, DollarSign,
  Home, Heart, GraduationCap, Monitor, Car, Camera, Wand2
} from "lucide-react"

const categories = [
  { id: "home", name: "Home Services", icon: Home, color: "from-blue-500 to-cyan-500" },
  { id: "health", name: "Health & Wellness", icon: Heart, color: "from-pink-500 to-rose-500" },
  { id: "education", name: "Education", icon: GraduationCap, color: "from-purple-500 to-indigo-500" },
  { id: "events", name: "Events", icon: Sparkles, color: "from-amber-500 to-orange-500" },
  { id: "tech", name: "Tech Support", icon: Monitor, color: "from-emerald-500 to-teal-500" },
  { id: "automotive", name: "Automotive", icon: Car, color: "from-red-500 to-pink-500" },
]

export default function ImprovedListingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [images, setImages] = useState<string[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [price, setPrice] = useState("")
  const [location, setLocation] = useState("")

  const totalSteps = 4
  const progress = (step / totalSteps) * 100

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file))
      setImages([...images, ...newImages])
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const canContinue = () => {
    if (step === 1) return images.length > 0 && title
    if (step === 2) return description && category
    if (step === 3) return price && location
    return true
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="sm" onClick={() => step > 1 ? setStep(step - 1) : router.back()}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Badge variant="secondary" className="px-3 py-1">
              Step {step} of {totalSteps}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => router.push("/vendor/dashboard")}>
              Save Draft
            </Button>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Step 1: Photos & Title */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent mb-4">
                <Camera className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Let's start with visuals</h1>
              <p className="text-muted-foreground">Great photos get 3x more bookings</p>
            </div>

            <Card className="border-2">
              <CardContent className="p-6 space-y-6">
                {/* Image Upload */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold">
                      Service Photos <span className="text-red-500">*</span>
                    </Label>
                    <Button variant="ghost" size="sm" className="text-purple-600">
                      <Wand2 className="h-4 w-4 mr-2" />
                      AI Enhance
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-border">
                        <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        {idx === 0 && (
                          <Badge className="absolute bottom-2 left-2 bg-primary">Cover Photo</Badge>
                        )}
                      </div>
                    ))}

                    <label className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary transition-all cursor-pointer flex flex-col items-center justify-center gap-2 hover:bg-primary/5 group">
                      <div className="w-12 h-12 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                        <Upload className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">Add Photos</span>
                      <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    📸 Tip: Use natural lighting and show your work in action
                  </p>
                </div>

                {/* Service Title */}
                <div className="space-y-3">
                  <Label htmlFor="title" className="text-lg font-semibold">
                    Service Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Professional Home Cleaning Service"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-14 text-lg"
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 Tip: Be specific and include what makes you unique
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Description & Category */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-accent to-primary mb-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Tell your story</h1>
              <p className="text-muted-foreground">Help customers understand what you offer</p>
            </div>

            <Card className="border-2">
              <CardContent className="p-6 space-y-6">
                {/* Description */}
                <div className="space-y-3">
                  <Label htmlFor="description" className="text-lg font-semibold">
                    Service Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what you offer, your experience, and what makes your service special..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={8}
                    className="resize-none text-base"
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {description.length} / 500 characters
                    </span>
                    <Button variant="ghost" size="sm" className="text-purple-600 h-auto p-0">
                      <Wand2 className="h-3 w-3 mr-1" />
                      AI Improve
                    </Button>
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all hover:scale-105 ${
                          category === cat.id
                            ? `border-primary bg-gradient-to-br ${cat.color} text-white shadow-lg`
                            : "border-border hover:border-primary"
                        }`}
                      >
                        <cat.icon className={`h-6 w-6 mb-2 ${category === cat.id ? "text-white" : "text-muted-foreground"}`} />
                        <div className={`font-semibold text-sm ${category === cat.id ? "text-white" : ""}`}>
                          {cat.name}
                        </div>
                        {category === cat.id && (
                          <div className="absolute top-2 right-2 bg-white rounded-full p-1">
                            <Check className="h-3 w-3 text-primary" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Pricing & Location */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 mb-4">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Set your price</h1>
              <p className="text-muted-foreground">You can always adjust this later</p>
            </div>

            <Card className="border-2">
              <CardContent className="p-6 space-y-6">
                {/* Pricing */}
                <div className="space-y-3">
                  <Label htmlFor="price" className="text-lg font-semibold">
                    Starting Price <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
                      CHF
                    </span>
                    <Input
                      id="price"
                      type="number"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="h-16 pl-16 text-2xl font-bold"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      per hour
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💰 Tip: Check similar services in your area for competitive pricing
                  </p>
                </div>

                {/* Location */}
                <div className="space-y-3">
                  <Label htmlFor="location" className="text-lg font-semibold">
                    Service Location <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="location"
                      placeholder="e.g., Zürich, Bern, Basel"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="h-14 pl-12 text-base"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    📍 Tip: List all cities/regions where you provide services
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Review & Publish */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 mb-4">
                <Check className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Looking great!</h1>
              <p className="text-muted-foreground">Review your listing before publishing</p>
            </div>

            <Card className="border-2 overflow-hidden">
              <div className="relative h-64">
                <img src={images[0]} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
                  <div className="flex items-center gap-4 text-white/90">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {location}
                    </span>
                    <span className="text-xl font-bold">CHF {price}/hr</span>
                  </div>
                </div>
              </div>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Description</Label>
                  <p className="mt-1">{description}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Category</Label>
                  <Badge className="mt-1">{categories.find(c => c.id === category)?.name}</Badge>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Photos</Label>
                  <div className="flex gap-2 mt-1">
                    {images.slice(0, 4).map((img, idx) => (
                      <img key={idx} src={img} alt="" className="w-16 h-16 rounded object-cover" />
                    ))}
                    {images.length > 4 && (
                      <div className="w-16 h-16 rounded bg-muted flex items-center justify-center text-sm font-medium">
                        +{images.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-6">
          {step < totalSteps ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canContinue()}
              className="flex-1 h-14 text-lg bg-gradient-to-r from-primary to-accent"
            >
              Continue
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => router.push("/vendor/dashboard")}
              className="flex-1 h-14 text-lg bg-gradient-to-r from-green-600 to-emerald-600"
            >
              <Check className="h-5 w-5 mr-2" />
              Publish Listing
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
