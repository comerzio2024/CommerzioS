# Commerzio Services - Technology Stack

## Programming Languages & Versions
- **TypeScript 5.6.3**: Primary language for type-safe development across frontend and backend
- **JavaScript (ES2020)**: Target compilation for broad browser compatibility
- **Node.js >=20.19.0**: Server runtime environment

## Frontend Technology Stack

### Core Framework
- **React 19.2.0**: Latest React with concurrent features and improved performance
- **Vite 7.1.9**: Fast build tool with hot module replacement and optimized bundling
- **Wouter 3.3.5**: Lightweight routing library for single-page application navigation

### UI & Styling
- **Tailwind CSS 4.1.14**: Utility-first CSS framework with custom design system
- **Radix UI**: Comprehensive component library for accessible UI primitives
- **Framer Motion 12.23.24**: Animation library for smooth user interactions
- **Lucide React 0.545.0**: Icon library with consistent design language

### State Management & Data Fetching
- **TanStack Query 5.60.5**: Server state management with caching and synchronization
- **React Hook Form 7.66.0**: Performant form handling with minimal re-renders
- **Zod 3.25.76**: Runtime type validation and schema definition

### Development Tools
- **Vite Plugin React 5.0.4**: React integration for Vite build system
- **TypeScript ESLint 8.48.0**: Code linting and formatting
- **Autoprefixer 10.4.21**: CSS vendor prefix automation

## Backend Technology Stack

### Core Framework
- **Express.js 4.21.2**: Web application framework for Node.js
- **TypeScript**: Type-safe server-side development
- **TSX 4.20.5**: TypeScript execution for development

### Database & ORM
- **PostgreSQL**: Primary database with ACID compliance
- **Drizzle ORM 0.39.1**: Type-safe database toolkit with migration support
- **Drizzle Kit 0.31.4**: Database migration and introspection tools
- **Neon Serverless 0.10.4**: Serverless PostgreSQL database connector

### Authentication & Security
- **Passport.js 0.7.0**: Authentication middleware with strategy support
- **bcrypt 5.1.1**: Password hashing with salt rounds
- **Express Session 1.18.1**: Session management with PostgreSQL storage
- **CORS 2.8.5**: Cross-origin resource sharing configuration

### External Integrations
- **Stripe 20.0.0**: Payment processing and subscription management
- **OpenAI 6.9.1**: AI-powered content analysis and generation
- **Nodemailer 6.9.16**: Email service integration
- **Web Push 3.6.7**: Browser push notification support
- **Google Auth Library 10.5.0**: Google OAuth integration

### File Storage & Media
- **AWS SDK S3 3.943.0**: Cloud storage for images and documents
- **Sharp 0.34.5**: High-performance image processing
- **Google Cloud Storage 7.17.3**: Alternative cloud storage option

## Development & Build Tools

### Build System
- **Vite**: Frontend development server and production bundler
- **esbuild 0.25.0**: Fast JavaScript bundler for backend compilation
- **PostCSS 8.5.6**: CSS processing and transformation

### Testing Framework
- **Vitest 4.0.14**: Unit testing framework with Vite integration
- **Playwright 1.57.0**: End-to-end testing for web applications
- **Testing Library React 16.3.0**: React component testing utilities
- **Supertest 7.1.4**: HTTP assertion library for API testing

### Code Quality
- **ESLint 9.39.1**: JavaScript/TypeScript linting
- **TypeScript ESLint**: TypeScript-specific linting rules
- **Cross-env 7.0.3**: Cross-platform environment variable handling

### Package Management
- **npm**: Primary package manager
- **pnpm**: Alternative package manager for faster installs
- **dotenv-cli 7.4.0**: Environment variable management

## Development Commands

### Core Development
```bash
npm run dev              # Start development server (backend + frontend)
npm run dev:client       # Start only frontend development server
npm run build           # Build for production
npm start              # Start production server
```

### Database Operations
```bash
npm run db:push         # Push schema changes to database
npm run db:studio       # Open Drizzle Studio for database management
npm run db:reset        # Reset and seed database
```

### Testing & Quality
```bash
npm run test            # Run unit tests
npm run test:e2e        # Run end-to-end tests
npm run test:coverage   # Generate test coverage report
npm run lint            # Run code linting
npm run check          # TypeScript type checking
```

## Environment Configuration

### Required Environment Variables
- **DATABASE_URL**: PostgreSQL connection string
- **SESSION_SECRET**: Secure session encryption key
- **PORT**: Server port (default: 5000)
- **APP_URL**: Application base URL

### Optional Integrations
- **OPENAI_API_KEY**: AI features and content moderation
- **STRIPE_SECRET_KEY**: Payment processing
- **GOOGLE_MAPS_API_KEY**: Location services
- **SMTP_***: Email service configuration
- **TWILIO_***: SMS verification
- **VAPID_***: Push notification keys

## Production Deployment

### Build Process
1. **Frontend Build**: Vite optimizes and bundles React application
2. **Backend Build**: esbuild compiles TypeScript server code
3. **Asset Optimization**: Images and static files are processed
4. **Type Checking**: Full TypeScript compilation validation

### Runtime Requirements
- **Node.js 20+**: Server runtime environment
- **PostgreSQL**: Database server
- **SSL Certificates**: HTTPS in production
- **Environment Variables**: All required configuration set

### Performance Optimizations
- **Code Splitting**: Automatic route-based code splitting
- **Tree Shaking**: Unused code elimination
- **Asset Compression**: Gzip/Brotli compression
- **Database Indexing**: Optimized query performance
- **CDN Integration**: Static asset delivery