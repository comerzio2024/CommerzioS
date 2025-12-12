# Claude Opus 4.5 - Commerzio Services UX Redesign Implementation

## Context & Mission
You are taking over the **Commerzio Services** project - a sophisticated multi-vendor service marketplace built for the Swiss market. Your mission is to implement strategic UX redesigns and code structure improvements based on the **vercel-design** folder mockups.

## Visual Design Reference
The `/vercel-design` folder contains the target design system and UX patterns. Key visual improvements include:

### 🎨 Design System (Already Implemented)
- **Modern gradient aesthetics**: Primary to accent gradients throughout
- **Glass morphism**: Backdrop blur effects on navigation and modals
- **Micro-interactions**: Hover animations, scale transforms, smooth transitions
- **Mobile-first components**: Bottom sheets, swipe gestures, touch-optimized

### 📱 Mobile-First Components (Created)
1. **`/vercel-design/app/booking/wizard/page.tsx`** - Simplified 3-step booking wizard
2. **`/vercel-design/components/mobile-bottom-sheet.tsx`** - Service details sheet
3. **`/vercel-design/components/smart-notifications.tsx`** - Grouped notifications with swipe actions
4. **`/vercel-design/components/quick-actions-bar.tsx`** - Floating action button with quick access

## Implementation Priorities

### 1. Booking Flow Redesign (CRITICAL)
**Current Problem**: Complex 3-tab modal in `client/src/components/service-form-modal.tsx` (2000+ lines)

**Target Solution**: Progressive disclosure wizard (see `/vercel-design/app/booking/wizard/page.tsx`)

**Key Improvements**:
- **Step 1**: Quick date/time selection with smart defaults
- **Step 2**: Location & contact details with AI auto-fill
- **Step 3**: Payment with escrow protection emphasis
- **Mobile-first**: Bottom sheets instead of modals
- **Progress tracking**: Visual progress bar and step indicators
- **Smart validation**: Only validate current step, allow partial saves

**Implementation Steps**:
1. Create new `BookingWizard` component based on vercel-design mockup
2. Extract booking logic from service-form-modal into reusable hooks
3. Implement progressive disclosure with smooth animations
4. Add mobile-responsive bottom sheet navigation
5. Integrate AI quick-setup functionality

### 2. Service Discovery UX (HIGH PRIORITY)
**Current**: Traditional category browsing
**Target**: Intent-based discovery with AI matching

**New Components to Create**:
```typescript
// Smart search with AI matching
<SmartServiceSearch 
  onIntent={(intent) => showMatchedServices(intent)}
  placeholder="What do you need help with?"
/>

// Service cards with bottom sheet details
<ServiceCard 
  service={service}
  onQuickBook={() => openBookingWizard(service)}
  onViewDetails={() => openServiceSheet(service)}
/>
```

### 3. Mobile-First Navigation (HIGH PRIORITY)
**Replace modals with bottom sheets** throughout the app:

**Implementation Pattern**:
```typescript
// Replace Dialog with Sheet for mobile
const isMobile = useMediaQuery("(max-width: 768px)")

return isMobile ? (
  <Sheet>
    <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
      {content}
    </SheetContent>
  </Sheet>
) : (
  <Dialog>
    <DialogContent className="max-w-2xl">
      {content}
    </DialogContent>
  </Dialog>
)
```

### 4. Smart Notifications System (MEDIUM PRIORITY)
**Current**: Basic notification list
**Target**: Grouped, prioritized notifications with quick actions

**Key Features** (see `/vercel-design/components/smart-notifications.tsx`):
- **Grouping**: Related notifications bundled together
- **Priority-based sorting**: High priority notifications at top
- **Quick actions**: Mark read, dismiss, navigate without opening
- **Swipe gestures**: Swipe to dismiss or mark read
- **Smart filtering**: All, Unread, Priority tabs

### 5. Quick Actions System (MEDIUM PRIORITY)
**Add floating action button** with contextual quick actions:

