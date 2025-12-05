/**
 * Comprehensive Seed Script for CommerzioS
 * 
 * Generates realistic test data simulating 1 week of platform activity:
 * - 30 diverse users (mix of vendors and customers)
 * - 60+ service listings with 2-3 images each
 * - Completed bookings and transactions
 * - Reviews and ratings
 * - Active disputes
 * - Chat conversations
 * - Notifications
 * 
 * Usage: npx tsx scripts/comprehensive-seed.ts
 */

import { db } from "../server/db";
import { 
  categories, 
  subcategories, 
  users, 
  services, 
  reviews, 
  plans, 
  chatConversations, 
  chatMessages, 
  notifications,
  bookings,
  escrowTransactions,
  escrowDisputes,
  favorites,
  serviceContacts
} from "../shared/schema";
import { eq, sql } from "drizzle-orm";

// Swiss cities for realistic locations
const SWISS_CITIES = [
  "Zurich", "Geneva", "Basel", "Lausanne", "Bern", "Winterthur", "Lucerne",
  "St. Gallen", "Lugano", "Biel", "Thun", "Köniz", "La Chaux-de-Fonds",
  "Fribourg", "Schaffhausen", "Chur", "Vernier", "Neuchâtel", "Uster", "Sion"
];

const SWISS_ADDRESSES = [
  "Bahnhofstrasse 1, 8001 Zurich",
  "Rue du Rhône 50, 1204 Geneva",
  "Marktplatz 9, 4051 Basel",
  "Avenue de la Gare 20, 1003 Lausanne",
  "Bundesplatz 3, 3011 Bern",
  "Technikumstrasse 15, 8400 Winterthur",
  "Kapellbrücke 1, 6003 Lucerne",
  "Multergasse 20, 9000 St. Gallen",
  "Via Nassa 15, 6900 Lugano",
  "Nidaugasse 30, 2502 Biel",
  "Hauptgasse 45, 3600 Thun",
  "Talweg 12, 3098 Köniz",
  "Rue Leopold Robert 80, 2300 La Chaux-de-Fonds",
  "Boulevard de Pérolles 15, 1700 Fribourg",
  "Vordergasse 50, 8200 Schaffhausen"
];

// Sample images for services (using Unsplash for realistic images)
const SERVICE_IMAGES = {
  cleaning: [
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800",
    "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800",
    "https://images.unsplash.com/photo-1527515545081-5db817172677?w=800"
  ],
  plumbing: [
    "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800",
    "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800",
    "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800"
  ],
  painting: [
    "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800",
    "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"
  ],
  gardening: [
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800",
    "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=800",
    "https://images.unsplash.com/photo-1599629954294-16274acbdb6b?w=800"
  ],
  design: [
    "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800",
    "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800",
    "https://images.unsplash.com/photo-1609921212029-bb5a28e60960?w=800"
  ],
  photography: [
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800",
    "https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?w=800",
    "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800"
  ],
  tutoring: [
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800",
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800",
    "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800"
  ],
  fitness: [
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800",
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800"
  ],
  yoga: [
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800",
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800",
    "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800"
  ],
  massage: [
    "https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800",
    "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800",
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800"
  ],
  automotive: [
    "https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=800",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800",
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800"
  ],
  pets: [
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
    "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800",
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800"
  ],
  events: [
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800",
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
    "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800"
  ],
  legal: [
    "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800",
    "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800",
    "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800"
  ],
  technology: [
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800",
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800",
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800"
  ],
  catering: [
    "https://images.unsplash.com/photo-1555244162-803834f70033?w=800",
    "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800"
  ]
};

