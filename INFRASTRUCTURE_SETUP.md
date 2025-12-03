# Commerzio Infrastructure Setup & Migration Guide

**Last Updated:** December 2, 2025  
**Status:** In Progress - Split Architecture Implementation

---

## 🏗️ Architecture Overview

**Split Architecture (Implemented)**
- **Frontend**: Vercel (services.commerzio.online)
- **Backend**: Railway (api.commerzio.online)
- **Database**: Neon PostgreSQL Serverless
- **Storage**: Cloudflare R2 (cdn.commerzio.online)
- **DNS**: Cloudflare

---

## 🌐 Domain Information

| Domain | Provider | DNS | Status |
|--------|----------|-----|--------|
| **commerzio.online** | Hostinger | Cloudflare | ✅ Active |

### Subdomains
| Subdomain | Purpose | Points To | Status |
|-----------|---------|-----------|--------|
| `commerzio.online` | Redirect to services | Cloudflare Redirect Rule | ⏳ To configure |
| `services.commerzio.online` | Frontend | Vercel | ⏳ To configure |
| `api.commerzio.online` | Backend API | Railway | ⏳ To configure |
| `cdn.commerzio.online` | R2 Storage | Cloudflare R2 | ⏳ To configure |

---

## ⚙️ Environment Variables

### Railway Backend (api.commerzio.online)
```env
# Required
DATABASE_URL=postgresql://...@neon.tech/neondb?sslmode=require
SESSION_SECRET=your-secure-secret-32-chars
NODE_ENV=production
PORT=5000

# Split Architecture
APP_URL=https://api.commerzio.online
FRONTEND_URL=https://services.commerzio.online
CROSS_DOMAIN_AUTH=true
COOKIE_DOMAIN=.commerzio.online

# R2 Storage
R2_ACCOUNT_ID=727912cc4ae2b3ac7be6902314cdf01d
R2_ACCESS_KEY_ID=your-key
R2_SECRET_ACCESS_KEY=your-secret
R2_BUCKET_NAME=commerzios-uploads
R2_PUBLIC_URL=https://cdn.commerzio.online

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OAuth (callback URLs must use api.commerzio.online)
GOOGLE_CLIENT_ID=your-id
GOOGLE_CLIENT_SECRET=your-secret
TWITTER_CLIENT_ID=your-id
TWITTER_CLIENT_SECRET=your-secret
FACEBOOK_APP_ID=your-id
FACEBOOK_APP_SECRET=your-secret

# Email
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=your-email
SMTP_PASSWORD=your-password
EMAIL_FROM=noreply@commerzio.online
```

### Vercel Frontend (services.commerzio.online)
```env
VITE_API_URL=https://api.commerzio.online
```

---

## 📋 OAuth Provider Configuration

### Google Cloud Console
Update authorized redirect URIs:
- `https://api.commerzio.online/api/auth/google/callback`

### Twitter Developer Portal
Update callback URL:
- `https://api.commerzio.online/api/auth/twitter/callback`

### Facebook Developer Console
Update Valid OAuth Redirect URIs:
- `https://api.commerzio.online/api/auth/facebook/callback`

---

## 🔐 Cross-Domain Authentication

The split architecture requires special cookie configuration:

| Setting | Value | Purpose |
|---------|-------|---------|
| `sameSite` | `none` | Allow cookies with cross-origin requests |
| `secure` | `true` | Required for sameSite=none |
| `domain` | `.commerzio.online` | Share cookies across subdomains |

**Important**: The cookie domain `.commerzio.online` (with leading dot) allows cookies to be shared between `services.commerzio.online` and `api.commerzio.online`.

---

## ✅ Session 2: Split Architecture Implementation

### Code Changes Made
| File | Change | Status |
|------|--------|--------|
| `client/src/lib/config.ts` | NEW - API_BASE_URL and fetchApi helper | ✅ Done |
| `client/src/lib/queryClient.ts` | Updated to use getApiUrl for /api paths | ✅ Done |
| `client/src/lib/imageUpload.ts` | Updated to use fetchApi | ✅ Done |
| `client/src/lib/geocoding.ts` | Updated to use fetchApi | ✅ Done |
| `client/src/components/layout.tsx` | Updated logout to use fetchApi | ✅ Done |
| `client/src/pages/chat.tsx` | Updated to use fetchApi | ✅ Done |
| `client/src/components/notifications/NotificationBell.tsx` | Updated to use fetchApi | ✅ Done |
| `server/index.ts` | Added CORS middleware for cross-domain | ✅ Done |
| `server/auth.ts` | Updated session cookies for cross-domain | ✅ Done |
| `server/oauthProviders.ts` | Updated redirects to use FRONTEND_URL | ✅ Done |
| `.env.example` | Added FRONTEND_URL, CROSS_DOMAIN_AUTH, COOKIE_DOMAIN | ✅ Done |

### Packages Installed
- `cors` and `@types/cors` - CORS middleware for Express

### Remaining Direct Fetch Calls
Some components still have direct `fetch('/api/...')` calls. The `fetchApi` helper is available - pattern is established. These files can be updated:
- `client/src/pages/profile.tsx` (6 calls)
- `client/src/pages/notifications.tsx` (2 calls)  
- `client/src/pages/referrals.tsx` (1 call)
- `client/src/pages/book-service.tsx` (2 calls)
- `client/src/pages/vendor-bookings.tsx` (1 call)
- Various component files (~20 more calls)

**Note**: TanStack Query fetches go through `queryClient.ts` which handles the base URL. Direct fetch calls will work if CORS is properly configured.

