# Smart Booking System Implementation - Task List

## Phase 1: Schema & Backend ✅ COMPLETE
- [x] Update `priceListSchema` to include `billingType` field
- [x] Add logic to `pricingCalculationService.ts` to handle different billing types
- [x] Fix the CHF 0.00 bug (price not calculating) - added list-type service handling
- [x] Add `requiresScheduling` to services table (migration applied)

## Phase 2: Frontend - Service Creation ✅ COMPLETE
- [x] Update service form to allow vendors to set billing type per price list item
- [ ] Add `requiresScheduling` toggle to service form (optional enhancement)

## Phase 3: Frontend - Booking Flow
- [ ] Adapt booking UI based on `requiresScheduling` (hide calendar for fixed services)
- [ ] Display proper price breakdown with item-level billing type awareness
- [ ] Test full flow with mixed billing types

## Phase 4: AI Enhancement (Future)
- [ ] AI auto-detection of booking mode during service creation
- [ ] Smart suggestions for billing types based on unit values

---

## Changes Made

### Schema (`shared/schema.ts`)
- Added `billingType: z.enum(["once", "per_duration"])` to `priceListSchema`
- Added `requiresScheduling: boolean` to services table

### Backend (`server/pricingCalculationService.ts`)
- Added special handling for `priceType === 'list'` services
- Created `createEmptyBreakdown()` function for list-type services
- Updated `applyPriceListItems()` to respect billing types:
  - `once`: Adds fixed price once
  - `per_duration`: Multiplies price by booking hours

### Frontend (`client/src/components/service-form-modal.tsx`)
- Added billing type selector (radio buttons) to each price list item
- Vendors can now choose "One-time" vs "Per hour/day" for each item
