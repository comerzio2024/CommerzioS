/**
 * BookingFlowWizard Component
 * 
 * Intelligent booking flow that:
 * - Determines tier (INSTANT / REQUEST / INQUIRY) based on service config
 * - Uses new booking flow API (/api/booking-flow/*)
 * - Shows deposit vs full payment options
 * - Integrates with calendar availability
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookingCalendar } from './BookingCalendar';
import { PricingSelector } from '../pricing/PricingSelector';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { fetchApi } from '@/lib/config';
import {
    Loader2,
    Phone,
    MapPin,
    MessageSquare,
    Calendar,
    Check,
    Zap,
    Clock,
    HelpCircle,
    CreditCard,
    Shield,
    ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PricingOption {
    id: string;
    serviceId: string;
    label: string;
    description: string | null;
    price: string;
    currency: string;
    billingInterval: string;
    pricingMode: 'fixed' | 'hourly' | 'inquire';
    durationMinutes: number | null;
    sortOrder: number;
    isActive: boolean;
}

interface BookingFlowInfo {
    tier: 'INSTANT' | 'REQUEST' | 'INQUIRY';
    requiresDeposit: boolean;
    depositPercent: number;
    depositAmount: number;
    totalAmount: number;
    canInstantBook: boolean;
    hasCalendarSlots: boolean;
    paymentBadge: string;
    message: string;
}

interface BookingFlowWizardProps {
    serviceId: string;
    serviceName: string;
    vendorId: string;
    vendorName?: string;
    onSuccess?: (booking: unknown) => void;
    onCancel?: () => void;
    className?: string;
}

export function BookingFlowWizard({
    serviceId,
    serviceName,
    vendorId,
    vendorName,
    onSuccess,
    onCancel,
    className,
}: BookingFlowWizardProps) {
    const queryClient = useQueryClient();
    const [step, setStep] = useState(1);
    const [selectedOption, setSelectedOption] = useState<PricingOption | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
    const [formData, setFormData] = useState({
        customerMessage: '',
        customerPhone: '',
        customerAddress: '',
    });

    // Determine booking tier based on selected pricing option
    const { data: flowInfo, isLoading: flowLoading } = useQuery<BookingFlowInfo>({
        queryKey: ['/api/booking-flow/determine', serviceId, selectedOption?.id],
        queryFn: async () => {
            // Build query params
            const params = new URLSearchParams({
                serviceId,
            });
            if (selectedOption?.id) {
                params.append('pricingOptionId', selectedOption.id);
            }
            if (selectedSlot) {
                params.append('startTime', selectedSlot.start.toISOString());
                params.append('endTime', selectedSlot.end.toISOString());
            }

            const res = await fetchApi(`/api/booking-flow/determine?${params}`);
            if (!res.ok) throw new Error('Failed to determine booking flow');
            return res.json();
        },
        enabled: !!serviceId,
    });

    // Submit booking based on tier
    const submitBooking = useMutation({
        mutationFn: async () => {
            if (!selectedSlot && flowInfo?.tier !== 'INQUIRY') {
                throw new Error('Please select a time slot');
            }

            const endpoint = flowInfo?.tier === 'INQUIRY'
                ? '/api/booking-flow/inquiries'
                : '/api/booking-flow/create';

            const res = await fetchApi(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serviceId,
                    pricingOptionId: selectedOption?.id,
                    requestedStartTime: selectedSlot?.start.toISOString(),
                    requestedEndTime: selectedSlot?.end.toISOString(),
                    customerMessage: formData.customerMessage,
                    customerPhone: formData.customerPhone,
                    customerAddress: formData.customerAddress,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to submit booking');
            }

            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });

            const message = flowInfo?.tier === 'INSTANT'
                ? 'Booking confirmed instantly!'
                : flowInfo?.tier === 'INQUIRY'
                    ? 'Inquiry sent! The vendor will send you a quote.'
                    : 'Booking request sent! Waiting for vendor confirmation.';

            toast.success(message);
            onSuccess?.(data);
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    // Calculate step count based on tier
    const totalSteps = flowInfo?.tier === 'INQUIRY' ? 2 : 3;

    const handleNext = () => {
        if (step === 1 && !selectedOption) {
            toast.error('Please select a pricing option');
            return;
        }
        if (step === 2 && !selectedSlot && flowInfo?.tier !== 'INQUIRY') {
            toast.error('Please select a date and time');
            return;
        }
        if (step < totalSteps) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleSubmit = () => {
        submitBooking.mutate();
    };

    const formatPrice = (price: string | number, currency: string = 'CHF') => {
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        return new Intl.NumberFormat('de-CH', {
            style: 'currency',
            currency: currency,
        }).format(numPrice);
    };

    // Tier badge config
    const tierConfig = {
        INSTANT: {
            icon: <Zap className="w-4 h-4" />,
            color: 'bg-green-500',
            label: 'Instant Booking',
            description: 'Book immediately with instant confirmation'
        },
        REQUEST: {
            icon: <Clock className="w-4 h-4" />,
            color: 'bg-blue-500',
            label: 'Request Booking',
            description: 'Vendor will review and confirm your request'
        },
        INQUIRY: {
            icon: <HelpCircle className="w-4 h-4" />,
            color: 'bg-amber-500',
            label: 'Send Inquiry',
            description: 'Get a custom quote from the vendor'
        },
    };

    const currentTier = flowInfo?.tier || 'REQUEST';
    const tierInfo = tierConfig[currentTier];

    if (flowLoading) {
        return (
            <Card className={cn("w-full max-w-2xl mx-auto", className)}>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("w-full max-w-2xl mx-auto", className)}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl">Book {serviceName}</CardTitle>
                        {vendorName && (
                            <CardDescription>with {vendorName}</CardDescription>
                        )}
                    </div>

                    {/* Tier Badge */}
                    <Badge className={cn("flex items-center gap-1", tierInfo.color, "text-white")}>
                        {tierInfo.icon}
                        {tierInfo.label}
                    </Badge>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center gap-2 mt-4 text-sm">
                    {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s, idx) => (
                        <div key={s} className="flex items-center">
                            <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            )}>
                                {step > s ? <Check className="w-3 h-3" /> : s}
                            </div>
                            {idx < totalSteps - 1 && (
                                <ArrowRight className="w-4 h-4 mx-2 text-muted-foreground" />
                            )}
                        </div>
                    ))}
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Step 1: Select Pricing Option */}
                {step === 1 && (
                    <div className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                            {tierInfo.description}
                        </div>

                        <PricingSelector
                            serviceId={serviceId}
                            selectedOptionId={selectedOption?.id || null}
                            onSelect={(option) => setSelectedOption(option as PricingOption)}
                        />

                        {/* Deposit Info */}
                        {flowInfo?.requiresDeposit && selectedOption && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium">
                                    <Shield className="w-4 h-4" />
                                    {flowInfo.paymentBadge}
                                </div>
                                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                                    Pay {formatPrice(flowInfo.depositAmount)} now, {formatPrice(flowInfo.totalAmount - flowInfo.depositAmount)} later
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Select Date/Time (skip for INQUIRY) */}
                {step === 2 && currentTier !== 'INQUIRY' && (
                    <div className="space-y-4">
                        <h3 className="font-medium flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Select Date & Time
                        </h3>

                        <BookingCalendar
                            serviceId={serviceId}
                            durationMinutes={selectedOption?.durationMinutes || 60}
                            pricingOptionId={selectedOption?.id}
                            selectedSlot={selectedSlot}
                            onSelectSlot={setSelectedSlot}
                        />
                    </div>
                )}

                {/* Step 2 for INQUIRY: Message */}
                {step === 2 && currentTier === 'INQUIRY' && (
                    <div className="space-y-6">
                        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                Describe your needs and the vendor will send you a custom quote.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="message" className="flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Describe Your Requirements *
                                </Label>
                                <Textarea
                                    id="message"
                                    placeholder="What do you need? Any specific requirements, timeline, or questions?"
                                    rows={6}
                                    value={formData.customerMessage}
                                    onChange={(e) => setFormData({ ...formData, customerMessage: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone" className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    Phone Number
                                </Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="+41 XX XXX XX XX"
                                    value={formData.customerPhone}
                                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Final Details (for INSTANT/REQUEST) */}
                {step === 3 && (
                    <div className="space-y-6">
                        {/* Summary */}
                        <div className="p-4 bg-muted rounded-lg space-y-3">
                            <h4 className="font-medium flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Booking Summary
                            </h4>

                            {selectedSlot && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">When</span>
                                    <span className="font-medium">
                                        {format(selectedSlot.start, 'EEE, MMM d')} at {format(selectedSlot.start, 'HH:mm')}
                                    </span>
                                </div>
                            )}

                            {selectedOption && (
                                <>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Package</span>
                                        <span className="font-medium">{selectedOption.label}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm border-t pt-2">
                                        <span className="text-muted-foreground">Total</span>
                                        <span className="font-bold text-lg">
                                            {formatPrice(selectedOption.price, selectedOption.currency)}
                                        </span>
                                    </div>
                                </>
                            )}

                            {flowInfo?.requiresDeposit && (
                                <div className="flex items-center justify-between text-sm text-green-600 dark:text-green-400">
                                    <span>Pay now (deposit)</span>
                                    <span className="font-medium">{formatPrice(flowInfo.depositAmount)}</span>
                                </div>
                            )}
                        </div>

                        {/* Contact Form */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone-final" className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    Phone Number
                                </Label>
                                <Input
                                    id="phone-final"
                                    type="tel"
                                    placeholder="+41 XX XXX XX XX"
                                    value={formData.customerPhone}
                                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address" className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    Service Location (if applicable)
                                </Label>
                                <Input
                                    id="address"
                                    placeholder="Where should the service be provided?"
                                    value={formData.customerAddress}
                                    onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message-final" className="flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Additional Notes
                                </Label>
                                <Textarea
                                    id="message-final"
                                    placeholder="Any special requests?"
                                    rows={3}
                                    value={formData.customerMessage}
                                    onChange={(e) => setFormData({ ...formData, customerMessage: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex justify-between border-t pt-6">
                {step > 1 ? (
                    <Button variant="outline" onClick={handleBack}>
                        Back
                    </Button>
                ) : (
                    <Button variant="ghost" onClick={onCancel}>
                        Cancel
                    </Button>
                )}

                {step < totalSteps ? (
                    <Button onClick={handleNext}>
                        Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                ) : (
                    <Button
                        onClick={handleSubmit}
                        disabled={submitBooking.isPending}
                        className={cn(
                            currentTier === 'INSTANT' && "bg-green-600 hover:bg-green-700"
                        )}
                    >
                        {submitBooking.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : currentTier === 'INSTANT' ? (
                            <>
                                <Zap className="w-4 h-4 mr-2" />
                                Book Now
                            </>
                        ) : currentTier === 'INQUIRY' ? (
                            <>
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Send Inquiry
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4 mr-2" />
                                Request Booking
                            </>
                        )}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}

export default BookingFlowWizard;