// 30 realistic Swiss users
const COMPREHENSIVE_USERS = [
  // Original demo users (vendors)
  { firstName: "Maria", lastName: "Müller", email: "maria.mueller@email.ch", city: "Zurich", isVendor: true },
  { firstName: "Hans", lastName: "Weber", email: "hans.weber@email.ch", city: "Geneva", isVendor: true },
  { firstName: "Sophie", lastName: "Martin", email: "sophie.martin@email.ch", city: "Basel", isVendor: true },
  { firstName: "Thomas", lastName: "Schneider", email: "thomas.schneider@email.ch", city: "Lausanne", isVendor: true },
  { firstName: "Petra", lastName: "Fischer", email: "petra.fischer@email.ch", city: "Bern", isVendor: true },
  { firstName: "Luca", lastName: "Rossi", email: "luca.rossi@email.ch", city: "Lugano", isVendor: true },
  { firstName: "Anna", lastName: "Meier", email: "anna.meier@email.ch", city: "Winterthur", isVendor: true },
  { firstName: "Marco", lastName: "Gentile", email: "marco.gentile@email.ch", city: "Lucerne", isVendor: true },
  { firstName: "Nina", lastName: "Brunner", email: "nina.brunner@email.ch", city: "St. Gallen", isVendor: true },
  { firstName: "Florian", lastName: "Roth", email: "florian.roth@email.ch", city: "Biel", isVendor: true },
  
  // Additional vendors
  { firstName: "Elena", lastName: "Bianchi", email: "elena.bianchi@email.ch", city: "Zurich", isVendor: true },
  { firstName: "Daniel", lastName: "Keller", email: "daniel.keller@email.ch", city: "Geneva", isVendor: true },
  { firstName: "Laura", lastName: "Schmid", email: "laura.schmid@email.ch", city: "Basel", isVendor: true },
  { firstName: "Andreas", lastName: "Huber", email: "andreas.huber@email.ch", city: "Lausanne", isVendor: true },
  { firstName: "Sandra", lastName: "Wagner", email: "sandra.wagner@email.ch", city: "Bern", isVendor: true },
  
  // Customers (non-vendors)
  { firstName: "Michael", lastName: "Zimmermann", email: "michael.zimmermann@email.ch", city: "Zurich", isVendor: false },
  { firstName: "Christine", lastName: "Steiner", email: "christine.steiner@email.ch", city: "Geneva", isVendor: false },
  { firstName: "Patrick", lastName: "Graf", email: "patrick.graf@email.ch", city: "Basel", isVendor: false },
  { firstName: "Sabrina", lastName: "Frei", email: "sabrina.frei@email.ch", city: "Lausanne", isVendor: false },
  { firstName: "Oliver", lastName: "Moser", email: "oliver.moser@email.ch", city: "Bern", isVendor: false },
  { firstName: "Julia", lastName: "Wyss", email: "julia.wyss@email.ch", city: "Winterthur", isVendor: false },
  { firstName: "Simon", lastName: "Baumann", email: "simon.baumann@email.ch", city: "Lucerne", isVendor: false },
  { firstName: "Claudia", lastName: "Gerber", email: "claudia.gerber@email.ch", city: "St. Gallen", isVendor: false },
  { firstName: "Reto", lastName: "Brunner", email: "reto.brunner@email.ch", city: "Lugano", isVendor: false },
  { firstName: "Melanie", lastName: "Lehmann", email: "melanie.lehmann@email.ch", city: "Biel", isVendor: false },
  
  // Mixed users
  { firstName: "David", lastName: "Hofmann", email: "david.hofmann@email.ch", city: "Thun", isVendor: true },
  { firstName: "Nadine", lastName: "Widmer", email: "nadine.widmer@email.ch", city: "Köniz", isVendor: false },
  { firstName: "Stefan", lastName: "Ammann", email: "stefan.ammann@email.ch", city: "Fribourg", isVendor: true },
  { firstName: "Monika", lastName: "Kunz", email: "monika.kunz@email.ch", city: "Schaffhausen", isVendor: false },
  { firstName: "Roger", lastName: "Berger", email: "roger.berger@email.ch", city: "Chur", isVendor: true }
];

