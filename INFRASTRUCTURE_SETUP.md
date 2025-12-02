# Commerzio Infrastructure Setup & Migration Guide

**Last Updated:** December 2, 2025  
**Status:** In Progress

---

## 🌐 Domain Information

| Domain | Provider | DNS | Status |
|--------|----------|-----|--------|
| **commerzio.online** | Hostinger | Cloudflare | ✅ Active |

### Planned Subdomains
| Subdomain | Purpose | Points To | Status |
|-----------|---------|-----------|--------|
| `commerzio.online` | Redirect to services | Cloudflare Redirect Rule | ⏳ To configure |
| `services.commerzio.online` | Frontend | Vercel | ⏳ To configure |
| `api.commerzio.online` | Backend API | Railway | ⏳ To configure |
| `cdn.commerzio.online` | R2 Storage | Cloudflare R2 | ⏳ To configure |

### R2 Bucket Configuration
| Setting | Value |
|---------|-------|
| **Bucket Name** | `commerzios-uploads` |
| **Location** | Eastern Europe (EEUR) |
| **S3 API Endpoint** | `https://727912cc4ae2b3ac7be6902314cdf01d.r2.cloudflarestorage.com` |
| **Custom Domain** | `cdn.commerzio.online` (to be added) |
| **Account ID** | `727912cc4ae2b3ac7be6902314cdf01d` |

### R2 Code Migration Status
| Task | Status |
|------|--------|
| Created `server/r2Storage.ts` | ✅ Done |
| Updated routes.ts to use R2 | ✅ Done |
| Installed AWS S3 SDK | ✅ Done |
| CORS Policy configured | ⏳ Pending |
| Custom domain added | ⏳ Pending |
| API token created | ✅ Done |

---

## Current Infrastructure Overview

| Component | Current Provider | Target Provider | Status |
|-----------|-----------------|-----------------|--------|
| **Frontend** | ~~Render~~ → Vercel | Vercel | ✅ Migrated |
| **Backend** | Render (unconfirmed) | Railway (recommended) | ❓ Needs Decision |
| **Database** | Neon (PostgreSQL Serverless) | Neon | ✅ Configured |
| **Object Storage** | Replit Object Storage (GCS) | Cloudflare R2 | ❌ Needs Migration |
| **DNS** | Cloudflare | Cloudflare | ✅ Active |
| **Domain** | Hostinger | Hostinger | ✅ Active |
| **CDN/Security** | Cloudflare (100 firewall rules) | Cloudflare | ✅ Active |

### Previous Setup (Before Migration)
- **Development**: `localhost:5000` (full-stack on single port)
- **Production**: Render (both frontend + backend deployed together)

---

## Backend Hosting Recommendation

### Recommended: Railway
| Environment | Branch | Purpose |
|-------------|--------|---------|
| **Production** | `main` | Live users |
| **Staging** | `staging` | Pre-live testing |
| **PR Previews** | Any PR | Feature testing |

**Why Railway over alternatives:**
- ✅ Native Node.js/Express support
- ✅ Automatic PR preview environments
- ✅ WebSocket support (needed for chat feature)
- ✅ Simple GitHub integration
- ✅ ~$5-20/month pricing
- ✅ Environment variables per environment

**Why NOT Hostinger:**
- ❌ Business Package is PHP shared hosting (no Node.js)
- ❌ Would need VPS upgrade + manual server management
- ❌ Not worth the complexity when Railway handles it automatically

---

## Session 1: December 2, 2025

### Discussion Summary

1. **Frontend Migration (Render → Vercel)**: Completed by user
2. **Backend Hosting**: Hostinger Business Package with 100 firewall rules
3. **Database**: Neon PostgreSQL Serverless (already configured via `@neondatabase/serverless`)
4. **Object Storage Migration Needed**: Currently using Replit's Object Storage (Google Cloud Storage via sidecar endpoint at `127.0.0.1:1106`). Needs migration to Cloudflare R2.
5. **DNS**: Already on Cloudflare

---

## ✅ Session 1 Completed Tasks (December 2, 2025)

### Code Changes Made:
1. ✅ Created `server/r2Storage.ts` - New Cloudflare R2 storage service
2. ✅ Updated `server/routes.ts` - Now imports from r2Storage instead of objectStorage
3. ✅ Updated `server/routes.test.ts` - Mocks updated for r2Storage
4. ✅ Installed `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`
5. ✅ Created `.env.example` - Template with all required environment variables
6. ✅ All tests passing
7. ✅ TypeScript compiles without errors

### Required Environment Variables for R2:
```env
R2_ACCOUNT_ID=727912cc4ae2b3ac7be6902314cdf01d
R2_ACCESS_KEY_ID=<your-access-key-id>
R2_SECRET_ACCESS_KEY=<your-secret-access-key>
R2_BUCKET_NAME=commerzios-uploads
R2_PUBLIC_URL=https://cdn.commerzio.online
```

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
