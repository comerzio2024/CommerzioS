"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Home,
  Heart,
  GraduationCap,
  Sparkles,
  Monitor,
  Car,
  MapPin,
  Upload,
  X,
  Check,
  ArrowLeft,
  Shield,
  BadgeCheck,
  Wand2,
  Phone,
  Mail,
  Globe,
  MessageSquare,
  Plus,
  DollarSign,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const categories = [
  { id: "home", name: "Home Services", icon: Home, types: 6, color: "from-blue-500 to-cyan-500" },
  { id: "health", name: "Health & Wellness", icon: Heart, types: 5, color: "from-pink-500 to-rose-500" },
  { id: "education", name: "Education", icon: GraduationCap, types: 4, color: "from-purple-500 to-indigo-500" },
  { id: "events", name: "Events", icon: Sparkles, types: 4, color: "from-amber-500 to-orange-500" },
  { id: "tech", name: "Tech Support", icon: Monitor, types: 4, color: "from-emerald-500 to-teal-500" },
  { id: "automotive", name: "Automotive", icon: Car, types: 4, color: "from-red-500 to-pink-500" },
]

const contactMethods = [
  { id: "phone", label: "Phone", icon: Phone, placeholder: "+41 79 XXX XX XX" },
  { id: "email", label: "Email", icon: Mail, placeholder: "your@email.com" },
  { id: "website", label: "Website", icon: Globe, placeholder: "https://yourwebsite.com" },
  { id: "whatsapp", label: "WhatsApp", icon: MessageSquare, placeholder: "+41 79 XXX XX XX" },
]

