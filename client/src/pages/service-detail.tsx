import { Layout } from "@/components/layout";
import { SERVICES, USERS, REVIEWS, CURRENT_USER } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useRoute, useLocation } from "wouter";
import { Star, MapPin, CheckCircle2, Calendar, ShieldCheck, Flag, Share2, Heart, Lock } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

export default function ServiceDetail() {
  const [match, params] = useRoute("/service/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isContactRevealed, setIsContactRevealed] = useState(false);
  const [reviewText, setReviewText] = useState("");

  if (!match) return null;

  const service = SERVICES.find(s => s.id === params.id);
  
  if (!service) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Service not found</h1>
          <Button onClick={() => setLocation("/")} className="mt-4">Go Home</Button>
        </div>
      </Layout>
    );
  }

  const owner = USERS.find(u => u.id === service.ownerId);
  const reviews = REVIEWS.filter(r => r.serviceId === service.id);

  const handleContact = () => {
    if (!CURRENT_USER) {
      toast({
        title: "Login Required",
        description: "Please log in to contact service providers.",
        variant: "destructive"
      });
      return;
    }
    setIsContactRevealed(true);
  };

  const handleSubmitReview = () => {
    if (!CURRENT_USER.isVerified) {
      toast({
        title: "Verification Required",
        description: "You must complete identity verification to leave reviews.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Review Submitted",
      description: "Your review has been submitted for moderation.",
    });
    setReviewText("");
  };

  return (
    <Layout>
      <div className="bg-slate-50 min-h-screen pb-20">
        {/* Header/Breadcrumb area could go here */}
        
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Images & Details */}
            <div className="lg:col-span-2 space-y-8">
              <div className="rounded-2xl overflow-hidden bg-white shadow-sm border border-border">
                <div className="aspect-video bg-slate-100 relative">
                   <img 
                    src={service.images[0]} 
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary" className="text-sm">{service.category}</Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" /> {service.location}
                    </div>
                  </div>
                  
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{service.title}</h1>
                  
                  <div className="flex items-center gap-6 pb-6 border-b border-border">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-lg">{service.rating}</span>
                      <span className="text-muted-foreground">({service.reviewCount} reviews)</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="w-5 h-5" />
                      <span>Posted {new Date(service.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="py-6">
                    <h3 className="text-xl font-semibold mb-4">About this Service</h3>
                    <p className="text-slate-600 leading-relaxed text-lg">
                      {service.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {service.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="px-3 py-1 text-sm bg-slate-50">#{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reviews Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-border p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    Reviews <Badge variant="secondary" className="rounded-full">{reviews.length}</Badge>
                  </h3>
                </div>
                
                <div className="mb-8 p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <h4 className="font-semibold mb-2">Write a Review</h4>
                  {CURRENT_USER ? (
                    <div className="space-y-4">
                      {!CURRENT_USER.isVerified && (
                        <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 p-3 rounded-lg border border-amber-100 mb-4">
                          <Lock className="w-4 h-4" />
                          <span>Identity verification required to post reviews.</span>
                          <Button variant="link" className="h-auto p-0 text-amber-700 underline">Verify now</Button>
                        </div>
                      )}
                      <Textarea 
                        placeholder="Share your experience with this provider..." 
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        disabled={!CURRENT_USER.isVerified}
                        className="bg-white"
                      />
                      <div className="flex justify-end">
                        <Button onClick={handleSubmitReview} disabled={!CURRENT_USER.isVerified || !reviewText}>
                          Post Review
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground mb-2">Please log in to leave a review.</p>
                      <Button variant="outline" onClick={() => setLocation("/auth")}>Log In</Button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {reviews.map(review => (
                    <div key={review.id} className="border-b border-border last:border-0 pb-6 last:pb-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-primary">
                            {review.userName[0]}
                          </div>
                          <div>
                            <div className="font-semibold">{review.userName}</div>
                            <div className="text-xs text-muted-foreground">{review.date}</div>
                          </div>
                        </div>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-600 pl-13">{review.comment}</p>
                    </div>
                  ))}
                  
                  {reviews.length === 0 && (
                    <p className="text-slate-500 italic">No reviews yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Sticky Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                
                {/* Price Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-border p-6">
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold text-primary">${service.price}</span>
                    <span className="text-muted-foreground font-medium">/{service.priceUnit}</span>
                  </div>

                  <div className="space-y-3">
                    {!isContactRevealed ? (
                      <Button size="lg" className="w-full text-lg font-semibold h-12 shadow-lg shadow-primary/20" onClick={handleContact}>
                        Contact Provider
                      </Button>
                    ) : (
                      <div className="bg-slate-50 p-4 rounded-lg border border-primary/20 space-y-2 animate-in fade-in zoom-in-95">
                        <p className="font-medium text-primary">Contact Information:</p>
                        {service.contactPhone && <p className="flex items-center gap-2"><span className="font-bold">Phone:</span> {service.contactPhone}</p>}
                        {service.contactEmail && <p className="flex items-center gap-2"><span className="font-bold">Email:</span> {service.contactEmail}</p>}
                        <p className="text-xs text-muted-foreground mt-2">Mention ServeMkt when you contact them!</p>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 gap-2">
                        <Heart className="w-4 h-4" /> Save
                      </Button>
                      <Button variant="outline" className="flex-1 gap-2">
                        <Share2 className="w-4 h-4" /> Share
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Provider Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-border p-6">
                  <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Service Provider</h4>
                  <div className="flex items-center gap-4 mb-4">
                    <img 
                      src={owner?.avatar} 
                      alt={owner?.name} 
                      className="w-16 h-16 rounded-full ring-4 ring-slate-50"
                    />
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-lg">{owner?.name}</span>
                        {owner?.isVerified && <CheckCircle2 className="w-5 h-5 text-primary fill-primary/10" />}
                      </div>
                      <p className="text-sm text-muted-foreground">Member since 2023</p>
                    </div>
                  </div>
                  
                  {owner?.isVerified ? (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-100">
                      <ShieldCheck className="w-5 h-5" />
                      Identity Verified
                    </div>
                  ) : (
                     <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">
                      <ShieldCheck className="w-5 h-5" />
                      Identity Not Verified
                    </div>
                  )}
                </div>
                
                <div className="text-center">
                  <Button variant="link" className="text-muted-foreground text-xs gap-1">
                    <Flag className="w-3 h-3" /> Report this service
                  </Button>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
