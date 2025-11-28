/**
 * Commerzio Services - Brand Configuration
 * 
 * Central configuration for all brand-related constants.
 * Update this file to change branding across the entire application.
 */

export const BRAND = {
  // Company names
  name: "Commerzio Services",
  shortName: "Commerzio",
  parentCompany: "Commerzio",
  legalName: "Commerzio Services AG",
  
  // Taglines
  tagline: "Trusted Local Services",
  description: "Connecting trusted service providers with people who need their skills. Simple, secure, and Swiss.",
  
  // URLs
  website: "https://services.commerzio.online",
  parentWebsite: "https://commerzio.online",
  supportEmail: "support@commerzio.online",
  contactEmail: "info@commerzio.online",
  
  // Social media
  social: {
    twitter: "@commerzio",
    facebook: "commerzio",
    instagram: "commerzio",
    linkedin: "commerzio",
  },
  
  // Legal
  copyright: `© ${new Date().getFullYear()} Commerzio Services AG. All rights reserved.`,
  
  // Colors (matching CSS variables)
  colors: {
    primary: {
      DEFAULT: "#1a56db",
      light: "#3b82f6",
      dark: "#1e40af",
    },
    accent: {
      DEFAULT: "#2ba89c",
      light: "#5eead4",
      dark: "#14b8a6",
    },
    navy: "#0f172a",
    slate: "#94a3b8",
  },
  
  // Logos
  logos: {
    full: "/logo.svg",
    fullDark: "/logo-dark.svg",
    icon: "/icon.svg",
    favicon: "/favicon.svg",
  },
} as const;

// SEO/Meta configuration
export const META = {
  title: "Commerzio Services | Trusted Local Services",
  description: "Find trusted local service providers in Switzerland. Professional cleaning, repairs, tutoring, wellness, and more. Simple booking, secure payments.",
  keywords: "services, marketplace, Switzerland, local services, cleaning, repairs, tutoring, wellness, professionals",
  ogImage: "/og-image.png",
  twitterCard: "summary_large_image",
} as const;

// Email template configuration
export const EMAIL_BRAND = {
  name: "Commerzio Services",
  primaryColor: "#1a56db",
  accentColor: "#2ba89c",
  gradientStart: "#1a56db",
  gradientEnd: "#2ba89c",
} as const;

export default BRAND;

