"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  User,
  ListTree,
  Calendar,
  Star,
  MessageSquare,
  CreditCard,
  Gift,
  Bell,
  Camera,
  Edit3,
  MapPin,
  Phone,
  Mail,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Plus,
  ChevronRight,
  Check,
  Clock,
  AlertCircle,
  Trash2,
  Building2,
  Home,
  Briefcase,
  Copy,
  Share2,
  Award,
  Users,
  Smartphone,
  Globe,
} from "lucide-react"

const mainTabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "listings", label: "My Listings", icon: ListTree },
  { id: "bookings", label: "My Bookings", icon: Calendar },
  { id: "reviews", label: "Reviews", icon: Star, count: 12 },
  { id: "questions", label: "Questions", icon: MessageSquare, count: 3, highlight: true },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "referrals", label: "Referrals", icon: Gift },
  { id: "notifications", label: "Notifications", icon: Bell, count: 5 },
]

const profileSubTabs = [
  { id: "personal", label: "Personal Information" },
  { id: "account", label: "Account Information" },
  { id: "addresses", label: "Addresses" },
]

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile")
  const [activeSubTab, setActiveSubTab] = useState("personal")
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <main className="flex-1">
        {/* Header Section */}
        <div className="border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Avatar with edit overlay */}
              <div className="relative group">
                <Avatar className="h-24 w-24 ring-4 ring-background shadow-xl">
                  <AvatarImage src="/professional-woman-portrait.png" />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">MS</AvatarFallback>
                </Avatar>
                <button className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-6 w-6 text-white" />
                </button>
                <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-success rounded-full flex items-center justify-center ring-2 ring-background">
                  <Check className="h-3 w-3 text-success-foreground" />
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl md:text-3xl font-bold">Maria Schmidt</h1>
                  <Badge variant="secondary" className="gap-1">
                    <Shield className="h-3 w-3" />
                    Verified
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-3">Member since January 2024</p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    Zürich, Switzerland
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    4.9 rating
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    24 bookings
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Share2 className="h-4 w-4" />
                  Share Profile
                </Button>
                <Button size="sm" className="gap-2">
                  <Edit3 className="h-4 w-4" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Tabs Navigation */}
        <div className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-40">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-hide">
              {mainTabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap rounded-lg transition-all relative ${
                      activeTab === tab.id
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {tab.count !== undefined && (
                      <Badge
                        variant={tab.highlight ? "destructive" : "secondary"}
                        className={`ml-1 h-5 min-w-5 px-1.5 text-xs ${tab.highlight ? "animate-pulse" : ""}`}
                      >
                        {tab.count}
                      </Badge>
                    )}
                    {activeTab === tab.id && (
                      <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="container mx-auto px-4 py-8">
          {activeTab === "profile" && (
            <div className="space-y-6">
              {/* Sub-tabs for Profile */}
              <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-xl w-fit">
                {profileSubTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      activeSubTab === tab.id
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Personal Information */}
              {activeSubTab === "personal" && (
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5 text-primary" />
                          Basic Information
                        </CardTitle>
                        <CardDescription>Your personal details visible to service providers</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input id="firstName" defaultValue="Maria" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input id="lastName" defaultValue="Schmidt" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="displayName">Display Name</Label>
                          <Input id="displayName" defaultValue="Maria S." />
                          <p className="text-xs text-muted-foreground">This is how your name appears to vendors</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <textarea
                            id="bio"
                            className="w-full min-h-24 px-3 py-2 text-sm rounded-lg border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="Tell service providers a bit about yourself..."
                            defaultValue="I'm a busy professional looking for reliable home services in Zürich. I appreciate punctuality and quality work."
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button className="gap-2">
                            <Check className="h-4 w-4" />
                            Save Changes
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Phone className="h-5 w-5 text-primary" />
                          Contact Information
                        </CardTitle>
                        <CardDescription>How service providers can reach you</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Mail className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">maria.schmidt@email.com</p>
                              <p className="text-xs text-muted-foreground">Primary email</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="gap-1 text-success border-success/30">
                              <Check className="h-3 w-3" />
                              Verified
                            </Badge>
                            <Button variant="ghost" size="icon">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Phone className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">+41 79 XXX XX XX</p>
                              <p className="text-xs text-muted-foreground">Mobile phone</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="gap-1 text-success border-success/30">
                              <Check className="h-3 w-3" />
                              Verified
                            </Badge>
                            <Button variant="ghost" size="icon">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <Button variant="outline" className="w-full gap-2 bg-transparent">
                          <Plus className="h-4 w-4" />
                          Add Contact Method
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Profile Completion</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">85% Complete</span>
                          <span className="font-medium text-primary">85/100</span>
                        </div>
                        <Progress value={85} className="h-2" />
                        <div className="space-y-2 pt-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Complete these to boost your profile
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
                              <Camera className="h-3 w-3" />
                            </div>
                            <span>Add a profile photo</span>
                            <Badge variant="secondary" className="ml-auto text-xs">
                              +5
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
                              <MapPin className="h-3 w-3" />
                            </div>
                            <span>Add work address</span>
                            <Badge variant="secondary" className="ml-auto text-xs">
                              +10
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                            <Shield className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Trust Score</h3>
                            <p className="text-sm text-muted-foreground">Excellent</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${i <= 4 ? "fill-primary text-primary" : "text-muted"}`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">Based on 24 completed bookings and reviews</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Account Information */}
              {activeSubTab === "account" && (
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lock className="h-5 w-5 text-primary" />
                          Security Settings
                        </CardTitle>
                        <CardDescription>Manage your password and security preferences</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <div className="relative">
                            <Input
                              id="currentPassword"
                              type={showPassword ? "text" : "password"}
                              defaultValue="••••••••••••"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input id="newPassword" type="password" placeholder="Enter new password" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input id="confirmPassword" type="password" placeholder="Confirm new password" />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button variant="outline">Update Password</Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Smartphone className="h-5 w-5 text-primary" />
                          Two-Factor Authentication
                        </CardTitle>
                        <CardDescription>Add an extra layer of security to your account</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between p-4 bg-success/10 rounded-xl border border-success/20">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
                              <Shield className="h-5 w-5 text-success" />
                            </div>
                            <div>
                              <p className="font-medium">2FA is enabled</p>
                              <p className="text-xs text-muted-foreground">Using authenticator app</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            Manage
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Globe className="h-5 w-5 text-primary" />
                          Connected Accounts
                        </CardTitle>
                        <CardDescription>Link external accounts for easier login</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {[
                          { name: "Google", email: "maria.schmidt@gmail.com", connected: true },
                          { name: "Apple", email: null, connected: false },
                          { name: "Facebook", email: null, connected: false },
                        ].map((account) => (
                          <div
                            key={account.name}
                            className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center border">
                                <span className="text-sm font-semibold">{account.name[0]}</span>
                              </div>
                              <div>
                                <p className="font-medium">{account.name}</p>
                                {account.email && <p className="text-xs text-muted-foreground">{account.email}</p>}
                              </div>
                            </div>
                            <Button variant={account.connected ? "outline" : "default"} size="sm">
                              {account.connected ? "Disconnect" : "Connect"}
                            </Button>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Account Status</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Status</span>
                          <Badge className="bg-success text-success-foreground">Active</Badge>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Account Type</span>
                          <span className="text-sm font-medium">Customer</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Member Since</span>
                          <span className="text-sm font-medium">Jan 2024</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Last Login</span>
                          <span className="text-sm font-medium">Today</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-destructive/20">
                      <CardHeader>
                        <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button variant="outline" className="w-full justify-start text-muted-foreground bg-transparent">
                          <Lock className="h-4 w-4 mr-2" />
                          Deactivate Account
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-destructive hover:bg-destructive/10 bg-transparent"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Account
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Addresses */}
              {activeSubTab === "addresses" && (
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    {[
                      { type: "Home", icon: Home, address: "Bahnhofstrasse 1", city: "8001 Zürich", isDefault: true },
                      {
                        type: "Work",
                        icon: Briefcase,
                        address: "Europaallee 41",
                        city: "8004 Zürich",
                        isDefault: false,
                      },
                      {
                        type: "Other",
                        icon: Building2,
                        address: "Seestrasse 123",
                        city: "8002 Zürich",
                        isDefault: false,
                      },
                    ].map((addr, idx) => {
                      const Icon = addr.icon
                      return (
                        <Card key={idx} className={addr.isDefault ? "ring-2 ring-primary/20" : ""}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-4">
                                <div
                                  className={`h-12 w-12 rounded-xl flex items-center justify-center ${addr.isDefault ? "bg-primary/10" : "bg-muted"}`}
                                >
                                  <Icon
                                    className={`h-6 w-6 ${addr.isDefault ? "text-primary" : "text-muted-foreground"}`}
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold">{addr.type}</h3>
                                    {addr.isDefault && <Badge>Default</Badge>}
                                  </div>
                                  <p className="text-muted-foreground">{addr.address}</p>
                                  <p className="text-muted-foreground">{addr.city}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon">
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {!addr.isDefault && (
                              <div className="mt-4 pt-4 border-t">
                                <Button variant="outline" size="sm">
                                  Set as Default
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                    <Card className="border-dashed">
                      <CardContent className="p-6">
                        <button className="w-full flex flex-col items-center justify-center py-8 text-muted-foreground hover:text-foreground transition-colors">
                          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                            <Plus className="h-6 w-6" />
                          </div>
                          <span className="font-medium">Add New Address</span>
                        </button>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Quick Tips</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <p>• Set your most-used address as default for faster bookings</p>
                        <p>• Add a work address for services during business hours</p>
                        <p>• Include apartment/unit numbers for accurate arrivals</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* My Listings Tab */}
          {activeTab === "listings" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">My Listings</h2>
                  <p className="text-muted-foreground">Manage your service listings</p>
                </div>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Listing
                </Button>
              </div>
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <ListTree className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">No listings yet</h3>
                  <p className="text-muted-foreground mb-4">Start offering your services to customers</p>
                  <Button>Create Your First Listing</Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* My Bookings Tab */}
          {activeTab === "bookings" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">My Bookings</h2>
                  <p className="text-muted-foreground">Track all your service appointments</p>
                </div>
                <Button variant="outline">View Calendar</Button>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">3</p>
                      <p className="text-sm text-muted-foreground">Upcoming</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                      <Check className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">21</p>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">0</p>
                      <p className="text-sm text-muted-foreground">Cancelled</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Bookings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      service: "Professional Home Cleaning",
                      vendor: "Swiss Clean Pro",
                      date: "Dec 15, 2025",
                      time: "10:00 AM",
                      status: "confirmed",
                      price: "CHF 90",
                    },
                    {
                      service: "Plumbing Repair",
                      vendor: "AquaFix Switzerland",
                      date: "Dec 18, 2025",
                      time: "2:00 PM",
                      status: "pending",
                      price: "CHF 120",
                    },
                    {
                      service: "Personal Training",
                      vendor: "FitLife Coaching",
                      date: "Dec 20, 2025",
                      time: "7:00 AM",
                      status: "confirmed",
                      price: "CHF 85",
                    },
                  ].map((booking, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-xl bg-background flex items-center justify-center border">
                          <Calendar className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{booking.service}</h3>
                          <p className="text-sm text-muted-foreground">{booking.vendor}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{booking.date}</span>
                            <span>•</span>
                            <span>{booking.time}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                            {booking.status}
                          </Badge>
                          <p className="font-semibold mt-1">{booking.price}</p>
                        </div>
                        <Button variant="ghost" size="icon">
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Reviews</h2>
                <p className="text-muted-foreground">Reviews you've given and received</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-primary/10 to-transparent">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-3xl font-bold mb-1">4.9</p>
                    <p className="text-sm text-muted-foreground">Average rating from 12 reviews</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 space-y-2">
                    {[5, 4, 3, 2, 1].map((stars) => (
                      <div key={stars} className="flex items-center gap-2">
                        <span className="text-sm w-3">{stars}</span>
                        <Star className="h-3 w-3 fill-primary text-primary" />
                        <Progress value={stars === 5 ? 80 : stars === 4 ? 20 : 0} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground w-6">
                          {stars === 5 ? 10 : stars === 4 ? 2 : 0}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Reviews</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      vendor: "Swiss Clean Pro",
                      rating: 5,
                      date: "Dec 10, 2025",
                      comment: "Excellent service! Very thorough and professional.",
                    },
                    {
                      vendor: "AquaFix Switzerland",
                      rating: 5,
                      date: "Nov 28, 2025",
                      comment: "Fixed the issue quickly. Will use again!",
                    },
                    {
                      vendor: "EduSwiss Tutoring",
                      rating: 4,
                      date: "Nov 15, 2025",
                      comment: "Good tutoring session, helped a lot with math.",
                    },
                  ].map((review, idx) => (
                    <div key={idx} className="p-4 bg-muted/50 rounded-xl">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{review.vendor}</h3>
                          <p className="text-xs text-muted-foreground">{review.date}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Questions Tab */}
          {activeTab === "questions" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Questions</h2>
                <p className="text-muted-foreground">Questions from vendors and your inquiries</p>
              </div>

              <Card>
                <CardContent className="divide-y">
                  {[
                    {
                      from: "Swiss Clean Pro",
                      message: "What time works best for you on Dec 15th?",
                      time: "2 hours ago",
                      unread: true,
                    },
                    {
                      from: "AquaFix Switzerland",
                      message: "Can you provide photos of the issue?",
                      time: "1 day ago",
                      unread: true,
                    },
                    {
                      from: "FitLife Coaching",
                      message: "Confirmed! See you at 7 AM.",
                      time: "2 days ago",
                      unread: true,
                    },
                  ].map((q, idx) => (
                    <div key={idx} className={`p-4 flex items-start gap-4 ${q.unread ? "bg-primary/5" : ""}`}>
                      <Avatar>
                        <AvatarFallback>{q.from[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold">{q.from}</h3>
                          <span className="text-xs text-muted-foreground">{q.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{q.message}</p>
                      </div>
                      {q.unread && <div className="h-2 w-2 rounded-full bg-primary mt-2" />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === "payments" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Payment Methods</h2>
                <p className="text-muted-foreground">Manage your payment options</p>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  {[
                    { type: "Visa", last4: "4242", expiry: "12/26", isDefault: true },
                    { type: "Mastercard", last4: "8888", expiry: "06/25", isDefault: false },
                  ].map((card, idx) => (
                    <Card key={idx} className={card.isDefault ? "ring-2 ring-primary/20" : ""}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-20 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                              {card.type}
                            </div>
                            <div>
                              <p className="font-semibold">•••• •••• •••• {card.last4}</p>
                              <p className="text-sm text-muted-foreground">Expires {card.expiry}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {card.isDefault && <Badge>Default</Badge>}
                            <Button variant="ghost" size="icon">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button variant="outline" className="w-full gap-2 bg-transparent">
                    <Plus className="h-4 w-4" />
                    Add Payment Method
                  </Button>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Billing History</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { service: "Home Cleaning", amount: "CHF 90", date: "Dec 10" },
                      { service: "Plumbing", amount: "CHF 120", date: "Nov 28" },
                      { service: "Training", amount: "CHF 85", date: "Nov 20" },
                    ].map((bill, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium">{bill.service}</p>
                          <p className="text-xs text-muted-foreground">{bill.date}</p>
                        </div>
                        <span>{bill.amount}</span>
                      </div>
                    ))}
                    <Button variant="link" className="w-full">
                      View All Transactions
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Referrals Tab */}
          {activeTab === "referrals" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Referral Program</h2>
                <p className="text-muted-foreground">Invite friends and earn rewards</p>
              </div>

              <Card className="bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border-primary/20">
                <CardContent className="p-8">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Give CHF 20, Get CHF 20</h3>
                      <p className="text-muted-foreground mb-6">
                        Share your code with friends. When they book their first service, you both get CHF 20 credit!
                      </p>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-background rounded-xl px-4 py-3 font-mono font-bold text-lg border">
                          MARIA2025
                        </div>
                        <Button size="lg" className="gap-2">
                          <Copy className="h-4 w-4" />
                          Copy
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                          <p className="text-2xl font-bold">5</p>
                          <p className="text-xs text-muted-foreground">Friends Invited</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Award className="h-8 w-8 text-primary mx-auto mb-2" />
                          <p className="text-2xl font-bold">CHF 100</p>
                          <p className="text-xs text-muted-foreground">Total Earned</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Referral History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { name: "Thomas M.", status: "Completed", reward: "CHF 20", date: "Dec 5" },
                    { name: "Lisa K.", status: "Completed", reward: "CHF 20", date: "Nov 18" },
                    { name: "Peter S.", status: "Pending", reward: "-", date: "Nov 10" },
                  ].map((ref, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{ref.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{ref.name}</p>
                          <p className="text-xs text-muted-foreground">{ref.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={ref.status === "Completed" ? "default" : "secondary"}>{ref.status}</Badge>
                        <p className="text-sm font-semibold mt-1">{ref.reward}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Notification Settings</h2>
                  <p className="text-muted-foreground">Control how you receive updates</p>
                </div>
                <Button variant="outline">Mark All Read</Button>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Preferences</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {[
                        {
                          category: "Bookings",
                          description: "Updates about your appointments",
                          email: true,
                          push: true,
                          sms: false,
                        },
                        {
                          category: "Messages",
                          description: "New messages from vendors",
                          email: true,
                          push: true,
                          sms: true,
                        },
                        {
                          category: "Promotions",
                          description: "Deals and special offers",
                          email: true,
                          push: false,
                          sms: false,
                        },
                        {
                          category: "Reviews",
                          description: "When someone reviews you",
                          email: true,
                          push: true,
                          sms: false,
                        },
                        {
                          category: "Account",
                          description: "Security and account updates",
                          email: true,
                          push: true,
                          sms: true,
                        },
                      ].map((pref, idx) => (
                        <div key={idx} className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{pref.category}</p>
                            <p className="text-sm text-muted-foreground">{pref.description}</p>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <Switch defaultChecked={pref.email} />
                            </div>
                            <div className="flex items-center gap-2">
                              <Bell className="h-4 w-4 text-muted-foreground" />
                              <Switch defaultChecked={pref.push} />
                            </div>
                            <div className="flex items-center gap-2">
                              <Smartphone className="h-4 w-4 text-muted-foreground" />
                              <Switch defaultChecked={pref.sms} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent Notifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { title: "Booking confirmed", message: "Dec 15 at 10 AM", time: "2h ago", unread: true },
                      { title: "New message", message: "From Swiss Clean Pro", time: "5h ago", unread: true },
                      { title: "Review reminder", message: "Rate your experience", time: "1d ago", unread: false },
                    ].map((notif, idx) => (
                      <div key={idx} className={`p-3 rounded-lg ${notif.unread ? "bg-primary/5" : "bg-muted/50"}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium">{notif.title}</p>
                            <p className="text-xs text-muted-foreground">{notif.message}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">{notif.time}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
