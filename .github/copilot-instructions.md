# Copilot Instructions for Commerzio Services

This repository contains Commerzio Services, a full-stack TypeScript service marketplace platform.

## Project Overview

A multi-vendor service marketplace with:
- **Frontend**: React 19 with TypeScript, Vite, TailwindCSS, and shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Testing**: Vitest with React Testing Library

## Project Structure

```
client/         # React frontend application
  src/
    components/ # UI components (shadcn/ui based)
    hooks/      # Custom React hooks
    lib/        # Utility functions
    pages/      # Page components
    test/       # Test setup and utilities
server/         # Express backend API
  middleware/   # Express middleware
  services/     # Business logic services
  validators/   # Request validation
  utils/        # Utility functions
shared/         # Shared TypeScript types and schema
  schema.ts     # Drizzle ORM database schema
```

## Tech Stack

- **TypeScript**: Strict mode enabled, ES2020 target
- **React**: Version 19 with hooks-based patterns
- **TailwindCSS**: Version 4 with CSS-first configuration
- **Drizzle ORM**: PostgreSQL database with Zod validation
- **Vite**: Build tool and dev server
- **ESLint**: TypeScript-aware linting

## Development Commands

```bash
npm run dev          # Start development server (backend + frontend)
npm run dev:client   # Start only frontend dev server
npm run build        # Build for production
npm run check        # TypeScript type checking
npm run lint         # Run ESLint
npm run lint:fix     # Run ESLint with auto-fix
npm run test         # Run tests with Vitest
npm run test:watch   # Run tests in watch mode
npm run db:push      # Push database schema changes
```

## Coding Conventions

### TypeScript
- Use strict TypeScript with explicit typing
- Prefer interfaces for object shapes, types for unions/primitives
- Use path aliases: `@/*` for `client/src/*`, `@shared/*` for `shared/*`
- Avoid `any` types; use `unknown` when type is uncertain

### React Components
- Use functional components with hooks
- Follow React hooks rules (enforced by eslint-plugin-react-hooks)
- Use shadcn/ui components from `@/components/ui`
- Handle loading and error states explicitly

### API Routes
- Express routes are defined in `server/routes.ts`
- Use async/await for database operations
- Validate requests with Zod schemas
- Return consistent JSON response structures

### Database
- Schema is defined in `shared/schema.ts` using Drizzle ORM
- Use `createInsertSchema` from drizzle-zod for validation
- Relations are defined using Drizzle's `relations` helper
- Use transactions for multi-table operations

### Testing
- Tests use Vitest and React Testing Library
- Test files use `.test.ts` or `.test.tsx` extension
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external services and API calls

## Security Guidelines

- Never commit secrets or API keys
- Environment variables go in `.env` (not tracked)
- Use bcrypt for password hashing (cost factor 12)
- Validate all user inputs with Zod schemas
- Use parameterized queries (Drizzle handles this)
- Enable CSRF protection for OAuth flows

## Code Style

- Use ESLint configuration in `eslint.config.js`
- Prefix unused variables with underscore (`_unused`)
- Prefer named exports over default exports
- Keep components small and focused
- Extract reusable logic into custom hooks

## When Making Changes

1. Run `npm run check` to verify TypeScript types
2. Run `npm run lint` to check code style
3. Run `npm run test` to verify tests pass
4. Run `npm run build` to verify production build works
