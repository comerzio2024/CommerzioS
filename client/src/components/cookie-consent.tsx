import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Cookie, ChevronDown, ChevronUp, Shield, BarChart3, Target, Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCookiePreferences, type CookiePreferences } from "@/hooks/useCookiePreferences";

const COOKIE_CATEGORIES = [
    {
        key: "essential" as const,
        label: "Essential Cookies",
        description: "Required for the website to function. These cannot be disabled.",
        icon: Shield,
        required: true,
    },
    {
        key: "functional" as const,
        label: "Functional Cookies",
        description: "Remember your preferences like theme, language, and display settings.",
        icon: Settings2,
        required: false,
    },
    {
        key: "analytics" as const,
        label: "Analytics Cookies",
        description: "Help us understand how you use our site to improve your experience.",
        icon: BarChart3,
        required: false,
    },
    {
        key: "marketing" as const,
        label: "Marketing & Personalization",
        description: "Used to show you personalized content and recommendations.",
        icon: Target,
        required: false,
    },
];

export function CookieConsent() {
    const { preferences, hasConsented, savePreferences, acceptAll, declineAll } = useCookiePreferences();
    const [isVisible, setIsVisible] = useState(false);
    const [showCustomize, setShowCustomize] = useState(false);
    const [localPrefs, setLocalPrefs] = useState<CookiePreferences>(preferences);

    useEffect(() => {
        if (!hasConsented) {
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, [hasConsented]);

    useEffect(() => {
        setLocalPrefs(preferences);
    }, [preferences]);

    const handleAcceptAll = () => {
        acceptAll();
        setIsVisible(false);
    };

    const handleDeclineAll = () => {
        declineAll();
        setIsVisible(false);
    };

    const handleSavePreferences = () => {
        savePreferences(localPrefs);
        setIsVisible(false);
    };

    const toggleCategory = (key: keyof CookiePreferences) => {
        if (key === "essential") return; // Can't toggle essential
        setLocalPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-lg z-50"
                >
                    <Card className="p-5 shadow-2xl border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
                        {/* Header */}
                        <div className="flex items-start gap-3 mb-4">
                            <div className="bg-primary/10 p-2.5 rounded-full">
                                <Cookie className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-base">Cookie Preferences</h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                    We use cookies to enhance your browsing experience and provide personalized content.
                                    You can customize your preferences below.
                                </p>
                            </div>
                        </div>

                        {/* Customize Toggle */}
                        <button
                            onClick={() => setShowCustomize(!showCustomize)}
                            className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors mb-4 text-sm font-medium"
                        >
                            <span className="flex items-center gap-2">
                                <Settings2 className="h-4 w-4" />
                                Customize Preferences
                            </span>
                            {showCustomize ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>

                        {/* Expandable Preferences Panel */}
                        <AnimatePresence>
                            {showCustomize && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
                                        {COOKIE_CATEGORIES.map((category) => {
                                            const Icon = category.icon;
                                            return (
                                                <div
                                                    key={category.key}
                                                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
                                                >
                                                    <div className="bg-background p-1.5 rounded-md mt-0.5">
                                                        <Icon className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <Label htmlFor={category.key} className="font-medium text-sm cursor-pointer">
                                                                {category.label}
                                                            </Label>
                                                            <Switch
                                                                id={category.key}
                                                                checked={localPrefs[category.key]}
                                                                onCheckedChange={() => toggleCategory(category.key)}
                                                                disabled={category.required}
                                                                className="data-[state=checked]:bg-primary"
                                                            />
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                                            {category.description}
                                                            {category.required && (
                                                                <span className="text-primary font-medium ml-1">(Required)</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            {showCustomize ? (
                                <>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleDeclineAll}
                                        className="flex-1"
                                    >
                                        Decline All
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleSavePreferences}
                                        className="flex-1"
                                    >
                                        Save Preferences
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleDeclineAll}
                                        className="flex-1"
                                    >
                                        Decline All
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleAcceptAll}
                                        className="flex-1"
                                    >
                                        Accept All
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Privacy Policy Link */}
                        <p className="text-[10px] text-muted-foreground text-center mt-3">
                            By using our site, you agree to our{" "}
                            <a href="/privacy" className="underline hover:text-primary">Privacy Policy</a> and{" "}
                            <a href="/terms" className="underline hover:text-primary">Terms of Service</a>.
                        </p>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
