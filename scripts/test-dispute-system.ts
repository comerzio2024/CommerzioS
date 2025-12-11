/**
 * Dispute System Test Script
 * 
 * Run with: npx ts-node scripts/test-dispute-system.ts
 * 
 * This script simulates a full dispute flow for testing purposes.
 */

import { db } from "../server/db";
import { users, bookings, escrowTransactions, escrowDisputes } from "../shared/schema";
import { eq } from "drizzle-orm";
import { 
  openDispute,
  submitCounterOffer,
  getDisputeDetails 
} from "../server/services/disputeResolutionService";
import { 
  analyzeDispute,
  generateResolutionOptions 
} from "../server/services/disputeAiService";

async function runDisputeTest() {
  console.log("=".repeat(60));
  console.log("DISPUTE SYSTEM TEST SIMULATION");
  console.log("=".repeat(60));

  // 1. Find a test booking (or create mock data)
  console.log("\n[STEP 1] Finding test booking...");
  
  const [testBooking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.status, "completed"))
    .limit(1);

  if (!testBooking) {
    console.error("❌ No completed booking found. Create a test booking first.");
    console.log("\nTo create test data, you need a completed booking with:");
    console.log("  - customerId and vendorId");
    console.log("  - An associated escrow transaction");
    return;
  }

  console.log(`✅ Found booking: ${testBooking.id}`);
  console.log(`   Customer: ${testBooking.customerId}`);
  console.log(`   Vendor: ${testBooking.vendorId}`);

  // 2. Check if booking has escrow
  const [escrow] = await db
    .select()
    .from(escrowTransactions)
    .where(eq(escrowTransactions.bookingId, testBooking.id))
    .limit(1);

  if (!escrow) {
    console.error("❌ No escrow transaction found for this booking.");
    console.log("   Creating mock escrow for testing...");
    
    // Note: In production, escrow is created during payment
    // For testing, you'd need to create one manually
    return;
  }

  console.log(`✅ Found escrow: ${escrow.id} (${escrow.amount} CHF)`);

  // 3. Check if dispute already exists
  const [existingDispute] = await db
    .select()
    .from(escrowDisputes)
    .where(eq(escrowDisputes.bookingId, testBooking.id))
    .limit(1);

  if (existingDispute) {
    console.log(`\n⚠️  Dispute already exists: ${existingDispute.id}`);
    console.log(`   Status: ${existingDispute.status}`);
    console.log(`   Reason: ${existingDispute.reason}`);
    
    // Test fetching dispute details
    console.log("\n[STEP 2] Testing getDisputeDetails...");
    const details = await getDisputeDetails(existingDispute.id);
    console.log(`✅ Got dispute details:`);
    console.log(`   Phase: ${details.phases?.currentPhase || 'N/A'}`);
    console.log(`   Responses: ${details.responses.length}`);
    
    // If in Phase 1, test counter-offer
    if (details.phases?.currentPhase === 'phase_1') {
      console.log("\n[STEP 3] Testing counter-offer submission...");
      try {
        const response = await submitCounterOffer(
          existingDispute.id,
          testBooking.customerId,
          50, // 50% refund proposal
          "Test counter-offer from simulation"
        );
        console.log(`✅ Counter-offer submitted: ${response.id}`);
      } catch (e: any) {
        console.log(`⚠️  Counter-offer failed: ${e.message}`);
      }
    }
    
    // If in Phase 2+, test AI analysis
    if (details.phases?.currentPhase && ['phase_2', 'phase_3_pending', 'phase_3_ai'].includes(details.phases.currentPhase)) {
      console.log("\n[STEP 4] Testing AI Analysis...");
      try {
        const analysis = await analyzeDispute(existingDispute.id);
        console.log(`✅ AI Analysis complete:`);
        console.log(`   Overall: ${(analysis.overallAssessment as any)?.primaryIssue || 'N/A'}`);
        
        console.log("\n[STEP 5] Testing Resolution Options Generation...");
        const options = await generateResolutionOptions(existingDispute.id);
        console.log(`✅ Generated ${options.length} options`);
        options.forEach(o => {
          console.log(`   Option ${o.optionLabel}: ${o.customerRefundPercent}% customer / ${o.vendorPaymentPercent}% vendor`);
        });
      } catch (e: any) {
        console.log(`⚠️  AI processing failed: ${e.message}`);
      }
    }
    
    return;
  }

  // 4. Open new dispute
  console.log("\n[STEP 2] Opening new dispute...");
  try {
    const result = await openDispute(
      testBooking.id,
      testBooking.customerId,
      "poor_quality",
      "This is a test dispute created by the simulation script. The service quality was below expectations."
    );
    console.log(`✅ Dispute opened: ${result.disputeId}`);

    // 5. Test getting dispute details
    console.log("\n[STEP 3] Fetching dispute details...");
    const details = await getDisputeDetails(result.disputeId);
    console.log(`✅ Dispute details fetched:`);
    console.log(`   Phase: ${details.phases?.currentPhase}`);
    console.log(`   Customer ID: ${details.parties?.customerId}`);
    console.log(`   Vendor ID: ${details.parties?.vendorId}`);

    console.log("\n[SUCCESS] Dispute system test completed!");
    console.log(`\nView in UI: http://localhost:5000/disputes`);
    
  } catch (e: any) {
    console.error(`❌ Failed to open dispute: ${e.message}`);
  }
}

// Run the test
runDisputeTest()
  .then(() => {
    console.log("\n" + "=".repeat(60));
    console.log("Test simulation finished.");
    process.exit(0);
  })
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  });
