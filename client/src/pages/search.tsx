import { Layout } from "@/components/layout";
import { ServiceCard } from "@/components/service-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, MapPin, TrendingUp, Loader2 } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, type ServiceWithDetails } from "@/lib/api";
import { useState, useEffect } from "react";
import { Footer } from "@/components/Footer";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { GoogleMaps } from "@/components/google-maps";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

export default function SearchResults() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const initialQuery = searchParams.get("q") || "";

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [locationInput, setLocationInput] = useState("");
  const [showMap, setShowMap] = useState(false);

  // Filter States
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [instantBooking, setInstantBooking] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Map Config
  const { data: mapsConfig } = useQuery({
    queryKey: ["/api/maps/config"],
    queryFn: () => apiRequest<{ apiKey: string }>("/api/maps/config"),
  });

  // Update search input when URL query changes
  useEffect(() => {
    setSearchInput(initialQuery);
  }, [initialQuery]);

  const { data: services = [], isLoading } = useQuery<ServiceWithDetails[]>({
    queryKey: [`/api/services`, { search: initialQuery, status: 'active' }],
    queryFn: () => apiRequest(`/api/services?search=${encodeURIComponent(initialQuery)}&status=active`),
  });

  // Client-side filtering
  const filteredServices = services.filter(service => {
    // Price Filter
    const price = Number(service.price);
    if (price < priceRange[0] || price > priceRange[1]) return false;

    // Verified Filter
    if (verifiedOnly && !service.owner?.isVerified) return false;

    // Category Filter
    if (selectedCategories.length > 0 && !selectedCategories.includes(service.category.name)) return false;

    return true;
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchInput.trim()) {
        setLocation(`/search?q=${encodeURIComponent(searchInput.trim())}`);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Layout>
        {/* Header Section with Vercel Design */}
        <div className="bg-card border-b border-border">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-foreground" data-testid="search-title">
              {initialQuery ? `Results for "${initialQuery}"` : "Discover Services"}
            </h1>

            {/* Search & Filters Toolbar */}
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Main Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  className="pl-10 h-10"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  data-testid="search-input"
                />
              </div>

              {/* Location Input (Visual wrapper for now) */}
              <div className="relative lg:w-64">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  placeholder="Switzerland (All)"
                  className="pl-10 h-10"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                />
              </div>

              {/* Sort Select */}
              <Select defaultValue="relevance">
                <SelectTrigger className="lg:w-48 h-10">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Most Relevant</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="reviews">Most Reviews</SelectItem>
                </SelectContent>
              </Select>

              {/* Filter Sheet */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2 bg-background h-10 hover:border-primary/50 transition-colors">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[300px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle>Filter Services</SheetTitle>
                    <SheetDescription>
                      Refine your search results
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-6 space-y-6">
                    {/* Price Range */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base">Price Range</Label>
                        <span className="text-sm text-muted-foreground">CHF {priceRange[0]} - {priceRange[1]}+</span>
                      </div>
                      <Slider
                        defaultValue={[0, 1000]}
                        max={1000}
                        step={10}
                        value={priceRange}
                        onValueChange={setPriceRange}
                        className="py-4"
                      />
                    </div>

                    <Separator />

                    {/* Toggles */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="verified" className="flex flex-col">
                          <span>Verified Vendors</span>
                          <span className="font-normal text-xs text-muted-foreground">Only show verified pros</span>
                        </Label>
                        <Switch id="verified" checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="instant" className="flex flex-col">
                          <span>Instant Booking</span>
                          <span className="font-normal text-xs text-muted-foreground">Book without waiting</span>
                        </Label>
                        <Switch id="instant" checked={instantBooking} onCheckedChange={setInstantBooking} />
                      </div>
                    </div>

                    <Separator />

                    {/* Categories */}
                    <div className="space-y-3">
                      <Label className="text-base">Categories</Label>
                      <div className="grid gap-2">
                        {["Home Cleaning", "Plumbing", "Electrical", "Moving", "Painting", "Gardening"].map((cat) => (
                          <div key={cat} className="flex items-center space-x-2">
                            <Checkbox
                              id={`cat-${cat}`}
                              checked={selectedCategories.includes(cat)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedCategories([...selectedCategories, cat]);
                                } else {
                                  setSelectedCategories(selectedCategories.filter(c => c !== cat));
                                }
                              }}
                            />
                            <label htmlFor={`cat-${cat}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              {cat}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <SheetFooter>
                    <Button type="submit" className="w-full">See Results</Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>

              {/* Map Toggle */}
              <Button
                variant={showMap ? "default" : "outline"}
                className={`gap-2 h-10 ${showMap ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                onClick={() => setShowMap(!showMap)}
              >
                <MapPin className="h-4 w-4" />
                {showMap ? "Show List" : "Show Map"}
              </Button>

              <Button onClick={() => handleSearch({ preventDefault: () => { } } as any)} className="h-10">
                Search
              </Button>
            </div>

            {/* Active Filters / Badges */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant="secondary" className="gap-2 px-3 py-1">
                All Categories
                <button className="hover:text-foreground text-muted-foreground">×</button>
              </Badge>
              {initialQuery && (
                <Badge variant="secondary" className="gap-2 px-3 py-1">
                  Query: {initialQuery}
                  <button onClick={() => { setSearchInput(""); setLocation("/search"); }} className="hover:text-foreground text-muted-foreground">×</button>
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Results Content */}
        <div className="container mx-auto px-4 py-8 flex-1">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin api-loading" /> Searching...
                </span>
              ) : (
                `Showing ${filteredServices.length} result${filteredServices.length !== 1 ? 's' : ''}`
              )}
            </p>
            <Button variant="ghost" size="sm" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Popular Now
            </Button>
          </div>

          {!initialQuery && !isLoading && filteredServices.length === 0 && (
            <div className="text-center py-20" data-testid="empty-search-state">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No services match your filters
              </h2>
              <Button onClick={() => {
                setPriceRange([0, 1000]);
                setVerifiedOnly(false);
                setSelectedCategories([]);
              }} variant="outline" className="mt-4">
                Clear Filters
              </Button>
            </div>
          )}

          {/* Map View Overlay / Split */}
          {showMap && (
            <div className="mb-8 rounded-xl overflow-hidden border border-border h-[500px] shadow-lg relative">
              <GoogleMaps
                services={filteredServices}
                userLocation={null} // Default center 
                apiKey={mapsConfig?.apiKey || ""}
              />
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-4 right-4 shadow-md z-10"
                onClick={() => setShowMap(false)}
              >
                Close Map
              </Button>
            </div>
          )}

          {/* Services Grid */}
          {!showMap ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="services-grid">
              {isLoading ? (
                // Skeleton Loading State
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-xl border border-border h-[350px] animate-pulse relative overflow-hidden">
                    <div className="h-48 bg-muted w-full" />
                    <div className="p-4 space-y-3">
                      <div className="h-5 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                      <div className="h-10 bg-muted rounded w-full mt-4" />
                    </div>
                  </div>
                ))
              ) : filteredServices.length > 0 ? (
                filteredServices.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))
              ) : initialQuery ? (
                // No Results State
                <div className="col-span-full text-center py-20" data-testid="no-results-state">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    No services found
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
                    We couldn't find any services matching <strong>"{initialQuery}"</strong>.
                  </p>
                  <Button onClick={() => { setSearchInput(""); setLocation("/search"); }} variant="outline">
                    Clear Search
                  </Button>
                </div>
              ) : (
                <div className="col-span-full text-center py-20">
                  <p className="text-muted-foreground">No services available at the moment.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Use the map above to browse services by location.
            </div>
          )}

          {/* Load More (Visual only for now if pagination implemented later) */}
          {!showMap && filteredServices.length > 0 && (
            <div className="mt-12 text-center">
              <Button size="lg" variant="outline" className="min-w-[200px]">
                Load More Services
              </Button>
            </div>
          )}
        </div>
      </Layout>
    </div>
  );
}
