# TypeScript Errors - Cleanup Required

## Summary
73 TypeScript errors remain after initial cleanup. These are pre-existing issues that need addressing for production builds.

## Error Distribution
| File | Count | Main Issues |
|------|-------|-------------|
| `server/routes.ts` | 13 | User type mismatches, property references |
| Client pages | 12 | Component type mismatches |
| Modular route files | ~8 | Schema import errors |

## Root Causes
1. **Schema Property Names**: Code references non-existent properties (e.g., `displayName`, `username`, `profileImage`)
2. **Notification Types**: Custom types like `payment_reminder`, `booking_cancelled` not in schema enum
3. **Missing Schema Exports**: Some files import tables not exported from `@shared/schema`

## Fixed in This Session (33+)
- [x] Q&A user field mappings in routes.ts
- [x] comPointsService.ts status and notification types
- [x] bookingPaymentProtocol.ts notification types and fields
- [x] profile.tsx, authService.ts, swissVerificationService.ts, ProposalBuilder.tsx, i18n/index.ts

## Priority
Medium - Dev server runs fine, but production builds will fail.

## Labels
- bug
- typescript
- cleanup
