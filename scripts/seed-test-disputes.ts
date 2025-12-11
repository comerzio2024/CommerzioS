/**
 * Seed 10 Test Disputes for marcelpavel64@gmail.com
 * 
 * Run with: npx ts-node --esm scripts/seed-test-disputes.ts
 */

import { db } from "../server/db.js";
import { users, bookings, escrowTransactions, escrowDisputes, services } from "@shared/schema";
import { disputePhases } from "@shared/schema-disputes";
import { eq, and, or, sql, not, inArray } from "drizzle-orm";

const DISPUTE_REASONS = [
  "service_not_provided",
  "poor_quality", 
  "wrong_service",
  "overcharged",
  "no_show",
  "other"
] as const;

const DISPUTE_DESCRIPTIONS = [
  "The vendor did not show up for the scheduled appointment. I waited for over an hour with no communication.",
  "The quality of work was significantly below what was advertised. The final result doesn't match the portfolio examples.",
  "I was charged 50% more than the quoted price without any prior discussion or agreement.",
  "The vendor provided a completely different service than what was booked. I ordered deep cleaning but got basic cleaning.",
  "The vendor was unprofessional and left the work unfinished, claiming they had another appointment.",
  "Communication was terrible - vendor ignored my messages for days and then cancelled last minute.",
  "The service was performed but the result is not acceptable. Multiple issues remain unresolved.",
  "Vendor arrived 3 hours late and rushed through the service, missing several important steps.",
  "Was promised premium materials but received cheap alternatives. The vendor refuses to refund the difference.",
  "The vendor's behavior was rude and dismissive. They left before completing the agreed scope of work."
];

async function seedTestDisputes() {
  console.log("=".repeat(60));
  console.log("SEEDING TEST DISPUTES");
  console.log("=".repeat(60));

  // 1. Find the user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, "marcelpavel64@gmail.com"))
    .limit(1);

  if (!user) {
    console.error("❌ User marcelpavel64@gmail.com not found!");
    return;
  }

  console.log(`✅ Found user: ${user.firstName} ${user.lastName} (${user.id})`);

  // 2. Find bookings for this user (as customer OR vendor)
  const userBookings = await db
    .select({
      booking: bookings,
      service: services,
      escrow: escrowTransactions
    })
    .from(bookings)
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .leftJoin(escrowTransactions, eq(escrowTransactions.bookingId, bookings.id))
    .where(
      or(
        eq(bookings.customerId, user.id),
        eq(bookings.vendorId, user.id)
      )
    )
    .limit(20);

  console.log(`\n📋 Found ${userBookings.length} bookings for user`);

  if (userBookings.length === 0) {
    console.error("❌ No bookings found for this user. Cannot create disputes.");
    console.log("\nTip: Create some test bookings first using the comprehensive seed script.");
    return;
  }

  // 3. Filter out bookings that already have disputes
  const existingDisputes = await db
    .select({ bookingId: escrowDisputes.bookingId })
    .from(escrowDisputes);
  
  const disputedBookingIds = new Set(existingDisputes.map(d => d.bookingId));
  const availableBookings = userBookings.filter(b => !disputedBookingIds.has(b.booking.id));

  console.log(`📋 ${availableBookings.length} bookings available for disputes`);

  if (availableBookings.length === 0) {
    console.log("\n⚠️  All bookings already have disputes!");
    console.log("   Showing existing disputes...\n");
    
    const existing = await db
      .select()
      .from(escrowDisputes)
      .where(
        or(
          eq(escrowDisputes.customerId, user.id),
          eq(escrowDisputes.vendorId, user.id)
        )
      );
    
    existing.forEach((d, i) => {
      console.log(`   ${i + 1}. ${d.id} - ${d.reason} (${d.status})`);
    });
    
    return;
  }

  // 4. Create disputes (up to 10)
  const disputesToCreate = Math.min(10, availableBookings.length);
  console.log(`\n🚀 Creating ${disputesToCreate} test disputes...\n`);

  for (let i = 0; i < disputesToCreate; i++) {
    const { booking, service, escrow } = availableBookings[i];
    const isCustomer = booking.customerId === user.id;
    
    const reason = DISPUTE_REASONS[i % DISPUTE_REASONS.length];
    const description = DISPUTE_DESCRIPTIONS[i];
    
    // Determine escrow amount
    let escrowAmount = "0";
    if (escrow?.amount) {
      escrowAmount = escrow.amount;
    } else if (booking.totalPrice) {
      escrowAmount = booking.totalPrice;
    }

    try {
      // Create dispute
      const [dispute] = await db
        .insert(escrowDisputes)
        .values({
          bookingId: booking.id,
          escrowTransactionId: escrow?.id || null,
          customerId: booking.customerId,
          vendorId: booking.vendorId,
          raisedBy: isCustomer ? "customer" : "vendor",
          raisedByUserId: user.id,
          reason: reason,
          description: description,
          evidenceUrls: [],
          status: "open",
          escrowAmount: escrowAmount,
        })
        .returning();

      // Initialize dispute phases (Phase 1)
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 7); // 7 days for Phase 1

      await db
        .insert(disputePhases)
        .values({
          disputeId: dispute.id,
          currentPhase: "phase_1",
          phase1StartedAt: new Date(),
          phase1Deadline: deadline,
        });

      console.log(`   ✅ Dispute ${i + 1}: ${dispute.id}`);
      console.log(`      Service: ${service?.title || 'N/A'}`);
      console.log(`      Reason: ${reason}`);
      console.log(`      Amount: ${escrowAmount} CHF`);
      console.log(`      Role: ${isCustomer ? 'Customer' : 'Vendor'}\n`);

    } catch (e: any) {
      console.error(`   ❌ Failed to create dispute ${i + 1}: ${e.message}`);
    }
  }

  console.log("=".repeat(60));
  console.log("✅ Test disputes seeded successfully!");
  console.log(`   View at: http://localhost:5000/disputes`);
  console.log("=".repeat(60));
}

// Run
seedTestDisputes()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  });
