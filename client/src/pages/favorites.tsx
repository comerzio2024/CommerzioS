import { Layout } from "@/components/layout";
import { ServiceCard } from "@/components/service-card";
import { CategoryFilterBar } from "@/components/category-filter-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, ArrowRight, Sparkles, Bookmark, MapPin, DollarSign, Eye, Calendar } from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useSavedListingsFilter } from "@/hooks/useSavedListingsFilter";
import { apiRequest, type FavoriteWithService, type CategoryWithTemporary } from "@/lib/api";
import { useEffect, useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface SavedServiceRequest {
  id: string;
  title: string;
  description: string;
  budgetMin: string | null;
  budgetMax: string | null;
  locationCity: string | null;
  locationCanton: string | null;
  status: string;
  createdAt: string;
  proposalCount: number;
  viewCount: number;
}

export default function Saved() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { selectedCategory, setSelectedCategory } = useSavedListingsFilter();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("services");

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const { data: saved = [], isLoading: savedLoading } = useQuery<FavoriteWithService[]>({
    queryKey: ["/api/favorites"],
    queryFn: () => apiRequest("/api/favorites"),
    enabled: isAuthenticated,
  });

  // Fetch saved service requests
  const { data: savedRequests = [], isLoading: requestsLoading } = useQuery<SavedServiceRequest[]>({
    queryKey: ["service-requests", "saved"],
    queryFn: () => apiRequest("/api/service-requests/saved"),
    enabled: isAuthenticated,
  });

  // Unsave request mutation
  const unsaveRequestMutation = useMutation({
    mutationFn: (requestId: string) =>
      apiRequest(`/api/service-requests/${requestId}/save`, { method: "DELETE" }),
    onSuccess: () => {
      toast({ title: "Removed from saved" });
      queryClient.invalidateQueries({ queryKey: ["service-requests", "saved"] });
    },
  });

  const { data: categories = [] } = useQuery<CategoryWithTemporary[]>({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("/api/categories"),
  });

  // Filter saved services by category
  const filteredSaved = useMemo(() => {
    if (!selectedCategory) return saved;
    return saved.filter((fav) => fav.service.categoryId === selectedCategory);
  }, [saved, selectedCategory]);

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    saved.forEach((fav) => {
      counts[fav.service.categoryId] = (counts[fav.service.categoryId] || 0) + 1;
    });
    return counts;
  }, [saved]);

  // Show loading state while checking auth
  if (authLoading || savedLoading || requestsLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-slate-400 animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Loading your saved services...</h3>
          </div>
        </div>
      </Layout>
    );
  }

  // Redirect message for unauthenticated users
  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-lg mx-auto">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign In to View Saved Services</h2>
            <p className="text-slate-600 mb-6">
              You need to be signed in to save and view your saved services.
            </p>
            <Link href="/">
              <Button className="gap-2">
                Browse Services <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gradient-to-b from-slate-50 to-white min-h-screen">
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-8">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-50 rounded-full">
                  <Bookmark className="w-6 h-6 text-red-500 fill-red-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Your Saved Items</h1>
                  <div className="text-slate-600 mt-1">
                    {saved.length} service{saved.length !== 1 ? 's' : ''} · {savedRequests.length} request{savedRequests.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="services" className="gap-2">
                <Heart className="w-4 h-4" />
                Services
                {saved.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{saved.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="requests" className="gap-2">
                <Bookmark className="w-4 h-4" />
                Service Requests
                {savedRequests.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{savedRequests.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Saved Services Tab */}
            <TabsContent value="services">
              {/* Category Filter Bar */}
              {saved.length > 0 && (
                <div className="mb-6">
                  <CategoryFilterBar
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    serviceCount={saved.length}
                    categoryCounts={categoryCounts}
                  />
                </div>
              )}

              {saved.length > 0 ? (
                filteredSaved.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredSaved.map((fav, index) => (
                      <motion.div
                        key={fav.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        data-testid={`saved-service-${fav.service.id}`}
                      >
                        <ServiceCard service={fav.service} isSaved={true} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-center py-20 bg-white rounded-2xl border border-dashed"
                  >
                    <div className="mx-auto w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                      <Heart className="w-10 h-10 text-slate-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">No Services in This Category</h2>
                    <p className="text-slate-600 max-w-md mx-auto mb-6">
                      You don't have any saved services in this category.
                    </p>
                    <Button variant="outline" onClick={() => setSelectedCategory(null)}>
                      Show All Saved Services
                    </Button>
                  </motion.div>
                )
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-20 bg-white rounded-2xl border border-dashed"
                  data-testid="empty-saved-state"
                >
                  <div className="mx-auto w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <Heart className="w-10 h-10 text-slate-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">No Saved Services Yet</h2>
                  <p className="text-slate-600 max-w-md mx-auto mb-6">
                    You haven't saved any services yet. Browse services and click the heart icon to save your favorites!
                  </p>
                  <Link href="/">
                    <Button size="lg" className="gap-2" data-testid="button-browse-services-empty">
                      Browse Services <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </motion.div>
              )}
            </TabsContent>

            {/* Saved Service Requests Tab */}
            <TabsContent value="requests">
              {savedRequests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {savedRequests.map((request, index) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                    >
                      <Card className="h-full">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <CardTitle className="line-clamp-2">{request.title}</CardTitle>
                              <CardDescription className="mt-1 line-clamp-2">
                                {request.description}
                              </CardDescription>
                            </div>
                            <Badge variant={request.status === "open" ? "default" : "secondary"}>
                              {request.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex flex-wrap gap-4 text-sm">
                            {(request.budgetMin || request.budgetMax) && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4 text-muted-foreground" />
                                CHF {request.budgetMin || '0'} - {request.budgetMax || '∞'}
                              </div>
                            )}
                            {request.locationCity && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                {request.locationCity}
                                {request.locationCanton && `, ${request.locationCanton}`}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {request.viewCount} views
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="gap-2">
                          {request.status === "open" && (
                            <Button
                              onClick={() => navigate(`/service-requests?tab=browse&requestId=${request.id}`)}
                              className="gap-2"
                            >
                              Submit Proposal
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => unsaveRequestMutation.mutate(request.id)}
                            disabled={unsaveRequestMutation.isPending}
                            className="ml-auto"
                          >
                            <Bookmark className="w-4 h-4 fill-current" />
                            Unsave
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-20 bg-white rounded-2xl border border-dashed"
                >
                  <div className="mx-auto w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <Bookmark className="w-10 h-10 text-slate-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">No Saved Requests Yet</h2>
                  <p className="text-slate-600 max-w-md mx-auto mb-6">
                    You haven't saved any service requests yet. Browse requests and click the bookmark icon to save them for later!
                  </p>
                  <Link href="/service-requests">
                    <Button size="lg" className="gap-2">
                      Browse Service Requests <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