---

## 🔴 Critical Issues Identified

### 1. Object Storage Dependency on Replit
The current `server/objectStorage.ts` is **tightly coupled to Replit's infrastructure**:
- Uses `http://127.0.0.1:1106` (Replit sidecar endpoint)
- Uses `@google-cloud/storage` with Replit-specific external account credentials
- Will NOT work on Hostinger without migration

**Files Affected:**
- `server/objectStorage.ts` - Main storage service
- `server/objectAcl.ts` - Access control logic
- Any routes handling file uploads

### 2. Replit-Specific Vite Plugins
The `vite.config.ts` includes Replit plugins that should be removed for production:
- `@replit/vite-plugin-cartographer`
- `@replit/vite-plugin-dev-banner`
- `@replit/vite-plugin-runtime-error-modal`

### 3. Environment Variables Needed
Missing environment variables for new infrastructure:
- Cloudflare R2 credentials
- Vercel deployment variables
- Hostinger-specific configurations

---

## 📋 Action Items

### Phase 1: Cloudflare R2 Setup
- [ ] Create R2 bucket in Cloudflare dashboard
- [ ] Generate R2 API tokens (Access Key ID + Secret Access Key)
- [ ] Configure CORS policy for the bucket
- [ ] Set up custom domain for R2 (optional but recommended)

### Phase 2: Code Migration for R2
- [ ] Replace `@google-cloud/storage` with AWS S3 SDK (R2 is S3-compatible)
- [ ] Update `server/objectStorage.ts` for R2 compatibility
- [ ] Update `server/objectAcl.ts` for R2 bucket policies
- [ ] Test file upload/download flows

### Phase 3: Vercel Configuration
- [ ] Configure environment variables in Vercel dashboard
- [ ] Set up build command: `npm run build`
- [ ] Set output directory: `dist/public`
- [ ] Configure API rewrites (if running backend separately)

### Phase 4: Hostinger Backend Setup
- [ ] Configure Node.js environment on Hostinger
- [ ] Set up environment variables
- [ ] Configure domain/subdomain for API (e.g., `api.yourdomain.com`)
- [ ] Set up SSL certificates
- [ ] Configure firewall rules

### Phase 5: DNS Configuration
- [ ] Point frontend domain to Vercel
- [ ] Point API subdomain to Hostinger
- [ ] Configure Cloudflare proxy settings
- [ ] Set up SSL/TLS mode (Full Strict recommended)

---

## 📦 Dependency Analysis

### Current Dependencies for Storage
```json
{
  "@google-cloud/storage": "^7.17.3"  // TO BE REPLACED
}
```

### Required Dependencies for R2
```json
{
  "@aws-sdk/client-s3": "^3.x.x",
  "@aws-sdk/s3-request-presigner": "^3.x.x"
}
```

---

## 🔧 Environment Variables Template

### Vercel (Frontend)
```env
# If frontend needs API URL
VITE_API_URL=https://api.yourdomain.com
```

### Hostinger (Backend)
```env
# Database
DATABASE_URL=postgresql://user:pass@host/db

# Session
SESSION_SECRET=your-secure-secret

# Cloudflare R2
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://your-bucket.yourdomain.com

# Email
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=info@yourdomain.com
SMTP_PASSWORD=your-password
EMAIL_FROM=info@yourdomain.com

# OpenAI (if using AI features)
OPENAI_API_KEY=your-key

# Stripe (if using payments)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# OAuth (optional)
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
```

---

## 🌐 Recommended DNS Configuration

```
Type    Name           Content                    Proxy Status
A       @              Vercel IP                  Proxied (orange)
A       www            Vercel IP                  Proxied (orange)
A       api            Hostinger IP               Proxied (orange)
CNAME   storage        your-r2-bucket.r2.dev     Proxied (orange)
```

---

## 📊 Repository Assessment

### Recent PRs Merged (from Git history):
1. **#18** - Escrow auto-release service
2. **#17** - Extended pricing schema with security
3. **#15** - Fixed linting errors in Google Maps
4. **#14** - Fixed TypeScript error in booking form
5. **#13** - Fixed React linting errors

### Open/Unmerged Branches:
- `copilot/add-automated-testing-infrastructure`
- `copilot/add-twint-payment-option`
- `copilot/create-e2e-test-suite`
- `copilot/fix-eslint-zod-validation-error`
- `copilot/fix-function-naming-conventions`
- `copilot/fix-home-page-map-issues`
- `copilot/remove-replit-oauth-references` (⚠️ Important for migration!)

### Code Quality Notes:
- ✅ TypeScript throughout (frontend + backend)
- ✅ Using Drizzle ORM with Zod validation
- ✅ Proper session management with PostgreSQL storage
- ✅ Rate limiting implemented
- ⚠️ Replit-specific code needs removal
- ⚠️ Object storage needs complete rewrite for R2

---

## Next Steps

1. **Immediate**: Create R2 bucket and get credentials
2. **This Week**: Rewrite `objectStorage.ts` for R2 compatibility
3. **This Week**: Clean up Replit-specific code
4. **Next**: Configure Hostinger Node.js environment
5. **Next**: Set up proper CI/CD pipeline

---

## Questions to Resolve

1. What domain will be used for the API? (e.g., `api.commerzio.ch`)
2. What domain for object storage? (e.g., `cdn.commerzio.ch` or `storage.commerzio.ch`)
3. Should we use Cloudflare Workers for any edge logic?
4. Do you need to migrate existing files from Replit storage?

---

*This document will be updated as we progress through the migration.*
