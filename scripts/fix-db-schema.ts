/**
 * Database Schema Fix Script
 * 
 * This script adds missing columns and fixes schema issues
 * Run with: npx tsx scripts/fix-db-schema.ts
 */

import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const sql = neon(process.env.DATABASE_URL);

async function fixSchema() {
  console.log("Starting schema fix...");

  try {
    // 1. Add missing columns to bookings table
    console.log("\n1. Adding missing columns to bookings table...");
    
    const bookingColumns = [
      { name: 'vendor_review_request_count', sql: 'ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vendor_review_request_count INTEGER DEFAULT 0' },
      { name: 'last_vendor_review_request_at', sql: 'ALTER TABLE bookings ADD COLUMN IF NOT EXISTS last_vendor_review_request_at TIMESTAMP' },
    ];

    for (const col of bookingColumns) {
      try {
        await sql(col.sql);
        console.log(`  ✓ Added/verified column: ${col.name}`);
      } catch (err: any) {
        if (err.code === '42701') { // column already exists
          console.log(`  - Column ${col.name} already exists`);
        } else {
          console.error(`  ✗ Error adding ${col.name}:`, err.message);
        }
      }
    }

    // 2. Add missing columns to reviews table
    console.log("\n2. Adding missing columns to reviews table...");
    
    const reviewColumns = [
      { name: 'quality_rating', sql: 'ALTER TABLE reviews ADD COLUMN IF NOT EXISTS quality_rating INTEGER' },
      { name: 'communication_rating', sql: 'ALTER TABLE reviews ADD COLUMN IF NOT EXISTS communication_rating INTEGER' },
      { name: 'punctuality_rating', sql: 'ALTER TABLE reviews ADD COLUMN IF NOT EXISTS punctuality_rating INTEGER' },
      { name: 'value_rating', sql: 'ALTER TABLE reviews ADD COLUMN IF NOT EXISTS value_rating INTEGER' },
    ];

    for (const col of reviewColumns) {
      try {
        await sql(col.sql);
        console.log(`  ✓ Added/verified column: ${col.name}`);
      } catch (err: any) {
        if (err.code === '42701') {
          console.log(`  - Column ${col.name} already exists`);
        } else {
          console.error(`  ✗ Error adding ${col.name}:`, err.message);
        }
      }
    }

    // 3. Clean up duplicate chat conversations before adding unique constraint
    console.log("\n3. Cleaning up duplicate chat conversations...");
    
    // First, identify and remove duplicates with service_id (keep the oldest one)
    await sql`
      DELETE FROM chat_conversations a
      USING chat_conversations b
      WHERE a.id > b.id
        AND a.customer_id = b.customer_id
        AND a.vendor_id = b.vendor_id
        AND a.service_id = b.service_id
        AND a.service_id IS NOT NULL
    `;
    console.log("  ✓ Removed duplicate conversations with service_id");
    
    // Also handle duplicates where service_id is NULL
    await sql`
      DELETE FROM chat_conversations a
      USING chat_conversations b
      WHERE a.id > b.id
        AND a.customer_id = b.customer_id
        AND a.vendor_id = b.vendor_id
        AND a.service_id IS NULL
        AND b.service_id IS NULL
    `;
    console.log("  ✓ Removed duplicate conversations with NULL service_id");

    // 4. Try to add the unique constraint
    console.log("\n4. Adding unique constraint to chat_conversations...");
    try {
      await sql`
        ALTER TABLE chat_conversations
        DROP CONSTRAINT IF EXISTS unique_active_conversation
      `;
      await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS unique_active_conversation 
        ON chat_conversations (customer_id, vendor_id, service_id) 
        NULLS NOT DISTINCT
      `;
      console.log("  ✓ Added unique constraint");
    } catch (err: any) {
      if (err.code === '23505') {
        console.log("  ! Still have duplicates, attempting more aggressive cleanup...");
        
        // More aggressive cleanup - keep only the oldest conversation for each combination
        await sql`
          WITH ranked AS (
            SELECT 
              c.id,
              c.customer_id,
              c.vendor_id,
              c.service_id,
              ROW_NUMBER() OVER (
                PARTITION BY c.customer_id, c.vendor_id, COALESCE(c.service_id, 'NULL_SERVICE')
                ORDER BY c.created_at ASC
              ) as rn
            FROM chat_conversations c
          )
          DELETE FROM chat_conversations
          WHERE id IN (
            SELECT id FROM ranked WHERE rn > 1
          )
        `;
        console.log("  ✓ Aggressive cleanup completed");
        
        // Try again
        try {
          await sql`
            CREATE UNIQUE INDEX IF NOT EXISTS unique_active_conversation 
            ON chat_conversations (customer_id, vendor_id, service_id) 
            NULLS NOT DISTINCT
          `;
          console.log("  ✓ Added unique constraint after cleanup");
        } catch (err2: any) {
          console.error("  ✗ Still failing:", err2.message);
          // Continue anyway - the index may already exist or we'll handle it differently
        }
      } else {
        console.error("  ✗ Error adding constraint:", err.message);
      }
    }

    // 5. Add unique constraint to proposals table
    console.log("\n5. Adding unique constraint to proposals table...");
    try {
      // Clean up potential duplicates first
      await sql`
        DELETE FROM proposals a
        USING proposals b
        WHERE a.id > b.id
          AND a.vendor_id = b.vendor_id
          AND a.service_request_id = b.service_request_id
          AND a.status NOT IN ('withdrawn', 'rejected', 'expired')
          AND b.status NOT IN ('withdrawn', 'rejected', 'expired')
      `;
      
      await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS proposals_vendor_request_unique 
        ON proposals (vendor_id, service_request_id) 
        WHERE status NOT IN ('withdrawn', 'rejected', 'expired')
      `;
      console.log("  ✓ Added unique constraint to proposals");
    } catch (err: any) {
      console.error("  ✗ Error:", err.message);
    }

    // 6. Verify the changes
    console.log("\n6. Verifying schema...");
    
    const bookingCols = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' 
      AND column_name IN ('vendor_review_request_count', 'last_vendor_review_request_at')
    `;
    console.log(`  Bookings columns found: ${bookingCols.map((c: any) => c.column_name).join(', ')}`);
    
    const reviewCols = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'reviews' 
      AND column_name IN ('quality_rating', 'communication_rating', 'punctuality_rating', 'value_rating')
    `;
    console.log(`  Reviews columns found: ${reviewCols.map((c: any) => c.column_name).join(', ')}`);

    console.log("\n✓ Schema fix completed!");
    
  } catch (error) {
    console.error("\n✗ Fatal error:", error);
    process.exit(1);
  }
}

fixSchema();
