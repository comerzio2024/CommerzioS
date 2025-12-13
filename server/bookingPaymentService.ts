/**
 * Booking Payment Service Stub
 * 
 * Placeholder for payment processing during booking flow.
 * To be implemented when payment integration is needed.
 */

export interface PaymentResult {
    success: boolean;
    transactionId?: string;
    error?: string;
}

export async function processBookingPayment(
    bookingId: string,
    amount: number,
    customerId: string,
    vendorId: string
): Promise<PaymentResult> {
    console.log('[bookingPaymentService] Stub called - no payment processing');
    return {
        success: true,
        transactionId: `stub_${Date.now()}`,
    };
}

export async function refundBookingPayment(
    bookingId: string,
    amount: number,
    reason?: string
): Promise<PaymentResult> {
    console.log('[bookingPaymentService] Stub called - no refund processing');
    return {
        success: true,
        transactionId: `refund_stub_${Date.now()}`,
    };
}

export async function createEscrowHold(
    bookingId: string,
    amount: number
): Promise<PaymentResult> {
    console.log('[bookingPaymentService] Stub called - no escrow hold');
    return {
        success: true,
        transactionId: `escrow_stub_${Date.now()}`,
    };
}

export default {
    processBookingPayment,
    refundBookingPayment,
    createEscrowHold,
};
