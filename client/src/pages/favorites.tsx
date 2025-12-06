import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, ArrowRight, Sparkles, Search, Grid3X3, List, Star, Trash2, ExternalLink, Briefcase } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, type FavoriteWithService, type CategoryWithTemporary } from "@/lib/api";
import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function Saved() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const { data: saved = [], isLoading: savedLoading } = useQuery<FavoriteWithService[]>({
    queryKey: ["/api/favorites"],
    queryFn: () => apiRequest("/api/favorites"),
    enabled: isAuthenticated,
  });

  const { data: categories = [] } = useQuery<CategoryWithTemporary[]>({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("/api/categories"),
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      await apiRequest(`/api/favorites/${serviceId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({ title: "Removed from favorites" });
    },
  });

  // Filter saved services by search and category
  const filteredSaved = useMemo(() => {
    let result = saved;
    if (searchQuery) {
      result = result.filter((fav) =>
        fav.service.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedCategory) {
      result = result.filter((fav) => fav.service.categoryId === selectedCategory);
    }
    return result;
  }, [saved, searchQuery, selectedCategory]);

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    saved.forEach((fav) => {
      counts[fav.service.categoryId] = (counts[fav.service.categoryId] || 0) + 1;
    });
    return counts;
  }, [saved]);

  // Show loading state while checking auth
  if (authLoading || savedLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          <div className="container mx-auto px-4 py-20">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-slate-800/50 backdrop-blur-xl rounded-full flex items-center justify-center mb-4 border border-slate-700">
                <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-white">Loading your saved services...</h3>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Redirect message for unauthenticated users
  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          <div className="container mx-auto px-4 py-20">
            <div className="text-center max-w-lg mx-auto">
              <div className="mx-auto w-20 h-20 bg-cyan-500/20 backdrop-blur-xl rounded-full flex items-center justify-center mb-6 border border-cyan-500/30">
                <Heart className="w-10 h-10 text-cyan-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Sign In to View Saved Services</h2>
              <p className="text-slate-400 mb-8">
                You need to be signed in to save and view your favorite services.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/login">
                  <Button variant="outline" className="border-slate-700 text-white hover:bg-white/10">
                    Sign In
                  </Button>
                </Link>
                <Link href="/">
                  <Button className="gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white shadow-lg shadow-cyan-500/25">
                    Browse Services <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        {/* Header Section */}
        <div className="backdrop-blur-xl bg-slate-900/50 border-b border-slate-800">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-500/30">
                  <Heart className="w-8 h-8 text-cyan-400 fill-cyan-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">My Favorites</h1>
                  <p className="text-slate-400 mt-1">Services you've saved for later</p>
                </div>
              </div>
              <Link href="/">
                <Button className="gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white shadow-lg shadow-cyan-500/25">
                  Browse More <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Search & Controls */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search your saved services..."
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid"
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                    : "border-slate-700 text-slate-300 hover:bg-white/10"}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list"
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                    : "border-slate-700 text-slate-300 hover:bg-white/10"}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Category Pills */}
            {saved.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge
                  variant={selectedCategory === null ? "default" : "secondary"}
                  className={`cursor-pointer transition-all ${selectedCategory === null
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  onClick={() => setSelectedCategory(null)}
                >
                  All ({saved.length})
                </Badge>
                {categories
                  .filter((cat) => categoryCounts[cat.id])
                  .map((cat) => (
                    <Badge
                      key={cat.id}
                      variant={selectedCategory === cat.id ? "default" : "secondary"}
                      className={`cursor-pointer transition-all ${selectedCategory === cat.id
                        ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      {cat.name} ({categoryCounts[cat.id]})
                    </Badge>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Stats Bar */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-slate-400">
              {filteredSaved.length} saved service{filteredSaved.length !== 1 ? 's' : ''}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>

          {/* Favorites Grid/List */}
          {filteredSaved.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredSaved.map((fav, i) => (
                  <motion.div
                    key={fav.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -8 }}
                  >
                    <Card className="overflow-hidden bg-slate-900/50 border-slate-800 backdrop-blur-xl group hover:shadow-2xl hover:shadow-cyan-500/10 transition-all">
                      <div className="relative h-48 bg-slate-800">
                        {fav.service.images?.[0] ? (
                          <img
                            src={fav.service.images[0]}
                            alt={fav.service.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Briefcase className="w-16 h-16 text-slate-600" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />

                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-3 right-3 w-9 h-9 bg-slate-900/80 hover:bg-red-500/20 rounded-full text-cyan-400"
                          onClick={() => removeFavoriteMutation.mutate(fav.service.id)}
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </Button>

                        <Badge className="absolute top-3 left-3 bg-slate-900/80 text-cyan-400 border-cyan-500/30">
                          {fav.service.category?.name || "Service"}
                        </Badge>

                        <div className="absolute bottom-3 left-3">
                          <span className="text-white font-bold text-lg">
                            CHF {fav.service.price || "On request"}
                          </span>
                        </div>
                      </div>

                      <CardContent className="p-4">
                        <Link href={`/service/${fav.service.id}`}>
                          <h3 className="font-semibold text-white mb-2 line-clamp-2 hover:text-cyan-400 transition-colors cursor-pointer">
                            {fav.service.title}
                          </h3>
                        </Link>

                        <div className="flex items-center gap-2 mb-3">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={fav.service.owner?.profileImageUrl || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-xs">
                              {fav.service.owner?.firstName?.charAt(0) || "V"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-slate-300">{fav.service.owner?.firstName || "Provider"}</span>
                          <div className="flex items-center gap-1 ml-auto">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium text-white">
                              {fav.service.rating?.toFixed(1) || "5.0"}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Link href={`/service/${fav.service.id}`} className="flex-1">
                            <Button variant="outline" className="w-full border-slate-700 text-white hover:bg-white/10" size="sm">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => removeFavoriteMutation.mutate(fav.service.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSaved.map((fav, i) => (
                  <motion.div
                    key={fav.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="overflow-hidden bg-slate-900/50 border-slate-800 backdrop-blur-xl hover:shadow-lg hover:shadow-cyan-500/10 transition-all">
                      <div className="flex flex-col sm:flex-row">
                        <div className="w-full sm:w-48 h-36 shrink-0 bg-slate-800">
                          {fav.service.images?.[0] ? (
                            <img
                              src={fav.service.images[0]}
                              alt={fav.service.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Briefcase className="w-12 h-12 text-slate-600" />
                            </div>
                          )}
                        </div>
                        <CardContent className="flex-1 p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <Badge variant="secondary" className="mb-2 bg-slate-800 text-cyan-400 border-cyan-500/30">
                                {fav.service.category?.name}
                              </Badge>
                              <Link href={`/service/${fav.service.id}`}>
                                <h3 className="font-semibold text-lg text-white hover:text-cyan-400 transition-colors cursor-pointer">
                                  {fav.service.title}
                                </h3>
                              </Link>
                              <p className="text-sm text-slate-400 line-clamp-2 mt-1">
                                {fav.service.description}
                              </p>
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-xl font-bold text-cyan-400">
                                CHF {fav.service.price || "On request"}
                              </div>
                              <div className="flex items-center gap-1 justify-end mt-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium text-white">{fav.service.rating?.toFixed(1) || "5.0"}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={fav.service.owner?.profileImageUrl || undefined} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-xs">
                                  {fav.service.owner?.firstName?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-slate-300">{fav.service.owner?.firstName}</span>
                            </div>
                            <div className="flex gap-2">
                              <Link href={`/service/${fav.service.id}`}>
                                <Button variant="outline" size="sm" className="border-slate-700 text-white hover:bg-white/10">
                                  View Details
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                onClick={() => removeFavoriteMutation.mutate(fav.service.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-12 text-center bg-slate-900/50 border-slate-800 backdrop-blur-xl">
                <div className="mx-auto w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 border border-slate-700">
                  <Heart className="w-10 h-10 text-slate-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  {searchQuery ? "No matches found" : "No favorites yet"}
                </h3>
                <p className="text-slate-400 max-w-md mx-auto mb-6">
                  {searchQuery
                    ? `No saved services match "${searchQuery}"`
                    : "Start saving services you like by clicking the heart icon!"}
                </p>
                {searchQuery ? (
                  <Button
                    variant="outline"
                    onClick={() => setSearchQuery("")}
                    className="border-slate-700 text-white hover:bg-white/10"
                  >
                    Clear Search
                  </Button>
                ) : (
                  <Link href="/">
                    <Button className="gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white shadow-lg shadow-cyan-500/25">
                      Browse Services <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}
