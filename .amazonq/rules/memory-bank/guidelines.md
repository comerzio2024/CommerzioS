# Commerzio Services - Development Guidelines

## Code Quality Standards

### TypeScript Usage Patterns
- **Strict Type Safety**: All files use strict TypeScript with explicit type definitions
- **Interface Definitions**: Complex data structures defined as interfaces (e.g., `FormData`, `PricingBreakdown`, `TestState`)
- **Type Guards**: Runtime type validation using Zod schemas for API boundaries
- **Generic Types**: Extensive use of generics for reusable components and functions
- **Union Types**: Discriminated unions for state management (e.g., `PricingType = "fixed" | "list" | "text"`)

### Error Handling Conventions
- **Try-Catch Blocks**: Comprehensive error handling with specific error types
- **Graceful Degradation**: Functions return null/default values on failure rather than throwing
- **Error Logging**: Consistent console.error logging with contextual information
- **User-Friendly Messages**: API errors translated to user-readable toast notifications
- **Fallback Mechanisms**: Multiple fallback strategies (e.g., bypass → API → defaults)

### Documentation Standards
- **JSDoc Comments**: Extensive function documentation with parameter descriptions
- **Inline Comments**: Complex business logic explained with detailed comments
- **Architecture Comments**: High-level system design documented in file headers
- **TODO/FIXME**: Clear action items with context and priority indicators
- **Code Examples**: Documentation includes usage examples and expected outputs

## Structural Conventions

### File Organization Patterns
- **Feature-Based Structure**: Related functionality grouped in dedicated directories
- **Separation of Concerns**: Clear separation between UI components, business logic, and data access
- **Shared Resources**: Common types and schemas in dedicated `shared/` directory
- **Service Layer**: Business logic encapsulated in service classes with single responsibilities
- **Utility Functions**: Helper functions organized by domain (validation, formatting, etc.)

### Naming Conventions
- **Descriptive Names**: Functions and variables use clear, descriptive names
- **Consistent Prefixes**: Related functions share common prefixes (e.g., `create*`, `validate*`, `notify*`)
- **Event Handlers**: UI event handlers prefixed with `handle` (e.g., `handleSubmit`, `handleFieldBlur`)
- **State Variables**: Boolean state uses `is*`, `has*`, `should*` prefixes
- **Constants**: All caps with underscores for configuration constants

### Component Architecture
- **Functional Components**: React components use hooks pattern exclusively
- **Custom Hooks**: Reusable logic extracted into custom hooks (e.g., `useAuth`, `useToast`)
- **Props Interfaces**: All component props explicitly typed with interfaces
- **State Management**: Local state with useState, global state with context/query client
- **Ref Usage**: Strategic use of refs for DOM manipulation and value persistence

## API Design Patterns

### Request/Response Structure
- **Consistent Endpoints**: RESTful API design with predictable URL patterns
- **Status Codes**: Proper HTTP status codes for different response types
- **Error Responses**: Standardized error response format with message and context
- **Pagination**: Consistent pagination pattern with limit/offset parameters
- **Filtering**: Query parameters for filtering and sorting data

### Authentication & Authorization
- **Session-Based Auth**: Express sessions with secure cookie configuration
- **Role-Based Access**: User roles (customer, vendor, admin) with appropriate permissions
- **Request Context**: Authenticated user context passed through request pipeline
- **API Protection**: Protected routes with authentication middleware
- **CSRF Protection**: Cross-site request forgery protection for state-changing operations

### Data Validation
- **Input Sanitization**: All user inputs validated and sanitized
- **Schema Validation**: Zod schemas for runtime type checking
- **Business Rules**: Domain-specific validation rules enforced at service layer
- **Error Aggregation**: Multiple validation errors collected and returned together
- **Client-Side Validation**: Immediate feedback with server-side validation as source of truth

## Database Patterns

### ORM Usage (Drizzle)
- **Type-Safe Queries**: Database queries use Drizzle's type-safe query builder
- **Schema Definitions**: Database schema defined in TypeScript with proper relationships
- **Migration Management**: Schema changes managed through migration files
- **Query Optimization**: Efficient queries with proper indexing and joins
- **Transaction Handling**: Database transactions for multi-step operations

