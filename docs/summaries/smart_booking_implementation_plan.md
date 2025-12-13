# Smart Booking System - Design Proposal

## The Problem

The current booking flow assumes **all items follow the same billing logic**, which breaks when mixing:

| Item | Price | Unit | Billing Type |
|------|-------|------|--------------|
| Windows installation | CHF 100 | unit | **One-time** |
| SSD replacement | CHF 50 | unit | **One-time** |
| Space reduction | CHF 20 | hour | **Hourly** |

**Current Bug:** Total = CHF 0.00 because the system doesn't know how to combine:
- A 2-hour duration selection
- One-time fixed items (Windows, SSD)
- Hourly items (Space reduction)

**Logical Question:** If someone books "Windows installation" (a one-time task), why would they select hours? The calendar makes no sense for pure fixed-price services.

---

## Proposed Solutions

### Option A: Item-Level Billing Awareness

**Concept:** Each price list item declares its own billing type.

```
priceList: [
  { description: "Windows installation", price: 100, billingType: "once" },
  { description: "Space reduction", price: 20, billingType: "hourly" }
]
```

**Calculation Logic:**
```
Total = Σ(one-time items) + Σ(hourly items × duration) + Σ(daily items × days)
```

**Pros:**
- Flexible per-item pricing
- Works for mixed services

**Cons:**
- Requires vendor to understand billing types
- Calendar still shows even for pure fixed-price lists

---

### Option B: Vendor-Controlled Booking Mode

**Concept:** Vendor explicitly chooses how their service is booked.

| Mode | Calendar? | Price List? | Use Case |
|------|-----------|-------------|----------|
| **Calendar** | ✅ Yes | Optional addons | Hourly/daily services (cleaning, tutoring) |
| **Instant** | ❌ No | ✅ Primary | Fixed deliverables (installations, repairs) |
| **Quote** | ❌ No | ❌ No | Complex jobs requiring discussion |

**Schema Change:**
```typescript
services: {
  bookingMode: "calendar" | "instant" | "quote"
}
```

**Pros:**
- Clear vendor control
- UI adapts per mode (no confusing calendar for fixed services)

**Cons:**
- Some services genuinely need both (e.g., "Basic clean = fixed, Deep clean = hourly")

---

### Option C: AI-Assisted Smart Booking (Recommended)

**Concept:** AI analyzes service configuration and dynamically builds the optimal booking flow.

**How it works:**

1. **Service Analysis Phase** (when vendor creates listing):
   - AI reads: title, description, price type, price list items
   - AI determines: "This is a fixed-service" vs "This needs scheduling"
   - AI suggests booking mode (vendor can override)

2. **Customer Booking Phase**:
   - If **all items are one-time**: Skip calendar entirely, show item selection only
   - If **any item is hourly/daily**: Show calendar + item selection
   - If **mixed**: Show duration picker + smart item categorization

3. **Smart Price Compilation**:
   ```
   AI compiles:
   - "You selected: Windows installation (CHF 100) + 2 hours of Space reduction (CHF 40)"
   - Total: CHF 140
   ```

4. **Fallback**: If AI is uncertain, prompt user: "Does this service require scheduling, or is it a fixed delivery?"

**Pros:**
- Minimal vendor configuration
- Intelligent UX adaptation
- Handles edge cases gracefully

**Cons:**
- AI dependency (needs fallback logic)
- More complex to implement

---

### Option D: Hybrid Approach (Best Balance) ✅ APPROVED

**Concept:** Combine vendor control with smart defaults.

1. **Vendor sets service-level mode:**
   - `requiresScheduling: boolean` (Does this service need a calendar?)
   
2. **Price list items have billing type:**
   - `billingType: "once" | "per_duration"` (per-duration respects the base unit: hour/day)

3. **Smart UI:**
   - If `requiresScheduling = false` AND all items are `once`: No calendar, just item picker
   - If `requiresScheduling = true` OR any item is `per_duration`: Show calendar

4. **Calculation:**
   ```
   Base = service.price × duration (if hourly/daily service)
   Addons = Σ(once items) + Σ(per_duration items × duration)
   Total = Base + Addons + platformFee
   ```

---

## Implementation Status

### Phase 1: Schema & Backend ✅ COMPLETE
- Updated `priceListSchema` to include `billingType` field
- Added `requiresScheduling` to services table
- Fixed pricing calculation for list-type services
- Applied database migration

### Phase 2: Frontend - Service Form ✅ COMPLETE
- Added billing type selector to each price list item

### Phase 3: Frontend - Booking Flow 🔄 IN PROGRESS
- [ ] Adapt booking UI based on `requiresScheduling`
- [ ] Test full flow with mixed billing types

### Phase 4: AI Enhancement (Future)
- [ ] AI auto-detection of booking mode
- [ ] Smart suggestions for billing types

---

*Approved by user on December 12, 2025*
