/**
 * Settings Page
 * 
 * User preferences and settings management:
 * - Notification preferences (channels, quiet hours, types)
 * - Account settings
 * - Privacy settings
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    Bell,
    Mail,
    Smartphone,
    Moon,
    MessageSquare,
    CreditCard,
    Star,
    Calendar,
    AlertTriangle,
    Gift,
    Loader2,
    Save,
    Shield,
    User,
    Volume2,
    VolumeX,
} from "lucide-react";

// Notification type data
const NOTIFICATION_TYPES = [
    { id: "message", label: "Messages", icon: MessageSquare, description: "New messages from vendors/customers" },
    { id: "booking", label: "Bookings", icon: Calendar, description: "Booking confirmations and updates" },
    { id: "payment", label: "Payments", icon: CreditCard, description: "Payment receipts and refunds" },
    { id: "review", label: "Reviews", icon: Star, description: "New reviews and responses" },
    { id: "promotion", label: "Promotions", icon: Gift, description: "Deals, offers, and announcements" },
    { id: "system", label: "System", icon: AlertTriangle, description: "Security alerts and updates" },
    { id: "referral", label: "Referrals", icon: User, description: "Referral rewards and signups" },
];

interface NotificationPreferences {
    id: string;
    userId: string;
    emailEnabled: boolean;
    pushEnabled: boolean;
    smsEnabled: boolean;
    quietHoursEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
    enabledTypes: string[];
    createdAt: string;
    updatedAt: string;
}

export default function SettingsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState("notifications");
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    const [localPreferences, setLocalPreferences] = useState<Partial<NotificationPreferences>>({});

    // Fetch notification preferences
    const { data: preferences, isLoading } = useQuery({
        queryKey: ["/api/notifications/preferences"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/notifications/preferences");
            return res.json();
        },
        enabled: !!user,
    });

    // Update preferences when fetched
    useEffect(() => {
        if (preferences) {
            setLocalPreferences(preferences);
        }
    }, [preferences]);

    // Update preferences mutation
    const updatePrefs = useMutation({
        mutationFn: async (updates: Partial<NotificationPreferences>) => {
            const res = await apiRequest("PATCH", "/api/notifications/preferences", updates);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/notifications/preferences"] });
            setUnsavedChanges(false);
            toast({
                title: "Settings saved",
                description: "Your notification preferences have been updated.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to save preferences",
                variant: "destructive",
            });
        },
    });

    // Handle toggle change
    const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
        setLocalPreferences(prev => ({ ...prev, [key]: value }));
        setUnsavedChanges(true);
    };

    // Handle notification type toggle
    const handleTypeToggle = (typeId: string, enabled: boolean) => {
        setLocalPreferences(prev => {
            const currentTypes = prev.enabledTypes || [];
            const newTypes = enabled
                ? [...currentTypes, typeId]
                : currentTypes.filter((t: string) => t !== typeId);
            return { ...prev, enabledTypes: newTypes };
        });
        setUnsavedChanges(true);
    };

    // Handle time change
    const handleTimeChange = (key: "quietHoursStart" | "quietHoursEnd", value: string) => {
        setLocalPreferences(prev => ({ ...prev, [key]: value }));
        setUnsavedChanges(true);
    };

    // Save changes
    const handleSave = () => {
        updatePrefs.mutate(localPreferences);
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your account preferences and notifications
                    </p>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                        <TabsTrigger value="notifications" className="gap-2">
                            <Bell className="h-4 w-4" />
                            Notifications
                        </TabsTrigger>
                        <TabsTrigger value="privacy" className="gap-2">
                            <Shield className="h-4 w-4" />
                            Privacy
                        </TabsTrigger>
                        <TabsTrigger value="account" className="gap-2">
                            <User className="h-4 w-4" />
                            Account
                        </TabsTrigger>
                    </TabsList>

                    {/* Notifications Tab */}
                    <TabsContent value="notifications" className="space-y-6">
                        {/* Channels Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Volume2 className="h-5 w-5 text-primary" />
                                    Notification Channels
                                </CardTitle>
                                <CardDescription>
                                    Choose how you want to receive notifications
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Email */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-blue-500/10">
                                            <Mail className="h-5 w-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <Label className="text-base font-medium">Email notifications</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Receive notifications via email
                                            </p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={localPreferences.emailEnabled ?? true}
                                        onCheckedChange={(checked) => handleToggle("emailEnabled", checked)}
                                    />
                                </div>

                                <Separator />

                                {/* Push */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-green-500/10">
                                            <Smartphone className="h-5 w-5 text-green-500" />
                                        </div>
                                        <div>
                                            <Label className="text-base font-medium">Push notifications</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Browser and mobile push notifications
                                            </p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={localPreferences.pushEnabled ?? true}
                                        onCheckedChange={(checked) => handleToggle("pushEnabled", checked)}
                                    />
                                </div>

                                <Separator />

                                {/* SMS */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-purple-500/10">
                                            <MessageSquare className="h-5 w-5 text-purple-500" />
                                        </div>
                                        <div>
                                            <Label className="text-base font-medium">SMS notifications</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Text messages for important updates
                                                <Badge variant="secondary" className="ml-2">Uses credits</Badge>
                                            </p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={localPreferences.smsEnabled ?? false}
                                        onCheckedChange={(checked) => handleToggle("smsEnabled", checked)}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quiet Hours Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Moon className="h-5 w-5 text-primary" />
                                    Quiet Hours
                                </CardTitle>
                                <CardDescription>
                                    Pause notifications during specific hours
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-indigo-500/10">
                                            <VolumeX className="h-5 w-5 text-indigo-500" />
                                        </div>
                                        <div>
                                            <Label className="text-base font-medium">Enable quiet hours</Label>
                                            <p className="text-sm text-muted-foreground">
                                                No notifications during selected time
                                            </p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={localPreferences.quietHoursEnabled ?? false}
                                        onCheckedChange={(checked) => handleToggle("quietHoursEnabled", checked)}
                                    />
                                </div>

                                {localPreferences.quietHoursEnabled && (
                                    <div className="grid grid-cols-2 gap-4 pt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="start-time">Start time</Label>
                                            <Input
                                                id="start-time"
                                                type="time"
                                                value={localPreferences.quietHoursStart ?? "22:00"}
                                                onChange={(e) => handleTimeChange("quietHoursStart", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="end-time">End time</Label>
                                            <Input
                                                id="end-time"
                                                type="time"
                                                value={localPreferences.quietHoursEnd ?? "08:00"}
                                                onChange={(e) => handleTimeChange("quietHoursEnd", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Notification Types Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="h-5 w-5 text-primary" />
                                    Notification Types
                                </CardTitle>
                                <CardDescription>
                                    Choose which types of notifications you want to receive
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {NOTIFICATION_TYPES.map((type) => {
                                    const Icon = type.icon;
                                    const isEnabled = (localPreferences.enabledTypes || []).includes(type.id);

                                    return (
                                        <div key={type.id} className="flex items-center justify-between py-2">
                                            <div className="flex items-center gap-3">
                                                <Icon className="h-5 w-5 text-muted-foreground" />
                                                <div>
                                                    <Label className="text-base font-medium">{type.label}</Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        {type.description}
                                                    </p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={isEnabled}
                                                onCheckedChange={(checked) => handleTypeToggle(type.id, checked)}
                                            />
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Privacy Tab */}
                    <TabsContent value="privacy" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-primary" />
                                    Privacy Settings
                                </CardTitle>
                                <CardDescription>
                                    Control your privacy and data sharing preferences
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-base font-medium">Profile visibility</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Allow others to see your profile
                                        </p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-base font-medium">Show activity status</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Let others see when you're online
                                        </p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-base font-medium">Marketing communications</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Receive promotional emails and offers
                                        </p>
                                    </div>
                                    <Switch />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Account Tab */}
                    <TabsContent value="account" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-primary" />
                                    Account Information
                                </CardTitle>
                                <CardDescription>
                                    Manage your account details
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label>Email address</Label>
                                        <Input value={user?.email || ""} disabled />
                                        <p className="text-xs text-muted-foreground">
                                            Contact support to change your email
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Account type</Label>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="capitalize">
                                                {(user as any)?.role || "user"}
                                            </Badge>
                                            {(user as any)?.isVerified && (
                                                <Badge variant="secondary">Verified</Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-destructive/50">
                            <CardHeader>
                                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                                <CardDescription>
                                    Irreversible actions for your account
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button variant="outline" className="text-destructive">
                                    Deactivate Account
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Save Button (fixed at bottom) */}
                {unsavedChanges && (
                    <div className="fixed bottom-6 right-6 z-50">
                        <Button
                            size="lg"
                            onClick={handleSave}
                            disabled={updatePrefs.isPending}
                            className="shadow-lg gap-2"
                        >
                            {updatePrefs.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Save Changes
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