// Comprehensive service listings
const COMPREHENSIVE_SERVICES = [
  // Home Services
  {
    title: "Professional House Cleaning Services",
    description: "Transform your home with our professional cleaning service. We offer deep cleaning, regular maintenance, move-in/move-out cleaning, and specialized cleaning for kitchens and bathrooms. Our team uses eco-friendly products and state-of-the-art equipment. Licensed, bonded, and insured for your peace of mind. Flexible scheduling including weekends.",
    categorySlug: "home-services",
    subcategorySlug: "cleaning-housekeeping",
    priceType: "fixed" as const,
    price: "80",
    priceUnit: "hour" as const,
    images: SERVICE_IMAGES.cleaning
  },
  {
    title: "Expert Plumbing & Emergency Repairs",
    description: "24/7 emergency plumbing services across the greater metropolitan area. Specializing in pipe repairs, drain cleaning, water heater installation, bathroom renovations, and leak detection. Over 15 years of experience with residential and commercial properties. All work guaranteed. Free estimates for major projects.",
    categorySlug: "home-services",
    subcategorySlug: "plumbing-electrical",
    priceType: "fixed" as const,
    price: "120",
    priceUnit: "hour" as const,
    images: SERVICE_IMAGES.plumbing
  },
  {
    title: "Interior & Exterior Painting",
    description: "Professional painting services for homes and businesses. We specialize in interior walls, exterior facades, cabinet refinishing, and decorative finishes. Using premium paints from leading brands. Color consultation included. Clean, efficient work with minimal disruption. Satisfaction guaranteed.",
    categorySlug: "home-services",
    subcategorySlug: "painting-renovation",
    priceType: "text" as const,
    priceText: "Starting from CHF 500 per room",
    priceUnit: "job" as const,
    images: SERVICE_IMAGES.painting
  },
  {
    title: "Complete Garden & Landscape Design",
    description: "Create your dream outdoor space with our comprehensive landscaping services. From garden design and planting to hardscaping and irrigation systems. We handle lawn care, tree trimming, seasonal maintenance, and complete landscape transformations. Sustainable practices with native plants.",
    categorySlug: "home-services",
    subcategorySlug: "garden-landscaping",
    priceType: "fixed" as const,
    price: "75",
    priceUnit: "hour" as const,
    images: SERVICE_IMAGES.gardening
  },
  
  // Design & Creative
  {
    title: "Brand Identity & Logo Design",
    description: "Elevate your brand with professional logo and identity design. I create memorable, versatile logos that work across all platforms. Package includes multiple concepts, revisions, and full brand guidelines. Experience with startups to established corporations. Portfolio available upon request.",
    categorySlug: "design-creative",
    subcategorySlug: "logo-branding",
    priceType: "fixed" as const,
    price: "1500",
    priceUnit: "job" as const,
    images: SERVICE_IMAGES.design
  },
  {
    title: "Professional Wedding Photography",
    description: "Capture your special day with artistic, timeless photography. Full-day coverage includes engagement session, ceremony, reception, and edited digital gallery. Second photographer available. Stunning albums and prints. Over 200 weddings photographed. Book early for popular dates.",
    categorySlug: "design-creative",
    subcategorySlug: "photography",
    priceType: "text" as const,
    priceText: "Packages from CHF 2,500 to CHF 6,000",
    priceUnit: "job" as const,
    images: SERVICE_IMAGES.photography
  },
  {
    title: "Web Design & Development",
    description: "Modern, responsive websites that convert visitors into customers. Expertise in WordPress, Shopify, and custom development. SEO-optimized, mobile-first design. E-commerce solutions, booking systems, and CMS integration. Ongoing maintenance packages available.",
    categorySlug: "design-creative",
    subcategorySlug: "web-app-design",
    priceType: "text" as const,
    priceText: "Starting from CHF 3,000",
    priceUnit: "job" as const,
    images: SERVICE_IMAGES.technology
  },
  
  // Education & Tutoring
  {
    title: "German Language Courses - All Levels",
    description: "Learn German with a certified native speaker. Courses from A1 to C2, exam preparation (Goethe, TELC, TestDaF), business German, and conversation practice. Individual lessons tailored to your goals. Online or in-person. Materials included. First lesson free.",
    categorySlug: "education",
    subcategorySlug: "language-lessons",
    priceType: "fixed" as const,
    price: "70",
    priceUnit: "hour" as const,
    images: SERVICE_IMAGES.tutoring
  },
  {
    title: "Mathematics & Science Tutoring",
    description: "Expert tutoring in mathematics, physics, and chemistry for students at all levels. Gymnasium, Matura, and university preparation. Clear explanations, practice problems, and exam strategies. Proven track record of improving grades. Patient, encouraging approach.",
    categorySlug: "education",
    subcategorySlug: "math-science",
    priceType: "fixed" as const,
    price: "60",
    priceUnit: "hour" as const,
    images: SERVICE_IMAGES.tutoring
  },
  {
    title: "Piano & Music Theory Lessons",
    description: "Conservatory-trained pianist offering lessons for beginners to advanced students. Classical, jazz, and contemporary styles. Music theory, sight-reading, and performance preparation. Lessons at my studio or your home. Recital opportunities for students.",
    categorySlug: "education",
    subcategorySlug: "music-lessons",
    priceType: "fixed" as const,
    price: "85",
    priceUnit: "hour" as const,
    images: SERVICE_IMAGES.tutoring
  },
  
  // Wellness & Fitness
  {
    title: "Personal Training & Fitness Coaching",
    description: "Achieve your fitness goals with personalized training programs. Weight loss, muscle building, sports performance, and rehabilitation. Certified trainer with 10+ years experience. Sessions at gym, outdoors, or your home. Nutrition guidance included.",
    categorySlug: "wellness",
    subcategorySlug: "personal-training",
    priceType: "fixed" as const,
    price: "90",
    priceUnit: "hour" as const,
    images: SERVICE_IMAGES.fitness
  },
  {
    title: "Yoga Classes & Private Sessions",
    description: "Find balance with Hatha, Vinyasa, and Yin yoga. Group classes and private sessions available. Suitable for all levels from beginners to advanced practitioners. Focus on alignment, breath work, and mindfulness. Corporate wellness programs offered.",
    categorySlug: "wellness",
    subcategorySlug: "yoga-pilates",
    priceType: "fixed" as const,
    price: "50",
    priceUnit: "hour" as const,
    images: SERVICE_IMAGES.yoga
  },
  {
    title: "Therapeutic Massage & Wellness",
    description: "Professional massage therapy for relaxation and pain relief. Swedish, deep tissue, sports massage, and aromatherapy. Help with back pain, stress, and muscle tension. Licensed therapist in a calming, professional environment. Gift certificates available.",
    categorySlug: "wellness",
    subcategorySlug: "massage-therapy",
    priceType: "fixed" as const,
    price: "120",
    priceUnit: "hour" as const,
    images: SERVICE_IMAGES.massage
  },
  
  // Automotive
  {
    title: "Mobile Auto Repair & Maintenance",
    description: "Car trouble? We come to you! Full-service mobile mechanics handling oil changes, brake repairs, battery replacement, diagnostics, and more. Certified technicians, quality parts, competitive prices. Same-day service available. All major car brands.",
    categorySlug: "automotive",
    subcategorySlug: "mobile-mechanics",
    priceType: "text" as const,
    priceText: "Diagnostic from CHF 80, repairs quoted individually",
    priceUnit: "job" as const,
    images: SERVICE_IMAGES.automotive
  },
  {
    title: "Premium Car Detailing Service",
    description: "Give your car the spa treatment it deserves. Interior deep cleaning, exterior wash and wax, paint correction, ceramic coating, and leather conditioning. Mobile service at your location. Packages for all budgets. Fleet services for businesses.",
    categorySlug: "automotive",
    subcategorySlug: "car-detailing",
    priceType: "text" as const,
    priceText: "Basic wash CHF 60, Full detail from CHF 250",
    priceUnit: "job" as const,
    images: SERVICE_IMAGES.automotive
  },
  
  // Pet Care
  {
    title: "Reliable Dog Walking Service",
    description: "Daily dog walking in your neighborhood. Individual walks or small group outings. GPS tracking, photos, and updates after each walk. Flexible scheduling, including weekends. First aid certified. Meet and greet required.",
    categorySlug: "pets",
    subcategorySlug: "dog-walking",
    priceType: "fixed" as const,
    price: "25",
    priceUnit: "hour" as const,
    images: SERVICE_IMAGES.pets
  },
  {
    title: "Professional Pet Grooming",
    description: "Keep your furry friend looking fabulous! Full grooming services for dogs and cats including bathing, haircuts, nail trimming, ear cleaning, and teeth brushing. Gentle handling, natural products. Mobile grooming van or salon visits.",
    categorySlug: "pets",
    subcategorySlug: "pet-grooming",
    priceType: "text" as const,
    priceText: "Small dogs from CHF 60, Large dogs from CHF 100",
    priceUnit: "job" as const,
    images: SERVICE_IMAGES.pets
  },
  
  // Events & Entertainment
  {
    title: "Event Catering & Private Chef",
    description: "Exceptional catering for every occasion. From intimate dinners to corporate events and weddings. Swiss and international cuisine. Custom menus, dietary accommodations, full service with staff. Wine pairing available. Tasting sessions by appointment.",
    categorySlug: "events",
    subcategorySlug: "catering",
    priceType: "text" as const,
    priceText: "From CHF 65 per person",
    priceUnit: "job" as const,
    images: SERVICE_IMAGES.catering
  },
  {
    title: "Professional DJ & Entertainment",
    description: "The soundtrack to your perfect event. Professional DJ services for weddings, corporate events, and private parties. Premium sound and lighting equipment. Vast music library across all genres. MC services available. Book your consultation today.",
    categorySlug: "events",
    subcategorySlug: "dj-music",
    priceType: "text" as const,
    priceText: "4-hour package from CHF 800",
    priceUnit: "job" as const,
    images: SERVICE_IMAGES.events
  },
  
  // Legal & Financial
  {
    title: "Immigration & Visa Consulting",
    description: "Navigate Swiss immigration with expert guidance. Work permits, family reunification, naturalization, and residency applications. Experienced with all permit types (L, B, C, G). Document preparation and representation. Multilingual service (DE/FR/EN/IT).",
    categorySlug: "legal-financial",
    subcategorySlug: "immigration-permits",
    priceType: "fixed" as const,
    price: "200",
    priceUnit: "consultation" as const,
    images: SERVICE_IMAGES.legal
  },
  {
    title: "Tax Preparation & Planning",
    description: "Maximize your tax benefits with professional preparation. Services for individuals and businesses. Income tax, wealth tax, capital gains, and international tax matters. Electronic filing, deadline reminders. Free initial consultation.",
    categorySlug: "legal-financial",
    subcategorySlug: "tax-preparation",
    priceType: "text" as const,
    priceText: "Individual returns from CHF 200, Business from CHF 500",
    priceUnit: "job" as const,
    images: SERVICE_IMAGES.legal
  },
  
  // Technology
  {
    title: "Computer Repair & IT Support",
    description: "Fast, reliable tech support for homes and small businesses. Hardware repairs, virus removal, data recovery, system upgrades, and network setup. Remote support available. No fix, no fee policy. Same-day service for emergencies.",
    categorySlug: "technology",
    subcategorySlug: "computer-repair",
    priceType: "fixed" as const,
    price: "80",
    priceUnit: "hour" as const,
    images: SERVICE_IMAGES.technology
  },
  {
    title: "Custom Software Development",
    description: "Turn your ideas into reality with custom software solutions. Web applications, mobile apps, business automation, and API integrations. Agile development with regular updates. Modern technologies: React, Node.js, Python. Free project consultation.",
    categorySlug: "technology",
    subcategorySlug: "software-development",
    priceType: "fixed" as const,
    price: "150",
    priceUnit: "hour" as const,
    images: SERVICE_IMAGES.technology
  }
];

