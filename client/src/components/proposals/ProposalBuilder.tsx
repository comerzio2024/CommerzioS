/**
 * ProposalBuilder Component
 * 
 * Vendor UI for creating custom proposals for Tier 2/3 booking requests.
 * - Service selection
 * - Custom pricing
 * - Schedule setting with time blocks
 * - Commission payer model
 * - Cover letter
 * 
 * Used when a customer sends an inquiry or complex multi-service request.
 */

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Clock,
    CalendarIcon,
    Plus,
    Trash2,
    DollarSign,
    Send,
    ChevronRight,
    Loader2,
    AlertTriangle,
    CreditCard,
    Banknote,
    BadgePercent,
} from "lucide-react";
import { format, addHours, setHours, setMinutes } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ============================================
// TYPES
// ============================================

type PaymentMethod = "card" | "twint" | "cash";
type PaymentTiming = "upfront" | "on_completion";
type CommissionPayer = "vendor" | "split" | "user";

interface TimeBlock {
    id: string;
    date: Date;
    startTime: string;
    endTime: string;
    description?: string;
}

interface ProposalFormData {
    serviceId?: string;
    price: number;
    priceBreakdown?: {
        labor: number;
        materials: number;
        travel: number;
        other?: number;
    };
    paymentMethod: PaymentMethod;
    paymentTiming: PaymentTiming;
    commissionPayer: CommissionPayer;
    coverLetter: string;
    estimatedDuration: string;
    timeBlocks: TimeBlock[];
    expiryHours: 24 | 48 | 72;
}

interface ServiceRequest {
    id: string;
    customerId: string;
    customerName: string;
    description: string;
    preferredDate?: Date;
    preferredTime?: string;
    services?: {
        id: string;
        title: string;
        suggestedPrice: number;
        duration: number;
    }[];
}