export default function PostServicePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("main")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [serviceName, setServiceName] = useState("")
  const [description, setDescription] = useState("")
  const [certifications, setCertifications] = useState("")
  const [hasInsurance, setHasInsurance] = useState(false)
  const [hasBackgroundCheck, setHasBackgroundCheck] = useState(false)
  const [contacts, setContacts] = useState<{ type: string; value: string }[]>([])
  const [selectedPackage, setSelectedPackage] = useState("free")
  const [images, setImages] = useState<string[]>([])

  // Location state
  const [serviceArea, setServiceArea] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [postalCode, setPostalCode] = useState("")

  // Pricing state
  const [pricingType, setPricingType] = useState("fixed")
  const [fixedPrice, setFixedPrice] = useState("")
  const [priceItems, setPriceItems] = useState<{ name: string; price: string }[]>([])

  const addContact = (type: string) => {
    setContacts([...contacts, { type, value: "" }])
  }

  const updateContact = (index: number, value: string) => {
    const updated = [...contacts]
    updated[index].value = value
    setContacts(updated)
  }

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index))
  }

  const addPriceItem = () => {
    setPriceItems([...priceItems, { name: "", price: "" }])
  }

  const updatePriceItem = (index: number, field: "name" | "price", value: string) => {
    const updated = [...priceItems]
    updated[index][field] = value
    setPriceItems(updated)
  }

  const removePriceItem = (index: number) => {
    setPriceItems(priceItems.filter((_, i) => i !== index))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newImages = Array.from(files).map((file) => URL.createObjectURL(file))
      setImages([...images, ...newImages])
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handlePublish = () => {
    // Validate required fields
    if (!selectedCategory || !serviceName || !description) {
      alert("Please fill in all required fields")
      return
    }

    console.log("Publishing service:", {
      category: selectedCategory,
      name: serviceName,
      description,
      certifications,
      insurance: hasInsurance,
      backgroundCheck: hasBackgroundCheck,
      contacts,
      package: selectedPackage,
      images,
      location: { serviceArea, address, city, postalCode },
      pricing: { type: pricingType, fixedPrice, priceItems },
    })

    router.push("/services")
  }

  const getCompletionPercentage = () => {
    let completed = 0
    const total = 8

    if (selectedCategory) completed++
    if (serviceName) completed++
    if (description) completed++
    if (images.length > 0) completed++
    if (contacts.length > 0) completed++
    if (serviceArea) completed++
    if (pricingType === "fixed" ? fixedPrice : priceItems.length > 0) completed++
    if (selectedPackage) completed++

    return Math.round((completed / total) * 100)
  }

  const canPublish = selectedCategory && serviceName && description && images.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Post a Service</h1>
                <p className="text-sm text-muted-foreground">Create your professional listing</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => router.push("/services")}>
                Save Draft
              </Button>
              <Button
                onClick={handlePublish}
                disabled={!canPublish}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Publish
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Navigation Tabs */}
            <Card className="border-2">
              <CardContent className="p-3">
                <nav className="space-y-1">
                  <button
                    onClick={() => setActiveTab("main")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                      activeTab === "main"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                        : "hover:bg-accent"
                    }`}
                  >
                    <Home className="h-5 w-5" />
                    <span className="font-medium">Main</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("location")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                      activeTab === "location"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                        : "hover:bg-accent"
                    }`}
                  >
                    <MapPin className="h-5 w-5" />
                    <span className="font-medium">Location</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("pricing")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                      activeTab === "pricing"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                        : "hover:bg-accent"
                    }`}
                  >
                    <DollarSign className="h-5 w-5" />
                    <span className="font-medium">Pricing</span>
                  </button>
                </nav>
              </CardContent>
            </Card>

            {/* Progress */}
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-bold text-blue-600">{getCompletionPercentage()}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
                      style={{ width: `${getCompletionPercentage()}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Package Selection */}
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">LISTING PACKAGE</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <button
                  onClick={() => setSelectedPackage("free")}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedPackage === "free"
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-950/20"
                      : "border-border hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">Free</span>
                    <span className="text-xl font-bold">CHF 0</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Basic listing</p>
                </button>

                <button
                  onClick={() => setSelectedPackage("featured")}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedPackage === "featured"
                      ? "border-amber-600 bg-amber-50 dark:bg-amber-950/20"
                      : "border-border hover:border-amber-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">Featured</span>
                    <span className="text-xl font-bold text-amber-600">CHF 49</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Top of search</p>
                </button>

                <button
                  onClick={() => setSelectedPackage("premium")}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedPackage === "premium"
                      ? "border-purple-600 bg-purple-50 dark:bg-purple-950/20"
                      : "border-border hover:border-purple-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">Premium</span>
                    <span className="text-xl font-bold text-purple-600">CHF 99</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Priority + badge</p>
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Main Tab */}
            {activeTab === "main" && (
              <>
                {/* Service Details */}
                <Card className="border-2">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-gray-950 rounded-lg">
                        <Home className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle>Service Details</CardTitle>
                        <CardDescription>Provide information about your service offering</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {/* Category Selection */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">
                        Category <span className="text-red-500">*</span>
                      </Label>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`relative p-4 rounded-xl border-2 text-left transition-all hover:scale-105 ${
                              selectedCategory === cat.id
                                ? "border-blue-600 bg-gradient-to-br " + cat.color + " text-white shadow-lg"
                                : "border-border hover:border-blue-300 bg-white dark:bg-gray-950"
                            }`}
                          >
                            <cat.icon
                              className={`h-6 w-6 mb-2 ${selectedCategory === cat.id ? "text-white" : "text-gray-600 dark:text-gray-400"}`}
                            />
                            <div
                              className={`font-semibold mb-1 ${selectedCategory === cat.id ? "text-white" : "text-foreground"}`}
                            >
                              {cat.name}
                            </div>
                            <div
                              className={`text-xs ${selectedCategory === cat.id ? "text-white/80" : "text-muted-foreground"}`}
                            >
                              {cat.types} types
                            </div>
                            {selectedCategory === cat.id && (
                              <div className="absolute top-2 right-2">
                                <div className="bg-white rounded-full p-1">
                                  <Check className="h-3 w-3 text-blue-600" />
                                </div>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Service Images */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">
                          Images <span className="text-red-500">*</span>
                          {images.length > 0 && (
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                              ({images.length} uploaded)
                            </span>
                          )}
                        </Label>
                        <Button variant="ghost" size="sm" className="text-emerald-600">
                          <Wand2 className="h-4 w-4 mr-2" />
                          AI Magic
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {images.map((img, idx) => (
                          <div
                            key={idx}
                            className="relative group aspect-square rounded-lg overflow-hidden border-2 border-border"
                          >
                            <img
                              src={img || "/placeholder.svg"}
                              alt={`Upload ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => removeImage(idx)}
                              className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            {idx === 0 && <Badge className="absolute bottom-2 left-2 bg-blue-600">Thumbnail</Badge>}
                          </div>
                        ))}

                        <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-blue-600 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-950/20">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">Upload</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Upload high-quality images. First image will be your thumbnail.
                      </p>
                    </div>

                    {/* Service Name */}
                    <div className="space-y-2">
                      <Label htmlFor="serviceName" className="text-base font-semibold">
                        Service Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="serviceName"
                        placeholder="e.g., Professional Home Cleaning"
                        value={serviceName}
                        onChange={(e) => setServiceName(e.target.value)}
                        className="h-12"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-base font-semibold">
                        Description <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your service in detail..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={6}
                        className="resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card className="border-2">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-gray-950 rounded-lg">
                        <MessageSquare className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle>Contact Information</CardTitle>
                        <CardDescription>How customers can reach you</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    {contacts.map((contact, idx) => {
                      const method = contactMethods.find((m) => m.id === contact.type)
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="flex items-center gap-2 flex-1">
                            {method && <method.icon className="h-5 w-5 text-muted-foreground" />}
                            <Input
                              placeholder={method?.placeholder}
                              value={contact.value}
                              onChange={(e) => updateContact(idx, e.target.value)}
                              className="h-11"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeContact(idx)}
                            className="text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}

                    <Select onValueChange={(value) => addContact(value)}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="+ Add Contact Method" />
                      </SelectTrigger>
                      <SelectContent>
                        {contactMethods.map((method) => (
                          <SelectItem key={method.id} value={method.id}>
                            <div className="flex items-center gap-2">
                              <method.icon className="h-4 w-4" />
                              {method.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Credentials */}
                <Card className="border-2">
                  <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-gray-950 rounded-lg">
                        <BadgeCheck className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <CardTitle>Professional Credentials</CardTitle>
                        <CardDescription>Build trust with certifications and verifications</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {/* Certifications */}
                    <div className="space-y-2">
                      <Label htmlFor="certifications" className="text-base font-semibold">
                        Certifications
                      </Label>
                      <Input
                        id="certifications"
                        placeholder="e.g., Licensed Plumber, ISO Certified, Master Electrician"
                        value={certifications}
                        onChange={(e) => setCertifications(e.target.value)}
                        className="h-11"
                      />
                    </div>

                    {/* Insurance Verification */}
                    <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-2 border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-white dark:bg-gray-950 rounded-full">
                            <Shield className="h-6 w-6 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg mb-1">Insurance Verified</h3>
                            <p className="text-sm text-emerald-800 dark:text-emerald-300">
                              I have liability insurance for my services
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={hasInsurance}
                          onCheckedChange={setHasInsurance}
                          className="data-[state=checked]:bg-emerald-600"
                        />
                      </div>
                    </div>

                    {/* Background Check */}
                    <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-2 border-blue-200 dark:border-blue-800">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-white dark:bg-gray-950 rounded-full">
                            <BadgeCheck className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg mb-1">Background Checked</h3>
                            <p className="text-sm text-blue-800 dark:text-blue-300">I have passed a background check</p>
                          </div>
                        </div>
                        <Switch
                          checked={hasBackgroundCheck}
                          onCheckedChange={setHasBackgroundCheck}
                          className="data-[state=checked]:bg-blue-600"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Location Tab */}
            {activeTab === "location" && (
              <Card className="border-2">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-gray-950 rounded-lg">
                      <MapPin className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle>Location & Service Area</CardTitle>
                      <CardDescription>Where do you provide your services?</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="serviceArea" className="text-base font-semibold">
                      Service Area
                    </Label>
                    <Input
                      id="serviceArea"
                      placeholder="e.g., Zurich, Bern, Basel"
                      value={serviceArea}
                      onChange={(e) => setServiceArea(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-base font-semibold">
                      Business Address
                    </Label>
                    <Input
                      id="address"
                      placeholder="Street address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-base font-semibold">
                        City
                      </Label>
                      <Input
                        id="city"
                        placeholder="City"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode" className="text-base font-semibold">
                        Postal Code
                      </Label>
                      <Input
                        id="postalCode"
                        placeholder="1234"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="h-11"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pricing Tab */}
            {activeTab === "pricing" && (
              <Card className="border-2">
                <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-gray-950 rounded-lg">
                      <DollarSign className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <CardTitle>Pricing Options</CardTitle>
                      <CardDescription>Set your service rates</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Pricing Type Selection */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Pricing Type</Label>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <button
                        onClick={() => setPricingType("fixed")}
                        className={`p-4 rounded-lg border-2 text-center transition-all ${
                          pricingType === "fixed"
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-950/20"
                            : "border-border hover:border-blue-300"
                        }`}
                      >
                        <div className="font-semibold mb-1">Fixed Price</div>
                        <div className="text-xs text-muted-foreground">Single rate</div>
                      </button>
                      <button
                        onClick={() => setPricingType("list")}
                        className={`p-4 rounded-lg border-2 text-center transition-all ${
                          pricingType === "list"
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-950/20"
                            : "border-border hover:border-blue-300"
                        }`}
                      >
                        <div className="font-semibold mb-1">Price List</div>
                        <div className="text-xs text-muted-foreground">Multiple options</div>
                      </button>
                      <button
                        onClick={() => setPricingType("request")}
                        className={`p-4 rounded-lg border-2 text-center transition-all ${
                          pricingType === "request"
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-950/20"
                            : "border-border hover:border-blue-300"
                        }`}
                      >
                        <div className="font-semibold mb-1">On Request</div>
                        <div className="text-xs text-muted-foreground">Custom quotes</div>
                      </button>
                    </div>
                  </div>

                  {/* Fixed Price */}
                  {pricingType === "fixed" && (
                    <div className="space-y-2">
                      <Label htmlFor="fixedPrice" className="text-base font-semibold">
                        Price per Hour
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">CHF</span>
                        <Input
                          id="fixedPrice"
                          type="number"
                          placeholder="0.00"
                          value={fixedPrice}
                          onChange={(e) => setFixedPrice(e.target.value)}
                          className="h-12 pl-14"
                        />
                      </div>
                    </div>
                  )}

                  {/* Price List */}
                  {pricingType === "list" && (
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Price Items</Label>
                      {priceItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <Input
                            placeholder="Service name"
                            value={item.name}
                            onChange={(e) => updatePriceItem(idx, "name", e.target.value)}
                            className="h-11 flex-1"
                          />
                          <div className="relative w-32">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              CHF
                            </span>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={item.price}
                              onChange={(e) => updatePriceItem(idx, "price", e.target.value)}
                              className="h-11 pl-12"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removePriceItem(idx)}
                            className="text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" onClick={addPriceItem} className="w-full h-11 bg-transparent">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Price Item
                      </Button>
                    </div>
                  )}

                  {/* On Request */}
                  {pricingType === "request" && (
                    <div className="p-6 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-2 border-blue-200 dark:border-blue-800 text-center">
                      <p className="text-sm text-muted-foreground">
                        Customers will contact you for custom pricing quotes
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
