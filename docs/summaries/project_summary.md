# CommerzioS - Project Status Summary

## 🎯 Project Overview

**CommerzioS** is a full-stack service marketplace platform for the Swiss market, enabling customers to discover, book, and pay for services from verified vendors.

**Tech Stack:**
| Layer | Technologies |
|-------|-------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Radix UI, TanStack Query |
| Backend | Express.js, Node.js 20+, TypeScript, Drizzle ORM |
| Database | PostgreSQL (Neon Serverless) |
| Payments | Stripe + TWINT |
| AI | OpenAI GPT-4 |
| Storage | Cloudflare R2 / AWS S3 |
| Infrastructure | Railway / Vercel |

---

## ✅ What's Working (Production Ready)

### Core Platform
- **Authentication**: Local + OAuth (Google, Twitter, Facebook)
- **Service Listings**: Full CRUD with categories, subcategories, images, pricing
- **Booking System**: Request → Accept/Counter → Confirm → Complete workflow
- **Payment Processing**: Stripe cards + TWINT with escrow system
- **Review System**: 5-star ratings, written reviews, vendor responses
- **Chat System**: Real-time WebSocket messaging per booking
- **Notification System**: In-app, email, web push with AI prioritization
- **Referral System**: Multi-level referral codes with points redemption
- **Tip System**: Post-service tipping functionality
- **Admin Dashboard**: User/service management, analytics, moderation

### Key Pages (31 pages total)
- Home, Search, Service Detail, Book Service
- Login/Register (local + OAuth)
- Profile (huge: 263KB - customer & vendor views)
- My Bookings (108KB - complex booking management)
- Admin Panel (184KB - comprehensive dashboard)
- Chat, Notifications, Favorites, Referrals, Disputes

---

## 🔁 Recent Work (This Session)

### Smart Pricing System - In Progress

**Problem Identified:** The booking system couldn't handle mixed billing types (one-time items vs hourly items) properly. Price was calculating as CHF 0.00.

**Solution Implemented (Phase 1):**

1. **Schema Updates** (`shared/schema.ts`)
   - Added `billingType: 'once' | 'per_duration'` to `priceListSchema`
   - Added `requiresScheduling: boolean` to services table

2. **Backend Logic** (`server/pricingCalculationService.ts`)
   - Added `createEmptyBreakdown()` for list-type services
   - Updated `applyPriceListItems()` to respect billing types:
     - `once`: Fixed price (e.g., "Windows installation" = CHF 100)
     - `per_duration`: Multiplied by hours (e.g., "Space reduction" = CHF 20/hr)

3. **Frontend Form** (`client/src/components/service-form-modal.tsx`)
   - Added billing type radio buttons to each price list item
   - Vendors can now specify "One-time" vs "Per hour/day"

**Still Needed (Phase 2-3):**
- [ ] Show/hide calendar based on `requiresScheduling`
- [ ] Test full booking flow with mixed billing
- [ ] AI auto-detection of billing types during service creation

---

## ⚠️ Known Issues & Incomplete Features

| Issue | Status | Notes |
|-------|--------|-------|
| CHF 0.00 pricing | Partially Fixed | Schema updated, needs testing |
| Service ownership validation | In Progress | Some operations lack owner checks |
| Escrow for disputes | Known Issue | Requires escrow tx to create dispute |
| Review removal flow | Known Issue | Service ownership check needed |
| E2E Tests | 29/36 passing | 7 tests skipped due to issues |
| Profile page size | Tech Debt | 263KB - should be split |
| Admin page size | Tech Debt | 184KB - should be split |

---

## 📁 Key File Reference

### Backend Services (`/server/`)
| File | Size | Purpose |
|------|------|---------|
| `routes.ts` | 321KB | Main API routes (⚠️ needs splitting) |
| `bookingService.ts` | 34KB | Booking lifecycle management |
| `pricingCalculationService.ts` | 31KB | Price calculation engine |
| `chatService.ts` | 41KB | Real-time messaging |
| `stripeService.ts` | 40KB | Payment processing |
| `notificationService.ts` | 30KB | Multi-channel notifications |
| `referralService.ts` | 26KB | Referral & points system |
| `authService.ts` | 25KB | Authentication logic |

### Frontend Pages (`/client/src/pages/`)
| File | Size | Purpose |
|------|------|---------|
| `profile.tsx` | 264KB | User/vendor profile (⚠️ massive) |
| `admin.tsx` | 184KB | Admin dashboard |
| `my-bookings.tsx` | 108KB | Booking management |
| `service-requests.tsx` | 84KB | Service request system |
| `service-detail.tsx` | 66KB | Service view page |
| `home.tsx` | 50KB | Landing page |
| `book-service.tsx` | 40KB | Booking wizard |

### Shared (`/shared/`)
- `schema.ts` - Database schema (Drizzle)
- Type definitions and validation schemas

---

## 🚀 Planned Scaling / Future Work

### Immediate Priorities
1. **Complete Smart Pricing** - Finish Phase 2-3 of billing type system
2. **Split Large Files** - routes.ts, profile.tsx, admin.tsx
3. **Fix E2E Tests** - Get all 36 tests passing
4. **Service Ownership** - Add proper authorization checks

### Medium-Term Roadmap
| Feature | Priority | Description |
|---------|----------|-------------|
| Payment Details Storage | High | Save cards to user profile for faster checkout |
| Vendor Analytics | High | Per-vendor revenue/booking dashboards |
| Service Bundles | Medium | Package multiple services together |
| Video Support | Medium | Video demos for services |
| Subscription Services | Medium | Recurring service subscriptions |
| Mobile App | Medium | React Native version |

### Technical Debt
- **Routes Refactoring**: Split 321KB routes.ts into modular files
- **Component Library**: Consolidate UI components
- **API Standardization**: RESTful consistency across endpoints
- **Caching Layer**: Redis for session/query caching
- **Monitoring**: Add APM (Application Performance Monitoring)

---

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start full-stack dev server

# Database
npm run db:push          # Apply schema changes
npm run db:studio        # Open Drizzle Studio GUI

# Testing
npm run test:e2e         # Run Playwright E2E tests
npm run test             # Run Vitest unit tests

# Production
npm run build            # Build for production
npm run start            # Start production server
```

---

## 📊 Project Statistics

| Metric | Value |
|--------|-------|
| Total Pages | 31 |
| Total Components | ~141 |
| Backend Services | 47 files |
| E2E Tests | 36 (29 passing) |
| Schema Tables | 25+ |
| Lines of Code | ~50,000+ |

---

## 🔐 Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | ✅ | PostgreSQL connection |
| `SESSION_SECRET` | ✅ | Session encryption |
| `STRIPE_SECRET_KEY` | ✅ | Payments |
| `OPENAI_API_KEY` | Optional | AI features |
| `GOOGLE_MAPS_API_KEY` | Optional | Maps |
| OAuth keys | Optional | Social login |

---

*Last Updated: December 13, 2025*
