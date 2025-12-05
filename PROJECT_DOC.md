# CommerzioS - Service Marketplace Platform

## Project Documentation

### Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Features Implemented](#features-implemented)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Authentication & Security](#authentication--security)
8. [Payment System](#payment-system)
9. [Known Issues & Technical Debt](#known-issues--technical-debt)
10. [Recommendations](#recommendations)
11. [Scaling Roadmap](#scaling-roadmap)
12. [Development Setup](#development-setup)

---

## Project Overview

**CommerzioS** (also known as ServeMKT) is a comprehensive service marketplace platform designed specifically for the Swiss market. It connects service providers (vendors) with customers seeking various services, from home maintenance to professional consultations.

### Core Value Proposition
- **For Vendors**: Platform to showcase services, manage bookings, receive payments securely via escrow
- **For Customers**: Discover local services, book appointments, secure transactions with dispute resolution
- **For Admins**: Full platform management, dispute resolution, user verification, analytics

### Target Market
- Primary: Switzerland (multilingual support: DE, FR, EN, IT)
- Service categories: Home Services, Design, Education, Wellness, Business, Automotive, Pets, Events, Legal/Financial, Technology

---

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack Query (React Query v5)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Forms**: React Hook Form with Zod validation
- **Maps**: Google Maps API integration
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon Serverless)
- **ORM**: Drizzle ORM
- **Authentication**: Passport.js (local + OAuth)
- **File Storage**: AWS S3 compatible (object storage)
- **Email**: Nodemailer with SMTP
- **Payments**: Stripe (cards) + TWINT integration
- **Push Notifications**: Web Push API

### DevOps & Infrastructure
- **Hosting**: Replit (development), scalable to any Node.js host
- **Database**: Neon PostgreSQL (serverless)
- **Storage**: S3-compatible object storage
- **CI/CD**: GitHub Actions ready
- **Testing**: Vitest (unit), Playwright (E2E)

---

## Architecture

### Directory Structure
```
CommerzioS/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and API client
│   └── public/            # Static assets
├── server/                 # Express backend
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Database operations
│   ├── auth.ts            # Authentication logic
│   ├── services/          # Business logic services
│   ├── middleware/        # Express middleware
│   └── utils/             # Server utilities
├── shared/                 # Shared code
│   └── schema.ts          # Database schema & types
├── scripts/               # Utility scripts
└── e2e/                   # End-to-end tests
```

### Data Flow
1. **Client** → HTTP Request → **Express Server**
2. **Server** → Validates → **Middleware** (auth, rate limiting)
3. **Handler** → **Storage Layer** → **Drizzle ORM** → **PostgreSQL**
4. **Response** → JSON → **React Query** → **UI Update**

---

## Features Implemented

### User Management
- ✅ User registration with email verification
- ✅ Login with email/password
- ✅ OAuth login (Google, Facebook, Twitter)
- ✅ Profile management with avatar upload
- ✅ Identity verification system
- ✅ Referral system with points
- ✅ Address book management

### Service Listings
- ✅ Create/edit/delete services
- ✅ AI-powered category suggestion
- ✅ Multi-image upload with drag-and-drop reordering
- ✅ Image cropping and editing
- ✅ Pricing options (fixed, hourly, custom)
- ✅ Location-based services with map
- ✅ Service expiration and renewal
- ✅ Draft saving
- ✅ Contact management per service
- ✅ Availability settings
- ✅ Accepted payment methods configuration

### Search & Discovery
- ✅ Category browsing with subcategories
- ✅ Full-text search with filters
- ✅ Location-based search (nearby services)
- ✅ Map view with service markers
- ✅ Favorites system
- ✅ Service request marketplace

### Booking System
- ✅ Real-time availability checking
- ✅ Booking requests with time slots
- ✅ Vendor accept/reject/counter-offer flow
- ✅ Booking reminders (email + push)
- ✅ Booking status tracking
- ✅ Customer confirmation workflow

### Payment System
- ✅ Stripe integration for card payments
- ✅ TWINT payment support
- ✅ Cash payment option
- ✅ Escrow system for secure transactions
- ✅ Auto-release after confirmation
- ✅ Tipping system

### Reviews & Ratings
- ✅ Post-booking reviews
- ✅ Star ratings (1-5)
- ✅ Review editing and removal requests
- ✅ "Review Back" feature for vendors
- ✅ Verified review badges

### Messaging
- ✅ Real-time chat between users
- ✅ Chat context from bookings
- ✅ Message notifications
- ✅ Read receipts

### Disputes
- ✅ Dispute filing with evidence upload
- ✅ Admin dispute resolution
- ✅ Escrow fund management during disputes
- ✅ Dispute status tracking

### Notifications
- ✅ In-app notification center
- ✅ Email notifications
- ✅ Push notifications (web)
- ✅ Notification preferences

### Admin Panel
- ✅ User management
- ✅ Service moderation
- ✅ Dispute resolution center
- ✅ Review moderation
- ✅ Category management
- ✅ Plan/subscription management
- ✅ AI assistant for admin tasks
- ✅ Platform settings

### Service Requests (Reverse Marketplace)
- ✅ Customers post service needs
- ✅ Vendors submit proposals
- ✅ Proposal management
- ✅ Request-to-booking conversion

---

## Database Schema

### Core Tables

#### Users
```sql
- id (UUID, primary key)
- email (unique)
- passwordHash
- firstName, lastName
- profileImageUrl
- phone, address, city, country
- isVerified, emailVerified
- planId (subscription tier)
- referralCode, referredBy
- points (gamification)
- createdAt, updatedAt
```

#### Services
```sql
- id (UUID, primary key)
- ownerId (references users)
- title, description
- categoryId, subcategoryId
- priceType (fixed/list/text)
- price, priceUnit
- locations (array)
- images (array), imageMetadata
- status (draft/active/paused/expired)
- contactPhone, contactEmail
- acceptedPaymentMethods
- cancellationPolicy
- expiresAt
```

#### Bookings
```sql
- id (UUID, primary key)
- bookingNumber (unique)
- customerId, vendorId, serviceId
- paymentMethod (card/twint/cash)
- requestedStartTime, requestedEndTime
- confirmedStartTime, confirmedEndTime
- status (workflow states)
- totalAmount, notes
- stripePaymentIntentId
```

#### Escrow Transactions
```sql
- id (UUID, primary key)
- bookingId
- amount
- status (held/released/refunded/disputed)
- releasedAt, refundedAt
```

#### Reviews
```sql
- id (UUID, primary key)
- serviceId, reviewerId
- rating (1-5)
- comment
- editCount
```

### Supporting Tables
- Categories, Subcategories
- ChatConversations, ChatMessages
- Notifications
- Favorites
- ServiceContacts
- ServicePricingOptions
- ServiceAvailabilitySettings
- Plans
- Referrals
- EscrowDisputes
- Tips

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user` - Current user info
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/reset-password` - Password reset

### Services
- `GET /api/services` - List services (with filters)
- `GET /api/services/:id` - Get service details
- `POST /api/services` - Create service
- `PATCH /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service
- `POST /api/services/nearby` - Get nearby services
- `GET /api/services/booked-by/:customerId` - Services booked by customer

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - List user bookings
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings/:id/accept` - Vendor accept
- `POST /api/bookings/:id/reject` - Vendor reject
- `POST /api/bookings/:id/confirm` - Customer confirm

### Reviews
- `GET /api/services/:id/reviews` - Get service reviews
- `POST /api/services/:id/reviews` - Create review
- `PATCH /api/reviews/:id` - Update review

### Chat
- `GET /api/chat/conversations` - List conversations
- `GET /api/chat/conversations/:id/messages` - Get messages
- `POST /api/chat/conversations/:id/messages` - Send message

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/users` - List users
- `GET /api/admin/disputes` - List disputes
- `POST /api/admin/disputes/:id/resolve` - Resolve dispute

---

## Authentication & Security

### Password Security
- bcrypt hashing with salt rounds = 10
- Minimum password requirements enforced

### Session Management
- Express session with PostgreSQL store
- Secure cookie settings in production
- CSRF protection via SameSite cookies

### OAuth Providers
- Google OAuth 2.0
- Facebook Login
- Twitter OAuth

### Rate Limiting
- API rate limiting per IP
- Login attempt throttling
- Idempotency middleware for critical operations

### Data Protection
- Input validation with Zod schemas
- SQL injection prevention via Drizzle ORM
- XSS protection with React's default escaping
- File upload restrictions

---

## Payment System

### Stripe Integration
- Payment intents for secure card processing
- Escrow holding via transfer scheduling
- Automatic refunds on cancellation
- Webhook handling for payment events

### TWINT Support
- QR code generation for payments
- Real-time payment verification
- Refund processing

### Escrow Flow
1. Customer pays → Funds held in escrow
2. Service completed → Customer confirms
3. Auto-release after 7 days if no disputes
4. Dispute → Funds frozen until resolution
5. Resolution → Funds released or refunded

---

## Known Issues & Technical Debt

### Critical Issues
1. **None currently** - All critical issues resolved

### Medium Priority
1. **E2E Tests**: Need updating after recent feature changes
2. **Image Upload Limits**: Need to enforce plan-based limits on client
3. **Dispute Evidence**: Image upload needs drag-and-drop support

### Low Priority
1. **Performance**: Large service lists could benefit from virtual scrolling
2. **Caching**: Add Redis for frequently accessed data
3. **Type Safety**: Some `any` types in server code need proper typing

### Technical Debt
1. Review and consolidate duplicate API endpoints
2. Add comprehensive API documentation (OpenAPI/Swagger)
3. Improve error messages for better UX
4. Add request/response logging for debugging

---

## Recommendations

### Short-term (1-3 months)
1. **Mobile App**: React Native app for iOS/Android
2. **SMS Notifications**: Add SMS for booking reminders
3. **Invoice Generation**: PDF invoices for completed bookings
4. **Analytics Dashboard**: Vendor performance metrics
5. **Subscription Billing**: Recurring billing for premium plans

### Medium-term (3-6 months)
1. **Multi-language Support**: Full i18n implementation
2. **Service Bundles**: Allow bundled service offerings
3. **Video Chat**: Integrated video consultations
4. **AI Matching**: Smart service recommendations
5. **Vendor Verification**: Business document verification

### Long-term (6-12 months)
1. **Marketplace API**: Allow third-party integrations
2. **White-label Solution**: Customizable marketplace instances
3. **Blockchain Payments**: Cryptocurrency support
4. **Insurance Integration**: Service insurance offerings
5. **Enterprise Features**: Team accounts, bulk booking

---

## Scaling Roadmap

### Phase 1: Regional Scale (Current → 10K users)
- Current infrastructure sufficient
- Focus on user acquisition and retention
- Optimize database queries
- Add CDN for static assets

### Phase 2: National Scale (10K → 100K users)
- **Database**: Add read replicas
- **Caching**: Implement Redis caching layer
- **Search**: Move to Elasticsearch for search
- **Queue**: Add job queue (Bull) for background tasks
- **Monitoring**: Implement APM (New Relic/DataDog)

### Phase 3: International Scale (100K → 1M users)
- **Infrastructure**: Kubernetes deployment
- **Database**: Sharding strategy
- **CDN**: Multi-region edge caching
- **Microservices**: Extract payment, notification, search services
- **Multi-region**: Deploy in multiple data centers

### Technical Considerations
1. **Horizontal Scaling**: Stateless server design allows easy scaling
2. **Database**: Neon's serverless scales automatically; consider PlanetScale for extreme scale
3. **Storage**: S3 scales infinitely; use CloudFront for delivery
4. **Real-time**: Consider Socket.io/Pusher for chat scaling

---

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL (or Neon account)
- npm or yarn

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://...

# Authentication
SESSION_SECRET=your-secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
TWITTER_CONSUMER_KEY=...
TWITTER_CONSUMER_SECRET=...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Storage
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=...
S3_REGION=...

# Email
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
EMAIL_FROM=...

# Push Notifications
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...

# Maps
GOOGLE_MAPS_API_KEY=...

# Admin
ADMIN_USERNAME=admin@servemkt.ch
ADMIN_PASSWORD=...
```

### Running Locally
```bash
# Install dependencies
npm install

# Run database migrations
npx drizzle-kit push

# Seed database
npx tsx server/seed.ts

# Start development server
npm run dev
```

### Running Tests
```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# With UI
npm run test:e2e:ui
```

---

## Contributing

### Code Style
- ESLint + Prettier configuration
- TypeScript strict mode
- Component-based architecture
- API-first design

### Git Workflow
1. Create feature branch from `main`
2. Make changes with descriptive commits
3. Write/update tests
4. Create pull request
5. Code review required
6. Squash merge to `main`

### Testing Requirements
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user flows
- Manual QA before release

---

## License

Private/Proprietary - All rights reserved.

---

*Last Updated: December 2024*
*Version: 1.0.0*
