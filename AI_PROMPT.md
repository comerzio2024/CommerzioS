# AI Continuation Prompt - CommerzioS Project

## Quick Context Transfer

Use this prompt to give a new AI assistant full context to continue working on the CommerzioS project.

---

## PROMPT START

I'm working on **CommerzioS**, a Swiss service marketplace platform. Here's the complete context you need to continue development:

### Project Overview
CommerzioS is a full-stack service marketplace connecting vendors with customers in Switzerland. It features:
- Service listings with images, pricing, and availability
- Booking system with escrow payments (Stripe + TWINT)
- Real-time chat between users
- Review and rating system
- Dispute resolution
- Admin panel
- Service request marketplace (reverse marketplace)

### Tech Stack
- **Frontend**: React 18 + TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, Wouter router
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (Neon serverless) with Drizzle ORM
- **Auth**: Passport.js (local + Google/Facebook/Twitter OAuth)
- **Payments**: Stripe (cards) + TWINT
- **Storage**: S3-compatible object storage
- **Testing**: Vitest (unit), Playwright (E2E)

### Project Structure
```
CommerzioS/
├── client/src/          # React frontend
│   ├── components/      # UI components (shadcn/ui based)
│   ├── pages/           # Page components
│   ├── hooks/           # Custom hooks
│   └── lib/             # Utilities, API client
├── server/              # Express backend
│   ├── routes.ts        # All API routes (~7000 lines)
│   ├── storage.ts       # Database operations
│   ├── auth.ts          # Authentication
│   └── services/        # Business logic
├── shared/              # Shared code
│   └── schema.ts        # Drizzle schema + Zod validation
└── scripts/             # Utility scripts
```

### Key Files to Know
1. `server/routes.ts` - All API endpoints
2. `shared/schema.ts` - Database schema and validation
3. `server/storage.ts` - Database operations
4. `client/src/App.tsx` - Router configuration
5. `client/src/pages/` - Page components
6. `client/src/components/` - Reusable components

### Database Schema (Key Tables)
- `users` - User accounts
- `services` - Service listings
- `bookings` - Booking records
- `reviews` - Service reviews
- `escrowTransactions` - Payment escrow
- `escrowDisputes` - Dispute records
- `chatConversations/chatMessages` - Messaging
- `notifications` - User notifications
- `favorites` - Saved services
- `categories/subcategories` - Service categorization

### Authentication
- Session-based with Passport.js
- `isAuthenticated` middleware for protected routes
- `isAdmin` middleware for admin routes
- OAuth via Google, Facebook, Twitter

### Recent Work Completed
1. Fixed TypeScript errors in service creation (categoryId, priceUnit types)
2. Added proper "Review Back" feature - vendors can review customers for services they actually booked
3. Fixed admin panel URL routing (tabs like /admin/disputes)
4. Fixed notification actionUrls for SPA navigation
5. Improved draft service saving with lenient validation
6. Fixed chat context from bookings
7. Added service form reset (including tab state)
8. Created comprehensive seed script for test data

### Current Database State
- 30 test users (vendors and customers)
- Multiple services with realistic data
- Bookings, reviews, favorites
- All seeded via `scripts/comprehensive-seed.ts`

### Running the Project
```bash
# Install dependencies
npm install

# Push database schema
npx drizzle-kit push

# Start dev server
npm run dev

# Run comprehensive seed
npx dotenv -e .env -- npx tsx scripts/comprehensive-seed.ts
```

### Important Patterns

#### API Requests (Frontend)
```typescript
import { apiRequest } from "@/lib/api";
const data = await apiRequest("/api/endpoint", {
  method: "POST",
  body: JSON.stringify(payload),
});
```

#### React Query Usage
```typescript
const { data, isLoading } = useQuery({
  queryKey: ["/api/endpoint", params],
  queryFn: () => apiRequest(`/api/endpoint?param=${value}`),
});
```

#### Database Queries (Backend)
```typescript
import { db } from "./db";
import { users, services } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

const result = await db.select().from(users).where(eq(users.id, userId));
```

#### Protected Routes
```typescript
app.get('/api/endpoint', isAuthenticated, async (req: any, res) => {
  const userId = req.user!.id;
  // ...
});
```

### Known Issues to Address
1. Dispute image upload needs drag-and-drop like service images
2. Service image upload should show "upgrade for more" on 5th image
3. E2E tests need updating for recent changes

### Files You'll Likely Need to Edit
- `client/src/components/service-form-modal.tsx` - Service creation
- `client/src/pages/disputes.tsx` - Dispute management
- `server/routes.ts` - API endpoints
- `shared/schema.ts` - Database schema
- `e2e/*.spec.ts` - End-to-end tests

### Environment Variables Needed
```
DATABASE_URL, SESSION_SECRET, STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY,
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_MAPS_API_KEY,
AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET,
SMTP_HOST, SMTP_USER, SMTP_PASS, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
```

### Commands Reference
```bash
npm run dev                    # Start dev server
npm test                       # Run unit tests
npx drizzle-kit push          # Push schema changes
npx drizzle-kit studio        # Open Drizzle Studio
npx tsx scripts/xxx.ts        # Run scripts
```

### Style Guidelines
- Use TypeScript strictly
- Components use shadcn/ui
- API responses: `res.json({ data })` or `res.status(xxx).json({ message })`
- Validation with Zod schemas
- Use TanStack Query for data fetching
- Avoid `any` types where possible

---

## END OF PROMPT

Copy everything above this line to give the new AI full context. The AI should be able to immediately understand the project structure, make informed decisions, and continue development without starting from scratch.

---

## Additional Resources

### Full Documentation
See `PROJECT_DOC.md` for comprehensive documentation.

### Database Schema
See `shared/schema.ts` for complete Drizzle schema.

### API Reference
See `server/routes.ts` for all endpoints (search for `app.get`, `app.post`, etc.)

### UI Components
See `client/src/components/ui/` for shadcn components
See `client/src/components/` for custom components

### Test Credentials (Dev Only)
- Admin: `admin@commerzio.online` / (check ADMIN_PASSWORD env var)
- Test users: `xxx@email.ch` / `TestPass123!`
