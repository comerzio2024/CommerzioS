import { z } from "zod";

// --- Types ---

export type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isVerified: boolean;
  marketingPackage?: "basic" | "pro" | "enterprise";
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
};

export type Review = {
  id: string;
  serviceId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
};

export type Service = {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  category: string;
  price: number;
  priceUnit: "hour" | "job" | "consultation";
  location: string;
  images: string[];
  status: "active" | "paused" | "expired";
  rating: number;
  reviewCount: number;
  createdAt: string;
  expiresAt: string;
  tags: string[];
  contactPhone?: string;
  contactEmail?: string;
};

// --- Mock Data ---

import heroImg from "@assets/generated_images/abstract_community_connection_hero_background.png";
import cleanerImg from "@assets/generated_images/professional_home_cleaner.png";
import designerImg from "@assets/generated_images/graphic_designer_workspace.png";
import plumberImg from "@assets/generated_images/plumber_fixing_sink.png";
import trainerImg from "@assets/generated_images/personal_trainer_in_gym.png";

export const USERS: User[] = [
  {
    id: "u1",
    name: "Alice Johnson",
    email: "alice@example.com",
    isVerified: true,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
    marketingPackage: "pro",
  },
  {
    id: "u2",
    name: "Bob Smith",
    email: "bob@example.com",
    isVerified: false,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
  },
  {
    id: "u3",
    name: "Charlie Davis",
    email: "charlie@example.com",
    isVerified: true,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie",
  },
];

export const CURRENT_USER: User = {
  id: "u1",
  name: "Alice Johnson",
  email: "alice@example.com",
  isVerified: true,
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
  marketingPackage: "pro",
};

export const CATEGORIES: Category[] = [
  { id: "c1", name: "Home Services", slug: "home-services", icon: "Home" },
  { id: "c2", name: "Design & Creative", slug: "design-creative", icon: "Palette" },
  { id: "c3", name: "Education & Tutoring", slug: "education", icon: "GraduationCap" },
  { id: "c4", name: "Wellness & Fitness", slug: "wellness", icon: "Dumbbell" },
  { id: "c5", name: "Business Support", slug: "business", icon: "Briefcase" },
];

export const SERVICES: Service[] = [
  {
    id: "s1",
    ownerId: "u2",
    title: "Professional Home Cleaning & Organization",
    description: "Top-rated cleaning service for apartments and houses. I bring my own eco-friendly supplies.",
    category: "home-services",
    price: 45,
    priceUnit: "hour",
    location: "New York, NY",
    images: [cleanerImg],
    status: "active",
    rating: 4.8,
    reviewCount: 124,
    createdAt: "2023-10-25T10:00:00Z",
    expiresAt: "2023-11-08T10:00:00Z", // Expired mock
    tags: ["Cleaning", "Organization", "Eco-friendly"],
    contactPhone: "+1 555 0123",
  },
  {
    id: "s2",
    ownerId: "u3",
    title: "Logo Design & Brand Identity",
    description: "I will create a unique, modern logo for your startup or business. Includes 3 revisions.",
    category: "design-creative",
    price: 250,
    priceUnit: "job",
    location: "Remote",
    images: [designerImg],
    status: "active",
    rating: 5.0,
    reviewCount: 42,
    createdAt: "2023-11-01T10:00:00Z",
    expiresAt: "2023-11-15T10:00:00Z",
    tags: ["Logo", "Branding", "Illustrator"],
    contactEmail: "design@charlie.com",
  },
  {
    id: "s3",
    ownerId: "u1",
    title: "Emergency Plumbing Services",
    description: "24/7 emergency plumbing. Leaks, clogs, and installations. Licensed and insured.",
    category: "home-services",
    price: 120,
    priceUnit: "hour",
    location: "Brooklyn, NY",
    images: [plumberImg],
    status: "active",
    rating: 4.5,
    reviewCount: 18,
    createdAt: "2023-11-10T10:00:00Z",
    expiresAt: "2023-11-24T10:00:00Z",
    tags: ["Plumbing", "Emergency", "Licensed"],
    contactPhone: "+1 555 9876",
  },
  {
    id: "s4",
    ownerId: "u2",
    title: "Personal Training - HIIT & Strength",
    description: "Get fit with personalized workout plans. I come to your gym or we can train outdoors.",
    category: "wellness",
    price: 80,
    priceUnit: "hour",
    location: "Los Angeles, CA",
    images: [trainerImg],
    status: "paused", // Paused mock
    rating: 4.9,
    reviewCount: 56,
    createdAt: "2023-11-12T10:00:00Z",
    expiresAt: "2023-11-26T10:00:00Z",
    tags: ["Fitness", "HIIT", "Training"],
  },
];

export const REVIEWS: Review[] = [
  {
    id: "r1",
    serviceId: "s1",
    userId: "u1",
    userName: "Alice Johnson",
    rating: 5,
    comment: "Absolutely amazing service! My house has never been cleaner.",
    date: "2023-10-28",
  },
  {
    id: "r2",
    serviceId: "s1",
    userId: "u3",
    userName: "Charlie Davis",
    rating: 4,
    comment: "Great job, but arrived 10 minutes late.",
    date: "2023-10-29",
  },
];
