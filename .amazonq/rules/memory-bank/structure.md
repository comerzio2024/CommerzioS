# Commerzio Services - Project Structure

## Directory Organization

### Root Level Structure
```
CommerzioS/
├── client/                 # React frontend application
├── server/                 # Express.js backend API
├── shared/                 # Shared TypeScript types and schemas
├── e2e/                   # End-to-end Playwright tests
├── scripts/               # Database and utility scripts
├── migrations/            # Database migration files
├── attached_assets/       # Static assets and generated images
├── design-reference/      # UI/UX design prototypes
├── vercel-design/         # Alternative Next.js design implementation
└── docs/                  # Project documentation
```

## Core Components

### Frontend (client/)
- **React 19** with TypeScript for modern UI development
- **Vite** as build tool for fast development and optimized production builds
- **Tailwind CSS** with Radix UI components for consistent design system
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management and caching
- **React Hook Form** with Zod validation for form handling

### Backend (server/)
- **Express.js** server with TypeScript for API endpoints
- **Drizzle ORM** with PostgreSQL for database operations
- **Session-based authentication** with Passport.js integration
- **Modular service architecture** with dedicated business logic services
- **Middleware stack** for validation, rate limiting, and security

### Shared Layer (shared/)
- **Zod schemas** for runtime type validation across client and server
- **Database schema definitions** using Drizzle ORM
- **Type definitions** ensuring type safety between frontend and backend
- **Validation rules** shared across the application

## Architectural Patterns

### Service-Oriented Architecture
```
Routes Layer (HTTP endpoints)
    ↓
Middleware Layer (validation, auth, rate limiting)
    ↓
Service Layer (business logic)
    ↓
Data Access Layer (Drizzle ORM)
    ↓
Database Layer (PostgreSQL)
```

### Key Service Modules
- **Authentication Services**: User registration, login, OAuth providers
- **Booking Services**: Appointment scheduling, availability management
- **Payment Services**: Stripe integration, escrow, commission handling
- **Notification Services**: Email, push notifications, in-app alerts
- **AI Services**: Content moderation, pricing analysis, smart categorization
- **Dispute Services**: Multi-phase resolution, consensus mechanisms

### Database Architecture
- **Primary Schema** (`schema.ts`): Core entities (users, services, bookings, reviews)
- **Dispute Schema** (`schema-disputes.ts`): Dispute resolution system
- **Service Request Schema** (`schema-service-requests.ts`): Custom service requests
- **Vendor Stats Schema** (`schema-vendor-stats.ts`): Performance analytics

### Component Relationships

#### Frontend Component Structure
```
App.tsx (Root)
├── Pages/ (Route components)
├── Components/ (Reusable UI components)
├── Hooks/ (Custom React hooks)
├── Lib/ (Utility functions)
└── Types/ (TypeScript definitions)
```

#### Backend Service Dependencies
```
Routes → Services → Database
    ↓       ↓         ↓
Middleware  Utils   Validators
```

### Integration Points
- **API Communication**: RESTful endpoints with JSON payloads
- **Real-time Features**: WebSocket connections for chat and notifications
- **External Services**: Stripe, OpenAI, Google Maps, email providers
- **File Storage**: AWS S3/R2 for image and document handling

### Security Architecture
- **Authentication**: Session-based with secure cookie handling
- **Authorization**: Role-based access control (user, vendor, admin)
- **Data Protection**: Input validation, SQL injection prevention, XSS protection
- **Rate Limiting**: API endpoint protection against abuse
- **CSRF Protection**: State parameter validation for OAuth flows

### Testing Strategy
- **Unit Tests**: Vitest for individual component and service testing
- **Integration Tests**: API endpoint testing with Supertest
- **E2E Tests**: Playwright for full user journey testing
- **Type Safety**: TypeScript compilation checks across all layers

### Deployment Architecture
- **Development**: Local development with hot reloading
- **Production**: Optimized builds with static asset serving
- **Database**: PostgreSQL with connection pooling
- **CDN**: Static asset delivery for images and files
- **Monitoring**: Health checks and error logging