interface ProposalBuilderProps {
    serviceRequest: ServiceRequest;
    vendorServices?: {
        id: string;
        title: string;
        basePrice: number;
        baseDurationMinutes: number;
    }[];
    commissionRate?: number;
    onSubmit?: (proposal: ProposalFormData) => void;
    onCancel?: () => void;
    className?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateTimeOptions(): string[] {
    const options: string[] = [];
    for (let h = 7; h <= 21; h++) {
        for (let m = 0; m < 60; m += 30) {
            options.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        }
    }
    return options;
}

function calculateCommission(
    basePrice: number,
    commissionRate: number,
    payer: CommissionPayer
): { customerPays: number; vendorReceives: number; platformReceives: number } {
    const commission = basePrice * (commissionRate / 100);

    switch (payer) {
        case "vendor":
            return {
                customerPays: basePrice,
                vendorReceives: basePrice - commission,
                platformReceives: commission,
            };
        case "split":
            const halfCommission = commission / 2;
            return {
                customerPays: basePrice + halfCommission,
                vendorReceives: basePrice - halfCommission,
                platformReceives: commission,
            };
        case "user":
            return {
                customerPays: basePrice + commission,
                vendorReceives: basePrice,
                platformReceives: commission,
            };
    }
}

// ============================================
// COMPONENT
// ============================================

export function ProposalBuilder({
    serviceRequest,
    vendorServices = [],
    commissionRate = 12,
    onSubmit,
    onCancel,
    className,
}: ProposalBuilderProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const timeOptions = useMemo(() => generateTimeOptions(), []);

    // Form state
    const [formData, setFormData] = useState<ProposalFormData>({
        serviceId: vendorServices[0]?.id,
        price: serviceRequest.services?.[0]?.suggestedPrice || 100,
        paymentMethod: "card",
        paymentTiming: "upfront",
        commissionPayer: "split",
        coverLetter: "",
        estimatedDuration: "2 hours",
        timeBlocks: [{
            id: crypto.randomUUID(),
            date: serviceRequest.preferredDate || new Date(),
            startTime: serviceRequest.preferredTime || "09:00",
            endTime: "11:00",
        }],
        expiryHours: 48,
    });

    // Commission calculation
    const commissionCalc = useMemo(
        () => calculateCommission(formData.price, commissionRate, formData.commissionPayer),
        [formData.price, formData.commissionPayer, commissionRate]
    );

    // Submit mutation
    const submitMutation = useMutation({
        mutationFn: async (data: ProposalFormData) => {
            const response = await apiRequest("POST", "/api/proposals", {
                serviceRequestId: serviceRequest.id,
                ...data,
                proposedDate: data.timeBlocks[0]?.date.toISOString(),
                proposedDateEnd: data.timeBlocks.length > 1
                    ? data.timeBlocks[data.timeBlocks.length - 1].date.toISOString()
                    : undefined,
            });
            return response.json();
        },
        onSuccess: () => {
            toast({
                title: "Proposal Sent!",
                description: "Your proposal has been sent to the customer.",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
            onSubmit?.(formData);
        },
        onError: (error: any) => {
            toast({
                title: "Failed to send proposal",
                description: error.message || "Please try again.",
                variant: "destructive",
            });
        },
    });

    // Handlers
    const addTimeBlock = () => {
        setFormData(prev => ({
            ...prev,
            timeBlocks: [
                ...prev.timeBlocks,
                {
                    id: crypto.randomUUID(),
                    date: prev.timeBlocks[prev.timeBlocks.length - 1]?.date || new Date(),
                    startTime: "09:00",
                    endTime: "11:00",
                },
            ],
        }));
    };

    const removeTimeBlock = (id: string) => {
        if (formData.timeBlocks.length <= 1) return;
        setFormData(prev => ({
            ...prev,
            timeBlocks: prev.timeBlocks.filter(b => b.id !== id),
        }));
    };

    const updateTimeBlock = (id: string, updates: Partial<TimeBlock>) => {
        setFormData(prev => ({
            ...prev,
            timeBlocks: prev.timeBlocks.map(b =>
                b.id === id ? { ...b, ...updates } : b
            ),
        }));
    };

    const handleSubmit = () => {
        if (!formData.coverLetter.trim()) {
            toast({
                title: "Cover letter required",
                description: "Please write a message to the customer.",
                variant: "destructive",
            });
            return;
        }
        submitMutation.mutate(formData);
    };

    // ============================================
    // RENDER
    // ============================================

    return (
        <Card className={cn("w-full max-w-2xl", className)}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Create Proposal
                </CardTitle>
                <CardDescription>
                    Respond to {serviceRequest.customerName}'s request with a custom quote
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Customer Request Summary */}
                <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="text-sm font-medium mb-2">Customer Request:</div>
                    <p className="text-sm text-muted-foreground">{serviceRequest.description}</p>
                    {serviceRequest.preferredDate && (
                        <Badge variant="outline" className="mt-2">
                            Preferred: {format(serviceRequest.preferredDate, "PPP")}
                            {serviceRequest.preferredTime && ` at ${serviceRequest.preferredTime}`}
                        </Badge>
                    )}
                </div>

                <Separator />

                {/* Service Selection (if multiple) */}
                {vendorServices.length > 1 && (
                    <div className="space-y-2">
                        <Label>Service</Label>
                        <Select
                            value={formData.serviceId}
                            onValueChange={(v) => setFormData(prev => ({ ...prev, serviceId: v }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select service" />
                            </SelectTrigger>
                            <SelectContent>
                                {vendorServices.map(s => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.title} (CHF {s.basePrice})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Pricing */}
                <div className="space-y-4">
                    <Label className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Price (CHF)
                    </Label>
                    <Input
                        type="number"
                        min={0}
                        step={5}
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    />

                    {/* Commission Payer Model */}
                    <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                        <Label className="flex items-center gap-2">
                            <BadgePercent className="h-4 w-4" />
                            Who pays the {commissionRate}% platform fee?
                        </Label>
                        <RadioGroup
                            value={formData.commissionPayer}
                            onValueChange={(v) => setFormData(prev => ({ ...prev, commissionPayer: v as CommissionPayer }))}
                            className="grid grid-cols-3 gap-2"
                        >
                            <Label
                                htmlFor="comm-vendor"
                                className={cn(
                                    "flex flex-col items-center p-3 rounded-lg border cursor-pointer transition-colors",
                                    formData.commissionPayer === "vendor" && "border-primary bg-primary/5"
                                )}
                            >
                                <RadioGroupItem value="vendor" id="comm-vendor" className="sr-only" />
                                <span className="text-sm font-medium">I Pay</span>
                                <span className="text-xs text-muted-foreground">-CHF {(formData.price * commissionRate / 100).toFixed(2)}</span>
                            </Label>
                            <Label
                                htmlFor="comm-split"
                                className={cn(
                                    "flex flex-col items-center p-3 rounded-lg border cursor-pointer transition-colors",
                                    formData.commissionPayer === "split" && "border-primary bg-primary/5"
                                )}
                            >
                                <RadioGroupItem value="split" id="comm-split" className="sr-only" />
                                <span className="text-sm font-medium">50/50</span>
                                <span className="text-xs text-muted-foreground">Split fair</span>
                            </Label>
                            <Label
                                htmlFor="comm-user"
                                className={cn(
                                    "flex flex-col items-center p-3 rounded-lg border cursor-pointer transition-colors",
                                    formData.commissionPayer === "user" && "border-primary bg-primary/5"
                                )}
                            >
                                <RadioGroupItem value="user" id="comm-user" className="sr-only" />
                                <span className="text-sm font-medium">Customer</span>
                                <span className="text-xs text-muted-foreground">+CHF {(formData.price * commissionRate / 100).toFixed(2)}</span>
                            </Label>
                        </RadioGroup>

                        {/* Preview */}
                        <div className="grid grid-cols-2 gap-4 text-sm pt-2">
                            <div>
                                <div className="text-muted-foreground">Customer pays</div>
                                <div className="text-lg font-bold">CHF {commissionCalc.customerPays.toFixed(2)}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">You receive</div>
                                <div className="text-lg font-bold text-green-600">CHF {commissionCalc.vendorReceives.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Schedule */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Schedule
                        </Label>
                        <Button variant="outline" size="sm" onClick={addTimeBlock}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Block
                        </Button>
                    </div>

                    {formData.timeBlocks.map((block, index) => (
                        <div key={block.id} className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 rounded-lg">
                            <span className="text-sm font-medium min-w-[60px]">
                                {index === 0 ? "Session:" : `Block ${index + 1}:`}
                            </span>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="min-w-[130px]">
                                        <CalendarIcon className="h-4 w-4 mr-2" />
                                        {format(block.date, "MMM d")}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={block.date}
                                        onSelect={(d) => d && updateTimeBlock(block.id, { date: d })}
                                        disabled={(date) => date < new Date()}
                                    />
                                </PopoverContent>
                            </Popover>

                            <Select
                                value={block.startTime}
                                onValueChange={(v) => updateTimeBlock(block.id, { startTime: v })}
                            >
                                <SelectTrigger className="w-[100px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {timeOptions.map(t => (
                                        <SelectItem key={`start-${t}`} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <ChevronRight className="h-4 w-4 text-muted-foreground" />

                            <Select
                                value={block.endTime}
                                onValueChange={(v) => updateTimeBlock(block.id, { endTime: v })}
                            >
                                <SelectTrigger className="w-[100px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {timeOptions.map(t => (
                                        <SelectItem key={`end-${t}`} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {formData.timeBlocks.length > 1 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeTimeBlock(block.id)}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>

                <Separator />

                {/* Payment Method */}
                <div className="space-y-3">
                    <Label>Payment Method</Label>
                    <RadioGroup
                        value={formData.paymentMethod}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, paymentMethod: v as PaymentMethod }))}
                        className="flex gap-4"
                    >
                        <Label htmlFor="pm-card" className="flex items-center gap-2 cursor-pointer">
                            <RadioGroupItem value="card" id="pm-card" />
                            <CreditCard className="h-4 w-4" />
                            Card
                        </Label>
                        <Label htmlFor="pm-twint" className="flex items-center gap-2 cursor-pointer">
                            <RadioGroupItem value="twint" id="pm-twint" />
                            <Banknote className="h-4 w-4" />
                            TWINT
                        </Label>
                        <Label htmlFor="pm-cash" className="flex items-center gap-2 cursor-pointer">
                            <RadioGroupItem value="cash" id="pm-cash" />
                            <Banknote className="h-4 w-4" />
                            Cash
                        </Label>
                    </RadioGroup>

                    {formData.paymentMethod !== "card" && (
                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <span className="text-xs text-amber-800">
                                Non-card payments are not protected by escrow. Consider card payment for buyer protection.
                            </span>
                        </div>
                    )}
                </div>

                <Separator />

                {/* Cover Letter */}
                <div className="space-y-2">
                    <Label>Message to Customer</Label>
                    <Textarea
                        placeholder="Introduce yourself and explain your proposal..."
                        rows={4}
                        value={formData.coverLetter}
                        onChange={(e) => setFormData(prev => ({ ...prev, coverLetter: e.target.value }))}
                    />
                </div>

                {/* Expiry */}
                <div className="space-y-2">
                    <Label>Proposal Valid For</Label>
                    <Select
                        value={formData.expiryHours.toString()}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, expiryHours: parseInt(v) as 24 | 48 | 72 }))}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="24">24 hours</SelectItem>
                            <SelectItem value="48">48 hours</SelectItem>
                            <SelectItem value="72">72 hours</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>

            <CardFooter className="flex gap-3">
                {onCancel && (
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button
                    className="flex-1"
                    onClick={handleSubmit}
                    disabled={submitMutation.isPending}
                >
                    {submitMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4 mr-2" />
                    )}
                    Send Proposal
                </Button>
            </CardFooter>
        </Card>
    );
}

export default ProposalBuilder;
