import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Mail, Book, Shield, DollarSign, User, ArrowRight, MessageCircle } from "lucide-react";
import { useState } from "react";

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <Layout>
      {/* Hero Section */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
            How can we help?
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Search our knowledge base or browse common topics below.
          </p>

          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              className="pl-12 h-12 text-lg shadow-sm"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Topic Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <TopicCard
            icon={<Book className="h-6 w-6 text-blue-500" />}
            title="Getting Started"
            description="Learn the basics of posting and booking services."
          />
          <TopicCard
            icon={<User className="h-6 w-6 text-purple-500" />}
            title="Account & Profile"
            description="Manage your settings, verification, and security."
          />
          <TopicCard
            icon={<DollarSign className="h-6 w-6 text-green-500" />}
            title="Payments"
            description="Understanding pricing, fees, and escrow protection."
          />
          <TopicCard
            icon={<Shield className="h-6 w-6 text-orange-500" />}
            title="Trust & Safety"
            description="Community guidelines, disputes, and safety tips."
          />
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="post-service" className="bg-card border rounded-lg px-6 shadow-sm">
              <AccordionTrigger className="text-lg font-medium hover:no-underline py-6">
                How do I post a service?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6">
                <p className="mb-4">Posting a service on Commerzio Services is quick and easy:</p>
                <ol className="list-decimal list-inside space-y-2 ml-4 mb-4">
                  <li>Log in to your account or create a new one</li>
                  <li>Click the "Post Service" button in the navigation bar</li>
                  <li>Fill in your service details including title, description, and price in CHF</li>
                  <li>Choose a category (our AI can help suggest the best category)</li>
                  <li>Add your location and contact information</li>
                </ol>
                <p>
                  Your service will be live immediately and will remain active for 14 days. You can renew or upgrade your listing at any time from your dashboard.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="find-services" className="bg-card border rounded-lg px-6 shadow-sm">
              <AccordionTrigger className="text-lg font-medium hover:no-underline py-6">
                How do I find trustworthy providers?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6">
                <p className="mb-4">We prioritize safety and trust in our community:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Look for the <strong>Verified</strong> badge next to provider names</li>
                  <li>Check ratings and read detailed reviews from other users</li>
                  <li>Use our secure messaging system to ask questions before booking</li>
                  <li>Always keep payments within the platform for Escrow protection</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="payment-pricing" className="bg-card border rounded-lg px-6 shadow-sm">
              <AccordionTrigger className="text-lg font-medium hover:no-underline py-6">
                How does payment protection work?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6">
                <p className="mb-4">Commerzio uses a secure Escrow system to protect both parties:</p>
                <p className="mb-4">
                  When you book a service, your payment is held securely by us. The funds are only released to the provider <strong>after</strong> you confirm the service has been completed to your satisfaction.
                </p>
                <p>
                  If there is a dispute, our support team steps in to mediate. This ensures you never pay for work that isn't done, and providers always get paid for completed work.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="fees" className="bg-card border rounded-lg px-6 shadow-sm">
              <AccordionTrigger className="text-lg font-medium hover:no-underline py-6">
                Are there any fees?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6">
                <p>
                  <strong>For Customers:</strong> Booking is free. You only pay the listed price for the service.
                </p>
                <p className="mt-2">
                  <strong>For Providers:</strong> Basic listings are free. We charge a small service fee (5%) only on successful bookings processed through our platform. Premium visibility packages are optional.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Contact Support */}
        <div className="max-w-3xl mx-auto mt-20 p-8 rounded-2xl bg-muted/30 border border-border text-center">
          <MessageCircle className="w-12 h-12 mx-auto text-primary mb-4" />
          <h3 className="text-2xl font-bold mb-2">Still have questions?</h3>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Can't find the answer you're looking for? Our friendly support team is here to help you 7 days a week.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2">
              <Mail className="h-4 w-4" />
              Email Support
            </Button>
            <Button size="lg" variant="outline" className="gap-2 bg-background">
              Visit Community Forum <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function TopicCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
      <CardHeader>
        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/5 transition-colors">
          {icon}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}
