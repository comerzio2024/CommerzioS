/**
 * COM Points Rewards Dashboard
 * 
 * Clean, organized rewards page with isolated loading states
 * and a more focused mission-centric design.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/config";
import {
    Zap,
    Star,
    Gift,
    ShoppingBag,
    History,
    Users,
    Share2,
    MessageSquare,
    Award,
    Check,
    Loader2,
    ChevronRight,
    Trophy,
} from "lucide-react";

// Types
interface Mission {
    mission: {
        id: string;
        name: string;
        description: string | null;
        category: "referral" | "social_media" | "engagement" | "milestone";
        rewardPoints: number;
        tier: number | null;
        targetCount: number | null;
        isRepeatable: boolean;
    };
    userProgress?: {
        id: string;
        status: "available" | "in_progress" | "completed" | "claimed" | "expired";
        progress: number;
        targetCount: number;
    };
}

interface PointsTransaction {
    id: string;
    amount: number;
    balanceAfter: number;
    sourceType: string;
    description: string | null;
    createdAt: string;
}

interface RedemptionItem {
    id: string;
    name: string;
    description: string | null;
    costPoints: number;
    itemType: string;
    isActive: boolean;
    stock: number | null;
}

// Category config
const categoryConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    referral: { icon: <Users className="h-4 w-4" />, color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/20" },
    social_media: { icon: <Share2 className="h-4 w-4" />, color: "text-blue-600", bg: "bg-blue-500/10 border-blue-500/20" },
    engagement: { icon: <MessageSquare className="h-4 w-4" />, color: "text-purple-600", bg: "bg-purple-500/10 border-purple-500/20" },
    milestone: { icon: <Award className="h-4 w-4" />, color: "text-amber-600", bg: "bg-amber-500/10 border-amber-500/20" },
};

export default function RewardsPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("missions");
    const [loadingMissionId, setLoadingMissionId] = useState<string | null>(null);
    const [loadingItemId, setLoadingItemId] = useState<string | null>(null);

    // Queries
    const { data: balanceData, isLoading: balanceLoading } = useQuery<{ balance: number }>({
        queryKey: ["/api/com-points/balance"],
    });

    const { data: missionsData, isLoading: missionsLoading } = useQuery<{ missions: Mission[] }>({
        queryKey: ["/api/com-points/missions"],
    });

    const { data: historyData } = useQuery<{ history: PointsTransaction[] }>({
        queryKey: ["/api/com-points/history"],
    });

    const { data: shopData, isLoading: shopLoading } = useQuery<{ items: RedemptionItem[] }>({
        queryKey: ["/api/com-points/shop"],
    });

    // Start mission
    const startMission = useMutation({
        mutationFn: async (missionId: string) => {
            setLoadingMissionId(missionId);
            const res = await fetchApi(`/api/com-points/missions/${missionId}/start`, { method: "POST" });
            if (!res.ok) throw new Error("Failed to start mission");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/com-points/missions"] });
            toast({ title: "Mission Started!", description: "Good luck!" });
        },
        onSettled: () => setLoadingMissionId(null),
    });

    // Claim reward
    const claimReward = useMutation({
        mutationFn: async (missionId: string) => {
            setLoadingMissionId(missionId);
            const res = await fetchApi(`/api/com-points/missions/${missionId}/claim`, { method: "POST" });
            if (!res.ok) throw new Error("Failed to claim reward");
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["/api/com-points/missions"] });
            queryClient.invalidateQueries({ queryKey: ["/api/com-points/balance"] });
            toast({ title: "Reward Claimed! 🎉", description: `+${data.pointsAwarded} COM Points` });
        },
        onSettled: () => setLoadingMissionId(null),
    });

    // Redeem item
    const redeemItem = useMutation({
        mutationFn: async (itemId: string) => {
            setLoadingItemId(itemId);
            const res = await fetchApi(`/api/com-points/redeem/${itemId}`, { method: "POST" });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to redeem");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/com-points/balance"] });
            queryClient.invalidateQueries({ queryKey: ["/api/com-points/shop"] });
            toast({ title: "Redeemed! 🎁", description: "Check your account for the reward." });
        },
        onError: (error: Error) => {
            toast({ title: "Failed", description: error.message, variant: "destructive" });
        },
        onSettled: () => setLoadingItemId(null),
    });

    // Organize missions by category
    const missionsByCategory = missionsData?.missions.reduce((acc, m) => {
        const cat = m.mission.category;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(m);
        return acc;
    }, {} as Record<string, Mission[]>) || {};

    // Stats
    const completedCount = missionsData?.missions.filter(m => m.userProgress?.status === "claimed").length || 0;
    const totalMissions = missionsData?.missions.length || 0;

    if (balanceLoading) {
        return (
            <Layout>
                <div className="container max-w-5xl mx-auto py-8 px-4">
                    <div className="space-y-6">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container max-w-5xl mx-auto py-8 px-4 space-y-8">

                {/* Hero Balance Card */}
                <Card className="overflow-hidden border-none bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white">
                    <CardContent className="p-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Zap className="h-6 w-6" />
                                    <span className="text-amber-100 font-medium">COM Points Balance</span>
                                </div>
                                <div className="text-5xl font-bold tracking-tight">
                                    {balanceData?.balance || 0}
                                    <span className="text-2xl ml-2 opacity-70">pts</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className="flex items-center gap-2 text-amber-100">
                                        <Trophy className="h-4 w-4" />
                                        <span className="text-sm">Progress</span>
                                    </div>
                                    <p className="text-lg font-semibold">{completedCount} / {totalMissions} Missions</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Content */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                        <TabsTrigger
                            value="missions"
                            className="pb-3 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                        >
                            <Star className="h-4 w-4 mr-2" />
                            Missions
                        </TabsTrigger>
                        <TabsTrigger
                            value="shop"
                            className="pb-3 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                        >
                            <ShoppingBag className="h-4 w-4 mr-2" />
                            Rewards Shop
                        </TabsTrigger>
                        <TabsTrigger
                            value="history"
                            className="pb-3 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                        >
                            <History className="h-4 w-4 mr-2" />
                            Activity
                        </TabsTrigger>
                    </TabsList>

                    {/* Missions Tab */}
                    <TabsContent value="missions" className="mt-6 space-y-8">
                        {missionsLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
                            </div>
                        ) : totalMissions > 0 ? (
                            <>
                                {Object.entries(missionsByCategory).map(([category, missions]) => {
                                    const config = categoryConfig[category];
                                    return (
                                        <div key={category}>
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className={`h-8 w-8 rounded-lg ${config.bg} flex items-center justify-center ${config.color}`}>
                                                    {config.icon}
                                                </div>
                                                <h2 className="text-lg font-semibold capitalize">{category.replace("_", " ")}</h2>
                                                <Badge variant="secondary" className="text-xs">{missions.length}</Badge>
                                            </div>

                                            <div className="space-y-3">
                                                {missions.map((m) => {
                                                    const status = m.userProgress?.status || "available";
                                                    const isLoading = loadingMissionId === m.mission.id;
                                                    const progress = m.userProgress;

                                                    return (
                                                        <Card
                                                            key={m.mission.id}
                                                            className={`transition-all ${status === "claimed" ? "opacity-60" : "hover:shadow-md"}`}
                                                        >
                                                            <CardContent className="p-4">
                                                                <div className="flex items-center justify-between gap-4">
                                                                    {/* Left: Mission Info */}
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <h3 className="font-medium truncate">{m.mission.name}</h3>
                                                                            {m.mission.tier && (
                                                                                <Badge variant="outline" className="text-xs shrink-0">
                                                                                    Tier {m.mission.tier}
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        {m.mission.description && (
                                                                            <p className="text-sm text-muted-foreground truncate">{m.mission.description}</p>
                                                                        )}

                                                                        {/* Progress bar for in-progress */}
                                                                        {status === "in_progress" && progress && (
                                                                            <div className="mt-2 flex items-center gap-2">
                                                                                <Progress value={(progress.progress / progress.targetCount) * 100} className="h-1.5 flex-1" />
                                                                                <span className="text-xs text-muted-foreground">{progress.progress}/{progress.targetCount}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Right: Reward & Action */}
                                                                    <div className="flex items-center gap-3 shrink-0">
                                                                        <div className="flex items-center gap-1 text-amber-500 font-semibold">
                                                                            <Zap className="h-4 w-4" />
                                                                            <span>+{m.mission.rewardPoints}</span>
                                                                        </div>

                                                                        {status === "available" && (
                                                                            <Button
                                                                                size="sm"
                                                                                onClick={() => startMission.mutate(m.mission.id)}
                                                                                disabled={isLoading}
                                                                            >
                                                                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start"}
                                                                            </Button>
                                                                        )}

                                                                        {status === "in_progress" && (
                                                                            <Button size="sm" variant="secondary" disabled>
                                                                                In Progress
                                                                            </Button>
                                                                        )}

                                                                        {status === "completed" && (
                                                                            <Button
                                                                                size="sm"
                                                                                className="bg-green-600 hover:bg-green-700"
                                                                                onClick={() => claimReward.mutate(m.mission.id)}
                                                                                disabled={isLoading}
                                                                            >
                                                                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Claim"}
                                                                            </Button>
                                                                        )}

                                                                        {status === "claimed" && (
                                                                            <div className="flex items-center gap-1 text-green-600">
                                                                                <Check className="h-4 w-4" />
                                                                                <span className="text-sm font-medium">Done</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        ) : (
                            <EmptyState
                                icon={<Star className="h-8 w-8" />}
                                title="No missions available"
                                description="Check back soon for new ways to earn points!"
                            />
                        )}
                    </TabsContent>

                    {/* Shop Tab */}
                    <TabsContent value="shop" className="mt-6">
                        {shopLoading ? (
                            <div className="grid gap-4 md:grid-cols-2">
                                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32" />)}
                            </div>
                        ) : shopData?.items && shopData.items.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2">
                                {shopData.items.map((item) => {
                                    const canAfford = (balanceData?.balance || 0) >= item.costPoints;
                                    const isLoading = loadingItemId === item.id;

                                    return (
                                        <Card
                                            key={item.id}
                                            className={`transition-all ${!canAfford && "opacity-50"}`}
                                        >
                                            <CardContent className="p-5">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold">{item.name}</h3>
                                                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                                                        <div className="flex items-center gap-1 mt-3 text-amber-500 font-semibold">
                                                            <Zap className="h-4 w-4" />
                                                            <span>{item.costPoints} pts</span>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        onClick={() => redeemItem.mutate(item.id)}
                                                        disabled={!canAfford || isLoading}
                                                        variant={canAfford ? "default" : "secondary"}
                                                    >
                                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : canAfford ? "Redeem" : "Need more pts"}
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <EmptyState
                                icon={<ShoppingBag className="h-8 w-8" />}
                                title="Shop coming soon"
                                description="Exciting rewards are on the way!"
                            />
                        )}
                    </TabsContent>

                    {/* History Tab */}
                    <TabsContent value="history" className="mt-6">
                        {historyData?.history && historyData.history.length > 0 ? (
                            <Card>
                                <CardContent className="p-0 divide-y">
                                    {historyData.history.map((tx) => (
                                        <div key={tx.id} className="flex items-center justify-between p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${tx.amount > 0 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                                                    }`}>
                                                    <Zap className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm capitalize">{tx.sourceType}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(tx.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`font-semibold ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                                                {tx.amount > 0 ? "+" : ""}{tx.amount} pts
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        ) : (
                            <EmptyState
                                icon={<History className="h-8 w-8" />}
                                title="No activity yet"
                                description="Complete missions to see your history"
                            />
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </Layout>
    );
}

// Simple empty state
function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
                {icon}
            </div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    );
}