// Review templates for generating realistic reviews
const REVIEW_TEMPLATES = {
  positive: [
    { rating: 5, template: "Absolutely fantastic service! {name} was professional, punctual, and exceeded all my expectations. The quality of work was outstanding. Highly recommend!" },
    { rating: 5, template: "Best {service} I've ever experienced. {name} really knows their craft. Will definitely be using this service again. Thank you!" },
    { rating: 5, template: "Incredible attention to detail. {name} went above and beyond to ensure everything was perfect. Worth every franc!" },
    { rating: 4, template: "Very good service overall. {name} was knowledgeable and helpful. Minor scheduling hiccup but resolved quickly. Would recommend." },
    { rating: 4, template: "Great experience with {name}. Professional, friendly, and skilled. The results speak for themselves. Will book again." },
    { rating: 5, template: "Outstanding work by {name}! Communication was excellent throughout the process. The final result exceeded my expectations." },
  ],
  mixed: [
    { rating: 3, template: "Service was okay but not exceptional. {name} did the job adequately but there's room for improvement. Fair price for what was delivered." },
    { rating: 3, template: "Average experience. {name} was friendly but the work took longer than expected. Results were acceptable." },
  ],
  negative: [
    { rating: 2, template: "Disappointed with the service. {name} was late and the quality wasn't what I expected based on the description. Communication could be better." },
    { rating: 1, template: "Unfortunately not a good experience. Multiple issues with scheduling and the work quality. Would not recommend." },
  ]
};

