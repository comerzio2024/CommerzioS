/**
 * Referral Dashboard Page
 * 
 * Displays user's referral statistics, referral link, 
 * referral history, and points management.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Copy, 
  Users, 
  Gift, 
  TrendingUp, 
  Star,
  History,
  Award,
  Share2,
  CheckCircle,
  Clock,
  ArrowRight,
} from "lucide-react";

interface ReferralStats {
  referralCode: string;
  referralLink: string;
  totalDirectReferrals: number;
  activeDirectReferrals: number;
  totalNetworkSize: number;
  totalPointsEarned: number;
  currentPoints: number;
  totalCommissionEarned: number;
  pendingCommission: number;
  referralRank: number | null;
  lastReferralAt: string | null;
}

interface Referral {
  id: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  status: string;
}

interface PointsHistory {
  id: string;
  points: number;
  balanceAfter: number;
  action: string;
  description: string | null;
  createdAt: string;
}

interface PointsSummary {
  currentBalance: number;
  totalEarned: number;
  totalRedeemed: number;
  recentActivity: Array<{
    action: string;
    points: number;
    createdAt: string;
  }>;
}

interface ReferralConfig {
  maxLevels: number;
  pointsPerReferral: number;
  pointsPerFirstPurchase: number;
  pointsPerServiceCreation: number;
  pointsPerReview: number;
  pointsToDiscountRate: number;
  minPointsToRedeem: number;
  isActive: boolean;
}

export default function ReferralsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [redeemPoints, setRedeemPoints] = useState<number>(0);

  // Fetch referral stats
  const { data: stats, isLoading: statsLoading } = useQuery<ReferralStats>({
    queryKey: ["/api/referral/my-stats"],
  });

  // Fetch user's referrals
  const { data: referrals, isLoading: referralsLoading } = useQuery<Referral[]>({
    queryKey: ["/api/referral/my-referrals"],
  });

  // Fetch points summary
  const { data: pointsSummary, isLoading: pointsLoading } = useQuery<PointsSummary>({
    queryKey: ["/api/points/summary"],
  });

  // Fetch points history
  const { data: pointsHistory } = useQuery<PointsHistory[]>({
    queryKey: ["/api/points/history"],
  });

  // Fetch referral config
  const { data: config } = useQuery<ReferralConfig>({
    queryKey: ["/api/referral/config"],
  });

  // Copy referral link
  const copyReferralLink = async () => {
    if (stats?.referralLink) {
      await navigator.clipboard.writeText(stats.referralLink);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
    }
  };

  // Copy referral code
  const copyReferralCode = async () => {
    if (stats?.referralCode) {
      await navigator.clipboard.writeText(stats.referralCode);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
    }
  };

  // Share referral link
  const shareReferralLink = async () => {
    if (stats?.referralLink && navigator.share) {
      try {
        await navigator.share({
          title: "Join me on Commerzio!",
          text: "Sign up using my referral link and we both earn rewards!",
          url: stats.referralLink,
        });
      } catch (err) {
        // User cancelled or error
        copyReferralLink();
      }
    } else {
      copyReferralLink();
    }
  };

  // Redeem points mutation
  const redeemMutation = useMutation({
    mutationFn: async (data: { points: number; redemptionType: string }) => {
      const res = await fetch("/api/points/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to redeem points");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Points Redeemed!",
        description: `You received CHF ${data.discountValue?.toFixed(2)} discount credit`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/points/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/referral/my-stats"] });
      setRedeemPoints(0);
    },
    onError: (error: Error) => {
      toast({
        title: "Redemption Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRedeem = () => {
    if (redeemPoints >= (config?.minPointsToRedeem || 100)) {
      redeemMutation.mutate({ points: redeemPoints, redemptionType: "discount" });
    }
  };

  // Format action name for display
  const formatAction = (action: string): string => {
    const actionMap: Record<string, string> = {
      referral_signup: "Referral Signup",
      referral_first_purchase: "Referral Purchase",
      referral_service_created: "Referral Service",
      service_created: "Service Created",
      review_posted: "Review Posted",
      purchase_made: "Purchase",
      redemption: "Redemption",
      admin_adjustment: "Admin Adjustment",
      bonus: "Bonus",
    };
    return actionMap[action] || action;
  };

  if (statsLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-8 px-4">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid gap-6 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Referral Program
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Invite friends and earn rewards for every referral
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-blue-100">Your Points</CardDescription>
              <CardTitle className="text-3xl">{stats?.currentPoints || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-blue-100 text-sm">
                <Star className="h-4 w-4 mr-1" />
                Total earned: {stats?.totalPointsEarned || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-green-100">Total Referrals</CardDescription>
              <CardTitle className="text-3xl">{stats?.totalDirectReferrals || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-green-100 text-sm">
                <Users className="h-4 w-4 mr-1" />
                Network: {stats?.totalNetworkSize || 0} users
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-purple-100">Commission Earned</CardDescription>
              <CardTitle className="text-3xl">
                CHF {(stats?.totalCommissionEarned || 0).toFixed(2)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-purple-100 text-sm">
                <Clock className="h-4 w-4 mr-1" />
                Pending: CHF {(stats?.pendingCommission || 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-orange-100">Referral Rank</CardDescription>
              <CardTitle className="text-3xl">
                {stats?.referralRank ? `#${stats.referralRank}` : "—"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-orange-100 text-sm">
                <Award className="h-4 w-4 mr-1" />
                Keep referring to climb!
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Link Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Your Referral Link
            </CardTitle>
            <CardDescription>
              Share this link with friends. When they sign up and make purchases, you both earn rewards!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="flex gap-2">
                  <Input
                    value={stats?.referralLink || ""}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" onClick={copyReferralLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Your code: <strong className="font-mono">{stats?.referralCode}</strong>
                  <Button variant="ghost" size="sm" onClick={copyReferralCode} className="ml-2 h-6 px-2">
                    <Copy className="h-3 w-3" />
                  </Button>
                </p>
              </div>
              <Button onClick={shareReferralLink} className="sm:w-auto">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="referrals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="referrals">My Referrals</TabsTrigger>
            <TabsTrigger value="points">Points History</TabsTrigger>
            <TabsTrigger value="rewards">Redeem Rewards</TabsTrigger>
          </TabsList>

          {/* Referrals Tab */}
          <TabsContent value="referrals">
            <Card>
              <CardHeader>
                <CardTitle>Your Referrals</CardTitle>
                <CardDescription>
                  People who signed up using your referral link
                </CardDescription>
              </CardHeader>
              <CardContent>
                {referralsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16" />
                    ))}
                  </div>
                ) : referrals && referrals.length > 0 ? (
                  <div className="space-y-4">
                    {referrals.map((referral) => (
                      <div
                        key={referral.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                            {referral.firstName?.charAt(0) || "U"}
                          </div>
                          <div>
                            <p className="font-medium">
                              {referral.firstName} {referral.lastName}
                            </p>
                            <p className="text-sm text-gray-500">
                              Joined {new Date(referral.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={referral.status === "active" ? "default" : "secondary"}>
                          {referral.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No referrals yet
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Share your referral link to start earning rewards!
                    </p>
                    <Button onClick={shareReferralLink}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Your Link
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Points History Tab */}
          <TabsContent value="points">
            <Card>
              <CardHeader>
                <CardTitle>Points History</CardTitle>
                <CardDescription>
                  Track how you've earned and spent your points
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pointsHistory && pointsHistory.length > 0 ? (
                  <div className="space-y-3">
                    {pointsHistory.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            entry.points > 0 
                              ? "bg-green-100 text-green-600" 
                              : "bg-red-100 text-red-600"
                          }`}>
                            {entry.points > 0 ? (
                              <TrendingUp className="h-5 w-5" />
                            ) : (
                              <History className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{formatAction(entry.action)}</p>
                            <p className="text-sm text-gray-500">
                              {entry.description || new Date(entry.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${
                            entry.points > 0 ? "text-green-600" : "text-red-600"
                          }`}>
                            {entry.points > 0 ? "+" : ""}{entry.points}
                          </p>
                          <p className="text-sm text-gray-500">
                            Balance: {entry.balanceAfter}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <History className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No points activity yet
                    </h3>
                    <p className="text-gray-500">
                      Start referring friends to earn your first points!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Redeem Points</CardTitle>
                  <CardDescription>
                    Convert your points into discounts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      Current balance: <strong>{stats?.currentPoints || 0} points</strong>
                    </p>
                    <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                      1 point = CHF {config?.pointsToDiscountRate || 0.01}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Points to redeem
                    </label>
                    <Input
                      type="number"
                      min={config?.minPointsToRedeem || 100}
                      max={stats?.currentPoints || 0}
                      value={redeemPoints}
                      onChange={(e) => setRedeemPoints(parseInt(e.target.value) || 0)}
                      placeholder={`Min ${config?.minPointsToRedeem || 100} points`}
                    />
                    {redeemPoints > 0 && (
                      <p className="text-sm text-green-600 mt-2">
                        = CHF {(redeemPoints * (config?.pointsToDiscountRate || 0.01)).toFixed(2)} discount
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleRedeem}
                    disabled={
                      redeemPoints < (config?.minPointsToRedeem || 100) ||
                      redeemPoints > (stats?.currentPoints || 0) ||
                      redeemMutation.isPending
                    }
                    className="w-full"
                  >
                    {redeemMutation.isPending ? "Redeeming..." : "Redeem for Discount"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>How to Earn Points</CardTitle>
                  <CardDescription>
                    Multiple ways to earn rewards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Refer a Friend</p>
                        <p className="text-sm text-gray-500">When someone signs up</p>
                      </div>
                      <Badge variant="secondary">+{config?.pointsPerReferral || 100}</Badge>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <Gift className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Referral's First Purchase</p>
                        <p className="text-sm text-gray-500">When they buy a service</p>
                      </div>
                      <Badge variant="secondary">+{config?.pointsPerFirstPurchase || 50}</Badge>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Create a Service</p>
                        <p className="text-sm text-gray-500">List your own service</p>
                      </div>
                      <Badge variant="secondary">+{config?.pointsPerServiceCreation || 25}</Badge>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="h-10 w-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                        <Star className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Write a Review</p>
                        <p className="text-sm text-gray-500">Review a service</p>
                      </div>
                      <Badge variant="secondary">+{config?.pointsPerReview || 10}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