**Features** (see `/vercel-design/components/quick-actions-bar.tsx`):
- **Floating FAB**: Always accessible quick actions
- **Contextual actions**: Book again, message vendors, leave reviews
- **AI integration**: "Tell us what you need" quick booking
- **Recent services**: One-tap rebooking

## Code Structure Improvements

### 1. Service Layer Consolidation
**Current**: 20+ scattered service files
**Target**: Domain-driven architecture

```
server/
├── domains/
│   ├── booking/
│   │   ├── booking.service.ts
│   │   ├── booking.types.ts
│   │   ├── booking.validation.ts
│   │   └── index.ts
│   ├── notification/
│   │   ├── notification.service.ts
│   │   ├── notification.grouping.ts
│   │   ├── notification.priority.ts
│   │   └── index.ts
│   └── payment/
├── shared/
│   ├── types/
│   └── utils/
```

### 2. API Response Standardization
```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    hasMore?: boolean;
  };
  errors?: Array<{
    field?: string;
    message: string;
    code?: string;
  }>;
}
```

### 3. Mobile-First Hook Pattern
```typescript
// Create reusable mobile detection hook
export const useMobileLayout = () => {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const isTablet = useMediaQuery("(max-width: 1024px)")
  
  return {
    isMobile,
    isTablet,
    preferBottomSheet: isMobile,
    maxModalWidth: isMobile ? "100%" : "600px"
  }
}
```

## Visual Design Patterns (From vercel-design)

### 1. Gradient System
```css
/* Primary gradients */
.gradient-primary {
  background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%);
}

/* Card hover effects */
.card-hover {
  transition: all 0.3s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
  }
}
```

### 2. Glass Morphism
```css
.glass-effect {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

### 3. Mobile-First Spacing
```css
/* Touch-friendly spacing */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}

/* Mobile-optimized padding */
.mobile-padding {
  padding: 1rem;
}

@media (min-width: 768px) {
  .mobile-padding {
    padding: 2rem;
  }
}
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
1. **Service layer restructure** - Group related services into domains
2. **API standardization** - Implement consistent response format
3. **Mobile detection hooks** - Create responsive layout utilities

### Phase 2: Booking Redesign (Week 2)
1. **Booking wizard component** - Implement 3-step progressive flow
2. **Mobile bottom sheets** - Replace modals with sheets on mobile
3. **AI integration points** - Add quick-setup and auto-fill features

### Phase 3: Discovery & Actions (Week 3)
1. **Smart notifications** - Implement grouping and priority system
2. **Quick actions bar** - Add floating action button
3. **Service discovery** - Enhance search with AI matching

## Success Metrics
- **Booking conversion**: Target 40% improvement with simplified flow
- **Mobile engagement**: 60% of interactions should use bottom sheets
- **Notification efficiency**: 80% reduction in notification noise through grouping
- **Quick actions usage**: 25% of bookings should come from quick actions

## Technical Constraints
- **Maintain backward compatibility** during transition
- **Progressive enhancement** - desktop experience should not degrade
- **Performance budget** - no more than 100kb additional bundle size
- **Accessibility** - all new components must meet WCAG 2.1 AA standards

## Key Files to Reference
1. **`/vercel-design/app/booking/wizard/page.tsx`** - Target booking flow
2. **`/vercel-design/components/mobile-bottom-sheet.tsx`** - Mobile interaction pattern
3. **`/vercel-design/components/smart-notifications.tsx`** - Notification grouping
4. **`/vercel-design/components/quick-actions-bar.tsx`** - Quick access pattern
5. **`/vercel-design/app/page.tsx`** - Overall design language and gradients

## Development Approach
1. **Start with booking wizard** - highest impact on user experience
2. **Implement mobile-first** - design for mobile, enhance for desktop
3. **Progressive rollout** - feature flags for gradual deployment
4. **User testing** - validate each component with real users
5. **Performance monitoring** - track Core Web Vitals throughout

**The vercel-design folder represents the target user experience. Your job is to bridge the gap between the current complex implementation and this streamlined, mobile-first design.**