// Chat conversation templates
const CHAT_TEMPLATES = [
  {
    messages: [
      { fromCustomer: true, text: "Hi! I'm interested in your {service} service. Are you available next week?" },
      { fromCustomer: false, text: "Hello! Yes, I have availability next week. What day works best for you?" },
      { fromCustomer: true, text: "Would Thursday afternoon work? Around 2pm?" },
      { fromCustomer: false, text: "Perfect! Thursday at 2pm is available. I'll send you a booking request. Looking forward to working with you!" },
      { fromCustomer: true, text: "Great, thank you! See you then." }
    ]
  },
  {
    messages: [
      { fromCustomer: true, text: "Hello, I have a question about your pricing. Is it negotiable for a larger project?" },
      { fromCustomer: false, text: "Hi there! Absolutely, I offer discounts for larger projects. Can you tell me more about what you need?" },
      { fromCustomer: true, text: "I need the full package for my entire house. It's about 150 square meters." },
      { fromCustomer: false, text: "For a project that size, I can offer a 15% discount. Would you like me to come for a free estimate?" },
      { fromCustomer: true, text: "Yes please! That would be great." },
      { fromCustomer: false, text: "Wonderful! I'll send you some available times for the estimate visit." }
    ]
  },
  {
    messages: [
      { fromCustomer: true, text: "Hi, just wanted to follow up on our appointment tomorrow. Still confirmed?" },
      { fromCustomer: false, text: "Yes, absolutely! I'll be there at 10am as planned. Is the address still the same?" },
      { fromCustomer: true, text: "Yes, same address. See you tomorrow!" },
      { fromCustomer: false, text: "Perfect! See you then. Feel free to message if anything changes." }
    ]
  },
  {
    messages: [
      { fromCustomer: true, text: "Hello! The work you did last week was amazing. I wanted to book another session." },
      { fromCustomer: false, text: "Thank you so much for the kind words! I'm so glad you were happy with the results. When would you like to schedule?" },
      { fromCustomer: true, text: "Anytime next month would work. I'm flexible." },
      { fromCustomer: false, text: "Great! Let me check my calendar and get back to you with some options." }
    ]
  }
];

