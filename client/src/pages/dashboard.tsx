import { Layout } from "@/components/layout";
import { ServiceCard } from "@/components/service-card";
import { SERVICES, CURRENT_USER, Service } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Settings, CreditCard, BarChart3, RefreshCw, Clock } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [myServices, setMyServices] = useState<Service[]>(SERVICES.filter(s => s.ownerId === CURRENT_USER.id));
  const { toast } = useToast();

  const handleStatusChange = (id: string, newStatus: Service['status']) => {
    setMyServices(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
    toast({
      title: "Status Updated",
      description: `Service status changed to ${newStatus}.`,
    });
  };

  const handleRenew = (id: string) => {
    // Mock renewal logic - extend expiry by 14 days
    setMyServices(prev => prev.map(s => {
      if (s.id === id) {
        const newDate = new Date();
        newDate.setDate(newDate.getDate() + 14);
        return { ...s, expiresAt: newDate.toISOString(), status: 'active' };
      }
      return s;
    }));
    toast({
      title: "Service Renewed",
      description: "Your service has been renewed for 14 days.",
    });
  };

  const isExpired = (dateStr: string) => {
    return new Date(dateStr).getTime() < new Date().getTime();
  };

  return (
    <Layout>
      <div className="bg-slate-50 min-h-screen py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-500">Manage your services and account settings</p>
            </div>
            <Button size="lg" className="gap-2 shadow-md shadow-primary/20">
              <PlusCircle className="w-4 h-4" /> Post New Service
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full text-primary">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Views</p>
                  <h3 className="text-2xl font-bold">1,234</h3>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-50 rounded-full text-green-600">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Active Plan</p>
                  <h3 className="text-2xl font-bold capitalize">{CURRENT_USER.marketingPackage}</h3>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-50 rounded-full text-amber-600">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Account Status</p>
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    Verified
                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">✓</Badge>
                  </h3>
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="services" className="w-full">
            <TabsList className="mb-6 bg-white p-1 border border-border">
              <TabsTrigger value="services">My Services</TabsTrigger>
              <TabsTrigger value="billing">Billing & Marketing</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="services" className="space-y-6">
              <div className="bg-white rounded-xl border border-border shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">Active Listings</h2>
                
                {myServices.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {myServices.map(service => {
                      const expired = isExpired(service.expiresAt);
                      return (
                        <div key={service.id} className="flex flex-col md:flex-row gap-6 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                           <div className="w-full md:w-48 aspect-video bg-slate-200 rounded-md overflow-hidden shrink-0 relative">
                              <img src={service.images[0]} alt="" className={`w-full h-full object-cover ${expired ? 'grayscale opacity-70' : ''}`} />
                              {expired && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                  <Badge variant="destructive">Expired</Badge>
                                </div>
                              )}
                           </div>
                           <div className="flex-1 py-1">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-bold text-lg">{service.title}</h3>
                                <Badge variant={service.status === 'active' && !expired ? 'default' : 'secondary'}>
                                  {expired ? 'Expired' : service.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{service.description}</p>
                              <div className="flex items-center gap-4 text-sm text-slate-500">
                                 <span>Price: <strong>${service.price}</strong>/{service.priceUnit}</span>
                                 <span className={`flex items-center gap-1 ${expired ? 'text-destructive font-medium' : ''}`}>
                                   <Clock className="w-3 h-3" />
                                   Expires: {new Date(service.expiresAt).toLocaleDateString()}
                                 </span>
                              </div>
                           </div>
                           <div className="flex md:flex-col gap-2 justify-center shrink-0">
                              {expired ? (
                                <Button className="w-full" size="sm" onClick={() => handleRenew(service.id)}>
                                  <RefreshCw className="w-3 h-3 mr-2" /> Renew
                                </Button>
                              ) : (
                                <>
                                  <Button variant="outline" size="sm">Edit</Button>
                                  {service.status === 'active' ? (
                                    <Button variant="secondary" size="sm" onClick={() => handleStatusChange(service.id, 'paused')}>Pause</Button>
                                  ) : (
                                    <Button variant="default" size="sm" onClick={() => handleStatusChange(service.id, 'active')}>Activate</Button>
                                  )}
                                </>
                              )}
                              <Button variant="destructive" size="sm">Delete</Button>
                           </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                   <div className="text-center py-12">
                      <p className="text-muted-foreground">You haven't posted any services yet.</p>
                      <Button variant="link" className="mt-2">Create your first post</Button>
                   </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="billing">
              <div className="bg-white rounded-xl border border-border shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Marketing Packages</h2>
                <p className="text-slate-500 mb-8">Boost your listings to get more clients.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="border rounded-xl p-6 hover:border-primary transition-colors cursor-pointer">
                      <h3 className="font-bold text-lg mb-2">Basic</h3>
                      <p className="text-3xl font-bold mb-4">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                      <ul className="text-sm space-y-2 mb-6 text-slate-600">
                        <li>• 1 Active Listing</li>
                        <li>• Standard Support</li>
                        <li>• 14 Days Visibility</li>
                      </ul>
                      <Button variant="outline" className="w-full">Current Plan</Button>
                   </div>
                   <div className="border rounded-xl p-6 border-primary bg-primary/5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-primary text-white text-xs px-3 py-1 rounded-bl-lg font-medium">Popular</div>
                      <h3 className="font-bold text-lg mb-2">Pro</h3>
                      <p className="text-3xl font-bold mb-4">$29<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                      <ul className="text-sm space-y-2 mb-6 text-slate-600">
                        <li>• 5 Active Listings</li>
                        <li>• Priority Support</li>
                        <li>• 30 Days Visibility</li>
                        <li>• Verified Badge</li>
                      </ul>
                      <Button className="w-full">Upgrade</Button>
                   </div>
                   <div className="border rounded-xl p-6 hover:border-primary transition-colors cursor-pointer">
                      <h3 className="font-bold text-lg mb-2">Enterprise</h3>
                      <p className="text-3xl font-bold mb-4">$99<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                      <ul className="text-sm space-y-2 mb-6 text-slate-600">
                        <li>• Unlimited Listings</li>
                        <li>• Dedicated Manager</li>
                        <li>• Featured Listings</li>
                      </ul>
                      <Button variant="outline" className="w-full">Contact Sales</Button>
                   </div>
                </div>
              </div>
            </TabsContent>

             <TabsContent value="settings">
              <div className="bg-white rounded-xl border border-border shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Identity Verification</h2>
                <p className="text-slate-500 mb-6">Verify your identity to build trust with clients and get a verified badge.</p>
                <Button>Start Verification Process</Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