### Data Modeling
- **Normalized Structure**: Proper database normalization with foreign key relationships
- **Audit Fields**: Created/updated timestamps on all entities
- **Soft Deletes**: Logical deletion with flags rather than hard deletes
- **Status Enums**: State management using enum fields with clear transitions
- **JSON Fields**: Complex data stored as JSON with proper typing

## Testing Strategies

### End-to-End Testing
- **Serial Test Execution**: Tests run in sequence to maintain state dependencies
- **State Management**: Global test state object persists data across test phases
- **Bypass System**: Test utilities for creating prerequisite data
- **Graceful Skipping**: Tests skip when prerequisites aren't met with clear logging
- **Comprehensive Coverage**: Full user journeys tested from authentication to completion

### Test Organization
- **Phase-Based Structure**: Tests organized into logical phases (setup, booking, reviews, etc.)
- **Descriptive Names**: Test names clearly describe the action and expected outcome
- **Setup/Teardown**: Proper test environment setup and cleanup
- **Mock Data**: Consistent test data with realistic scenarios
- **Error Scenarios**: Both success and failure paths tested

## Performance Optimization

### Frontend Performance
- **Code Splitting**: Route-based code splitting for optimal bundle sizes
- **Lazy Loading**: Components and resources loaded on demand
- **Memoization**: React.memo and useMemo for expensive computations
- **Query Optimization**: TanStack Query for efficient data fetching and caching
- **Image Optimization**: Proper image handling with compression and lazy loading

### Backend Performance
- **Database Indexing**: Strategic database indexes for query performance
- **Connection Pooling**: Efficient database connection management
- **Caching Strategies**: In-memory caching for frequently accessed data
- **Async Operations**: Non-blocking operations for I/O intensive tasks
- **Resource Management**: Proper cleanup of resources and connections

## Security Best Practices

### Input Validation
- **SQL Injection Prevention**: Parameterized queries and ORM usage
- **XSS Protection**: Input sanitization and output encoding
- **CSRF Protection**: Anti-CSRF tokens for state-changing operations
- **Rate Limiting**: API endpoint protection against abuse
- **File Upload Security**: Secure file handling with type and size validation

### Data Protection
- **Password Hashing**: bcrypt with appropriate salt rounds
- **Sensitive Data**: Proper handling of PII and financial information
- **Session Security**: Secure session configuration with appropriate timeouts
- **HTTPS Enforcement**: SSL/TLS for all production communications
- **Environment Variables**: Sensitive configuration stored securely

## Code Style Guidelines

### Formatting Standards
- **Consistent Indentation**: 2-space indentation throughout codebase
- **Line Length**: Reasonable line length with proper wrapping
- **Semicolons**: Consistent semicolon usage in TypeScript
- **Quotes**: Single quotes for strings, double quotes for JSX attributes
- **Trailing Commas**: Trailing commas in multi-line structures

### Code Organization
- **Import Ordering**: Logical import organization (external, internal, relative)
- **Export Patterns**: Consistent export patterns (named exports preferred)
- **Function Organization**: Related functions grouped together
- **Constant Definitions**: Constants defined at module top
- **Type Definitions**: Types and interfaces defined before usage

## Development Workflow

### Version Control
- **Commit Messages**: Descriptive commit messages with context
- **Branch Strategy**: Feature branches with meaningful names
- **Code Reviews**: Peer review process for quality assurance
- **Merge Strategy**: Clean merge history with squashed commits
- **Tag Management**: Proper version tagging for releases

### Development Environment
- **Environment Parity**: Development environment matches production
- **Configuration Management**: Environment-specific configuration
- **Dependency Management**: Locked dependency versions for consistency
- **Build Process**: Automated build and deployment pipeline
- **Quality Gates**: Automated testing and linting in CI/CD

## AI Integration Patterns

### AI Service Usage
- **Graceful Fallbacks**: AI services degrade gracefully when unavailable
- **Error Handling**: Comprehensive error handling for AI API failures
- **Rate Limiting**: Respect AI service rate limits and quotas
- **Response Validation**: AI responses validated before use
- **User Control**: Users can override AI suggestions

### AI-Powered Features
- **Content Generation**: AI assists with content creation (titles, descriptions)
- **Categorization**: Intelligent service categorization and tagging
- **Prioritization**: AI-powered notification and content prioritization
- **Quality Assurance**: AI-assisted content moderation and validation
- **User Experience**: AI enhances UX without replacing user control