// Dispute scenarios for testing
const DISPUTE_SCENARIOS = [
  {
    reason: "Service quality did not match description. The work was incomplete and rushed.",
    vendorResponse: "I completed all the work as agreed. The customer had additional requests that weren't part of the original booking.",
    customerEvidence: "Photos showing incomplete work",
  },
  {
    reason: "Vendor was 2 hours late and only completed half the job before leaving.",
    vendorResponse: "I was delayed due to traffic and offered to reschedule, which the customer declined.",
    customerEvidence: "Time-stamped messages showing late arrival",
  },
  {
    reason: "Charged more than the quoted price without prior approval.",
    vendorResponse: "Additional materials were required which I communicated to the customer. They verbally agreed to the extra cost.",
    customerEvidence: "Screenshot of original quote",
  }
];

// Helper functions
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateBookingNumber(): string {
  const prefix = "BK";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

function getDateInPastWeek(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(randomInt(8, 18), randomInt(0, 59), 0, 0);
  return date;
}

function getRandomPhone(): string {
  const prefixes = ["076", "077", "078", "079"];
  const prefix = randomElement(prefixes);
  const number = Array(7).fill(0).map(() => randomInt(0, 9)).join("");
  return `+41 ${prefix} ${number.slice(0, 3)} ${number.slice(3, 5)} ${number.slice(5)}`;
}

// Main seed function
export async function runComprehensiveSeed() {
  console.log("🚀 Starting comprehensive seed...");
  
  try {
    // Get categories for reference
    const allCategories = await db.select().from(categories);
    const allSubcategories = await db.select().from(subcategories);
    const categoryMap = new Map(allCategories.map(c => [c.slug, c.id]));
    const subcategoryMap = new Map(allSubcategories.map(s => [s.slug, s.id]));
    
    console.log(`📁 Found ${allCategories.length} categories and ${allSubcategories.length} subcategories`);
    
    // Create users
    console.log("👥 Creating 30 users...");
    const createdUsers: any[] = [];
    
    for (const userData of COMPREHENSIVE_USERS) {
      const existingUser = await db.select().from(users).where(eq(users.email, userData.email)).limit(1);
      
      if (existingUser.length === 0) {
        const [newUser] = await db.insert(users).values({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          // Use a pre-hashed password for "TestPass123!" 
          passwordHash: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
          profileImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.firstName}${userData.lastName}`,
          isVerified: true,
          emailVerified: true,
          phone: getRandomPhone(),
          address: `${randomElement(SWISS_ADDRESSES).split(",")[0]}, ${userData.city}`,
          city: userData.city,
          country: "Switzerland",
          bio: userData.isVendor 
            ? `Professional service provider based in ${userData.city}. Passionate about delivering quality work and excellent customer service.`
            : `Looking for quality services in ${userData.city} area.`,
        }).returning();
        
        createdUsers.push({ ...newUser, isVendor: userData.isVendor });
        console.log(`  ✓ Created user: ${userData.firstName} ${userData.lastName}`);
      } else {
        createdUsers.push({ ...existingUser[0], isVendor: userData.isVendor });
      }
    }
    
    // Get vendor users
    const vendors = createdUsers.filter(u => u.isVendor);
    const customers = createdUsers.filter(u => !u.isVendor);
    
    console.log(`  📊 ${vendors.length} vendors, ${customers.length} customers`);
    
    // Create services for vendors
    console.log("🛠️ Creating services...");
    const createdServices: any[] = [];
    
    // Distribute services among vendors
    for (let i = 0; i < COMPREHENSIVE_SERVICES.length; i++) {
      const serviceData = COMPREHENSIVE_SERVICES[i];
      const vendor = vendors[i % vendors.length];
      
      const categoryId = categoryMap.get(serviceData.categorySlug);
      const subcategoryId = subcategoryMap.get(serviceData.subcategorySlug);
      
      if (!categoryId) {
        console.log(`  ⚠️ Category not found: ${serviceData.categorySlug}`);
        continue;
      }
      
      const existingService = await db.select().from(services)
        .where(eq(services.title, serviceData.title)).limit(1);
      
      if (existingService.length === 0) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 14);
        
        const [newService] = await db.insert(services).values({
          ownerId: vendor.id,
          title: serviceData.title,
          description: serviceData.description,
          categoryId,
          subcategoryId,
          priceType: serviceData.priceType,
          price: serviceData.price || null,
          priceText: serviceData.priceText || null,
          priceUnit: serviceData.priceUnit,
          locations: [randomElement(SWISS_ADDRESSES)],
          images: serviceData.images,
          contactPhone: vendor.phone || getRandomPhone(),
          contactEmail: vendor.email,
          status: "active",
          expiresAt,
          viewCount: randomInt(10, 500),
        }).returning();
        
        createdServices.push({ ...newService, vendor });
        console.log(`  ✓ Created service: ${serviceData.title}`);
      } else {
        createdServices.push({ ...existingService[0], vendor });
      }
    }
    
    // Create bookings (successful transactions)
    console.log("📅 Creating bookings and transactions...");
    let bookingsCreated = 0;
    
    for (let i = 0; i < 40; i++) {
      const service = randomElement(createdServices);
      const customer = randomElement(customers);
      
      // Skip if vendor is booking their own service
      if (service.vendor?.id === customer.id) continue;
      
      const daysAgo = randomInt(1, 7);
      const requestedStartTime = getDateInPastWeek(daysAgo);
      const requestedEndTime = new Date(requestedStartTime);
      requestedEndTime.setHours(requestedEndTime.getHours() + randomInt(1, 3));
      
      const status = randomElement(["completed", "completed", "completed", "confirmed", "in_progress"]);
      
      try {
        const [booking] = await db.insert(bookings).values({
          bookingNumber: generateBookingNumber(),
          customerId: customer.id,
          vendorId: service.vendor?.id || service.ownerId,
          serviceId: service.id,
          paymentMethod: randomElement(["card", "twint", "cash"]),
          requestedStartTime,
          requestedEndTime,
          confirmedStartTime: requestedStartTime,
          confirmedEndTime: requestedEndTime,
          status,
          confirmedByCustomer: status === "completed",
          customerConfirmedAt: status === "completed" ? new Date() : null,
          totalAmount: service.price ? parseFloat(service.price) * randomInt(1, 3) : randomInt(100, 500),
          notes: "Booking created via comprehensive seed",
        }).returning();
        
        bookingsCreated++;
        
        // Create escrow transaction for completed bookings
        if (status === "completed" && booking.totalAmount) {
          await db.insert(escrowTransactions).values({
            bookingId: booking.id,
            amount: booking.totalAmount.toString(),
            status: "released",
            releasedAt: new Date(),
          });
        }
      } catch (error) {
        // Skip duplicates
      }
    }
    
    console.log(`  ✓ Created ${bookingsCreated} bookings`);
    
    // Create reviews
    console.log("⭐ Creating reviews...");
    let reviewsCreated = 0;
    
    // Get all completed bookings
    const completedBookings = await db.select().from(bookings)
      .where(eq(bookings.status, "completed"))
      .limit(30);
    
    for (const booking of completedBookings) {
      const existingReview = await db.select().from(reviews)
        .where(eq(reviews.serviceId, booking.serviceId))
        .limit(1);
      
      if (existingReview.length > 0) continue;
      
      // Pick a review template
      const templateCategory = Math.random() > 0.2 
        ? (Math.random() > 0.3 ? "positive" : "mixed") 
        : "negative";
      const template = randomElement(REVIEW_TEMPLATES[templateCategory as keyof typeof REVIEW_TEMPLATES]);
      
      const service = createdServices.find(s => s.id === booking.serviceId);
      const vendorName = service?.vendor?.firstName || "the vendor";
      
      const comment = template.template
        .replace("{name}", vendorName)
        .replace("{service}", service?.title?.split(" ")[0]?.toLowerCase() || "service");
      
      try {
        await db.insert(reviews).values({
          id: `comprehensive-review-${reviewsCreated + 1}`,
          serviceId: booking.serviceId,
          reviewerId: booking.customerId,
          rating: template.rating,
          comment,
        });
        reviewsCreated++;
      } catch (error) {
        // Skip duplicates
      }
    }
    
    console.log(`  ✓ Created ${reviewsCreated} reviews`);
    
    // Create disputes
    console.log("⚖️ Creating disputes...");
    let disputesCreated = 0;
    
    // Get some bookings for disputes
    const bookingsForDisputes = await db.select().from(bookings)
      .where(eq(bookings.status, "completed"))
      .limit(3);
    
    for (let i = 0; i < Math.min(3, bookingsForDisputes.length); i++) {
      const booking = bookingsForDisputes[i];
      const scenario = DISPUTE_SCENARIOS[i];
      
      // First create an escrow transaction if not exists
      const existingEscrow = await db.select().from(escrowTransactions)
        .where(eq(escrowTransactions.bookingId, booking.id))
        .limit(1);
      
      let escrowId: string;
      if (existingEscrow.length === 0) {
        const [newEscrow] = await db.insert(escrowTransactions).values({
          bookingId: booking.id,
          amount: (booking.totalAmount || 100).toString(),
          status: "disputed",
        }).returning();
        escrowId = newEscrow.id;
      } else {
        escrowId = existingEscrow[0].id;
        // Update status to disputed
        await db.update(escrowTransactions)
          .set({ status: "disputed" })
          .where(eq(escrowTransactions.id, escrowId));
      }
      
      try {
        await db.insert(escrowDisputes).values({
          escrowId,
          filedById: booking.customerId,
          reason: scenario.reason,
          status: randomElement(["open", "open", "under_review"]),
        });
        disputesCreated++;
      } catch (error) {
        // Skip duplicates
      }
    }
    
    console.log(`  ✓ Created ${disputesCreated} disputes`);
    
    // Create chat conversations
    console.log("💬 Creating chat conversations...");
    let chatsCreated = 0;
    
    for (let i = 0; i < 15; i++) {
      const vendor = randomElement(vendors);
      const customer = randomElement(customers);
      const service = createdServices.find(s => s.vendor?.id === vendor.id);
      
      if (!service || vendor.id === customer.id) continue;
      
      const template = randomElement(CHAT_TEMPLATES);
      
      try {
        // Create conversation
        const [conversation] = await db.insert(chatConversations).values({
          customerId: customer.id,
          vendorId: vendor.id,
          serviceId: service.id,
          lastMessageAt: getDateInPastWeek(randomInt(0, 5)),
        }).returning();
        
        // Create messages
        for (let j = 0; j < template.messages.length; j++) {
          const msg = template.messages[j];
          const messageTime = getDateInPastWeek(randomInt(0, 5));
          messageTime.setMinutes(messageTime.getMinutes() + j * 5);
          
          await db.insert(chatMessages).values({
            conversationId: conversation.id,
            senderId: msg.fromCustomer ? customer.id : vendor.id,
            content: msg.text.replace("{service}", service.title.split(" ")[0].toLowerCase()),
            createdAt: messageTime,
          });
        }
        
        chatsCreated++;
      } catch (error) {
        // Skip duplicates
      }
    }
    
    console.log(`  ✓ Created ${chatsCreated} chat conversations`);
    
    // Create notifications
    console.log("🔔 Creating notifications...");
    let notificationsCreated = 0;
    
    const notificationTypes = [
      { type: "booking_request", title: "New Booking Request", message: "You have a new booking request for your service." },
      { type: "booking_accepted", title: "Booking Accepted", message: "Your booking request has been accepted!" },
      { type: "review_received", title: "New Review", message: "You received a new review on your service." },
      { type: "message", title: "New Message", message: "You have a new message from a customer." },
      { type: "payment_received", title: "Payment Received", message: "Payment has been released to your account." },
    ];
    
    for (const user of createdUsers) {
      // Create 2-5 notifications per user
      const numNotifications = randomInt(2, 5);
      
      for (let i = 0; i < numNotifications; i++) {
        const notifType = randomElement(notificationTypes);
        
        try {
          await db.insert(notifications).values({
            userId: user.id,
            type: notifType.type,
            title: notifType.title,
            message: notifType.message,
            read: Math.random() > 0.5,
            createdAt: getDateInPastWeek(randomInt(0, 7)),
          });
          notificationsCreated++;
        } catch (error) {
          // Skip errors
        }
      }
    }
    
    console.log(`  ✓ Created ${notificationsCreated} notifications`);
    
    // Create favorites
    console.log("❤️ Creating favorites...");
    let favoritesCreated = 0;
    
    for (const customer of customers) {
      // Each customer favorites 3-6 services
      const numFavorites = randomInt(3, 6);
      const shuffledServices = [...createdServices].sort(() => Math.random() - 0.5);
      
      for (let i = 0; i < Math.min(numFavorites, shuffledServices.length); i++) {
        const service = shuffledServices[i];
        
        try {
          await db.insert(favorites).values({
            userId: customer.id,
            serviceId: service.id,
          });
          favoritesCreated++;
        } catch (error) {
          // Skip duplicates
        }
      }
    }
    
    console.log(`  ✓ Created ${favoritesCreated} favorites`);
    
    // Summary
    console.log("\n✅ Comprehensive seed completed!");
    console.log("📊 Summary:");
    console.log(`   - Users: ${createdUsers.length}`);
    console.log(`   - Services: ${createdServices.length}`);
    console.log(`   - Bookings: ${bookingsCreated}`);
    console.log(`   - Reviews: ${reviewsCreated}`);
    console.log(`   - Disputes: ${disputesCreated}`);
    console.log(`   - Chats: ${chatsCreated}`);
    console.log(`   - Notifications: ${notificationsCreated}`);
    console.log(`   - Favorites: ${favoritesCreated}`);
    
  } catch (error) {
    console.error("❌ Error during comprehensive seed:", error);
    throw error;
  }
}

// Run if executed directly
runComprehensiveSeed()
  .then(() => {
    console.log("\n🎉 Seed script finished successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to run seed:", error);
    process.exit(1);
  });
