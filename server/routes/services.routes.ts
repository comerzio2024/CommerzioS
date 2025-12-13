/**
 * Services Routes
 * 
 * Comprehensive modular endpoints for service management:
 * - Search and listing
 * - CRUD operations
 * - Service stats and analytics
 * - Reviews
 * - Renewal
 * - Geocoding integration
 * - AI categorization
 */

import { Router, Response } from "express";
import { isAuthenticated } from "../auth";
import { storage } from "../storage";
import { db } from "../db";
import { eq, and, desc, inArray } from "drizzle-orm";
import {
    services,
    bookings,
    reviews,
    escrowDisputes,
    insertServiceSchema,
    insertReviewSchema
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { categorizeService } from "../aiCategorizationService";

const router = Router();

// ===========================================
// SEARCH & LISTING
// ===========================================

/**
 * GET /api/services/search
 * Search services with query and filters
 */
router.get("/search", async (req: any, res: Response) => {
    try {
        const { q, categoryId, subcategoryId, minPrice, maxPrice, location } = req.query;

        const results = await storage.searchServices({
            query: q as string,
            categoryId: categoryId as string,
            subcategoryId: subcategoryId as string,
            minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
            location: location as string,
        });

        res.json(results);
    } catch (error) {
        console.error("Error searching services:", error);
        res.status(500).json({ message: "Failed to search services" });
    }
});

/**
 * GET /api/services/hashtag/:hashtag
 * Get services by hashtag
 */
router.get("/hashtag/:hashtag", async (req: any, res: Response) => {
    try {
        const services = await storage.getServicesByHashtag(req.params.hashtag);
        res.json(services);
    } catch (error) {
        console.error("Error fetching services by hashtag:", error);
        res.status(500).json({ message: "Failed to fetch services by hashtag" });
    }
});

/**
 * GET /api/services
 * List services with optional filters
 */
router.get("/", async (req: any, res: Response) => {
    try {
        const { categoryId, ownerId, status, search } = req.query;
        const serviceList = await storage.getServices({
            categoryId: categoryId as string | undefined,
            ownerId: ownerId as string | undefined,
            status: status as string | undefined,
            search: search as string | undefined,
        });
        res.json(serviceList);
    } catch (error) {
        console.error("Error fetching services:", error);
        res.status(500).json({ message: "Failed to fetch services" });
    }
});

/**
 * GET /api/services/booked-by/:customerId
 * Get services that a vendor provided to a specific customer
 * Used for the "Review Back" feature
 */
router.get("/booked-by/:customerId", isAuthenticated, async (req: any, res: Response) => {
    try {
        const vendorId = req.user!.id;
        const customerId = req.params.customerId;

        // Find all completed/confirmed bookings between this vendor and customer
        const completedBookings = await db
            .select({
                serviceId: bookings.serviceId,
                bookingId: bookings.id,
                completedAt: bookings.updatedAt,
            })
            .from(bookings)
            .where(
                and(
                    eq(bookings.vendorId, vendorId),
                    eq(bookings.customerId, customerId),
                    inArray(bookings.status, ["completed", "confirmed", "in_progress"])
                )
            )
            .orderBy(desc(bookings.updatedAt));

        if (completedBookings.length === 0) {
            return res.json([]);
        }

        // Get unique service IDs
        const serviceIds = [...new Set(completedBookings.map(b => b.serviceId))];

        // Fetch the services (including inactive ones)
        const bookedServices = await db
            .select({
                id: services.id,
                title: services.title,
                description: services.description,
                status: services.status,
            })
            .from(services)
            .where(inArray(services.id, serviceIds));

        res.json(bookedServices);
    } catch (error) {
        console.error("Error fetching booked services:", error);
        res.status(500).json({ message: "Failed to fetch booked services" });
    }
});

/**
 * POST /api/services/nearby
 * Find services near a location
 */
router.post("/nearby", async (req: any, res: Response) => {
    try {
        const { lat, lng, radiusKm, categoryId, limit } = req.body;

        const nearbyServices = await storage.getNearbyServices(
            lat,
            lng,
            radiusKm || 10,
            categoryId,
            limit || 20
        );

        res.json(nearbyServices);
    } catch (error) {
        console.error("Error fetching nearby services:", error);
        res.status(500).json({ message: "Failed to fetch nearby services" });
    }
});

// ===========================================
// SINGLE SERVICE CRUD
// ===========================================

/**
 * GET /api/services/:id
 * Get service by ID (increments view count)
 */
router.get("/:id", async (req: any, res: Response) => {
    try {
        const service = await storage.getService(req.params.id);
        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }
        // Increment view count
        await storage.incrementViewCount(req.params.id);
        res.json(service);
    } catch (error) {
        console.error("Error fetching service:", error);
        res.status(500).json({ message: "Failed to fetch service" });
    }
});

/**
 * GET /api/services/:id/stats
 * Get service stats for owner (views, shares, favorites, unread messages)
 */
router.get("/:id/stats", isAuthenticated, async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;
        const serviceId = req.params.id;

        const service = await storage.getService(serviceId);
        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        if (service.ownerId !== userId) {
            return res.status(403).json({ message: "Not authorized to view stats" });
        }

        const favoritesCount = await storage.getServiceFavoritesCount(serviceId);
        const unreadMessageCount = await storage.getServiceUnreadMessageCount(serviceId, userId);

        res.json({
            viewCount: service.viewCount || 0,
            shareCount: service.shareCount || 0,
            favoritesCount,
            unreadMessageCount,
        });
    } catch (error) {
        console.error("Error fetching service stats:", error);
        res.status(500).json({ message: "Failed to fetch service stats" });
    }
});

/**
 * POST /api/services/:id/share
 * Increment share count when user shares a service
 */
router.post("/:id/share", async (req: any, res: Response) => {
    try {
        await storage.incrementShareCount(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error("Error incrementing share count:", error);
        res.status(500).json({ message: "Failed to record share" });
    }
});

/**
 * POST /api/services
 * Create a new service with AI categorization and geocoding
 */
router.post("/", isAuthenticated, async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;

        // Check if email is verified before allowing service creation
        const user = await storage.getUser(userId);
        if (!user?.emailVerified) {
            return res.status(403).json({
                message: "Please verify your email address before creating services.",
                requiresEmailVerification: true,
            });
        }

        // Check if this is a draft save
        const isDraft = req.body.status === "draft";

        // Use appropriate schema based on whether it's a draft
        let validated;
        if (isDraft) {
            const { insertServiceDraftSchema } = await import("@shared/schema");
            validated = insertServiceDraftSchema.parse(req.body);
        } else {
            validated = insertServiceSchema.parse(req.body);
        }

        // AI-powered categorization if not provided and title exists
        let categoryId = validated.categoryId;
        if (!categoryId && validated.title && validated.title.trim()) {
            const suggestion = await categorizeService(validated.title, validated.description || "");
            const category = await storage.getCategoryBySlug(suggestion.categorySlug);
            if (category) {
                categoryId = category.id;
            }
        }

        // If still no categoryId, get a default category
        if (!categoryId) {
            const defaultCategory = await storage.getCategoryBySlug("home-services");
            if (defaultCategory) {
                categoryId = defaultCategory.id;
            } else {
                const allCategories = await storage.getCategories();
                if (allCategories.length > 0) {
                    categoryId = allCategories[0].id;
                }
            }
        }

        // For active services, category is absolutely required
        if (!isDraft && !categoryId) {
            return res.status(400).json({ message: "Category is required for active services" });
        }

        if (!categoryId) {
            return res.status(500).json({ message: "System configuration error: No categories available." });
        }

        // Set expiry date (14 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 14);

        // Geocode first location if provided
        let locationLat = null;
        let locationLng = null;
        let preferredLocationName = null;

        if (validated.locations && validated.locations.length > 0) {
            const firstLocation = validated.locations[0];
            try {
                const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(firstLocation)}&format=json&countrycodes=ch&limit=1`;
                const geocodeResponse = await fetch(geocodeUrl, {
                    headers: { "User-Agent": "ServiceMarketplace/1.0" }
                });

                if (geocodeResponse.ok) {
                    const results = await geocodeResponse.json();
                    if (results && results.length > 0) {
                        locationLat = parseFloat(results[0].lat);
                        locationLng = parseFloat(results[0].lon);
                        preferredLocationName = firstLocation;
                    }
                }
            } catch (error) {
                console.error("Failed to geocode service location:", error);
            }
        }

        // Sanitize price: empty string should be null for numeric field
        const sanitizedPrice = validated.price && validated.price !== "" ? validated.price : null;

        const serviceData = {
            ...validated,
            price: sanitizedPrice,
            categoryId,
            ownerId: userId,
            expiresAt,
            status: (isDraft ? "draft" : "active") as "draft" | "active" | "paused" | "expired",
            locationLat: locationLat ? locationLat.toString() : null,
            locationLng: locationLng ? locationLng.toString() : null,
            preferredLocationName,
            priceUnit: (validated.priceUnit || "hour") as "hour" | "job" | "consultation" | "day" | "month",
        };

        const createdService = await storage.createService(serviceData as any);
        const enrichedService = await storage.getService(createdService.id);
        res.status(201).json(enrichedService);
    } catch (error: any) {
        if (error.name === "ZodError") {
            return res.status(400).json({ message: fromZodError(error).message });
        }
        console.error("Error creating service:", error);
        res.status(500).json({ message: "Failed to create service", error: error.message || String(error) });
    }
});

/**
 * PATCH /api/services/:id
 * Update a service with ownership check and geocoding
 */
router.patch("/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;

        // Check ownership
        const existing = await storage.getService(req.params.id);
        if (!existing) {
            return res.status(404).json({ message: "Service not found" });
        }
        if (existing.ownerId !== userId) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const updateData = { ...req.body };

        // Geocode first location if locations are being updated
        if (req.body.locations && req.body.locations.length > 0) {
            const firstLocation = req.body.locations[0];
            try {
                const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(firstLocation)}&format=json&countrycodes=ch&limit=1`;
                const geocodeResponse = await fetch(geocodeUrl, {
                    headers: { "User-Agent": "ServiceMarketplace/1.0" }
                });

                if (geocodeResponse.ok) {
                    const results = await geocodeResponse.json();
                    if (results && results.length > 0) {
                        updateData.locationLat = parseFloat(results[0].lat).toString();
                        updateData.locationLng = parseFloat(results[0].lon).toString();
                        updateData.preferredLocationName = firstLocation;
                    }
                }
            } catch (error) {
                console.error("Failed to geocode service location:", error);
            }
        }

        await storage.updateService(req.params.id, updateData);
        const enrichedService = await storage.getService(req.params.id);
        res.json(enrichedService);
    } catch (error) {
        console.error("Error updating service:", error);
        res.status(500).json({ message: "Failed to update service" });
    }
});

/**
 * DELETE /api/services/:id
 * Delete a service with ownership check
 */
router.delete("/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;

        // Check ownership
        const existing = await storage.getService(req.params.id);
        if (!existing) {
            return res.status(404).json({ message: "Service not found" });
        }
        if (existing.ownerId !== userId) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await storage.deleteService(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting service:", error);
        res.status(500).json({ message: "Failed to delete service" });
    }
});

/**
 * POST /api/services/:id/renew
 * Renew an expired or expiring service
 */
router.post("/:id/renew", isAuthenticated, async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;

        // Check ownership
        const existing = await storage.getService(req.params.id);
        if (!existing) {
            return res.status(404).json({ message: "Service not found" });
        }
        if (existing.ownerId !== userId) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const service = await storage.renewService(req.params.id);
        res.json(service);
    } catch (error) {
        console.error("Error renewing service:", error);
        res.status(500).json({ message: "Failed to renew service" });
    }
});

// ===========================================
// REVIEWS
// ===========================================

/**
 * GET /api/services/:id/reviews
 * Get reviews for a service
 */
router.get("/:id/reviews", async (req: any, res: Response) => {
    try {
        const serviceReviews = await storage.getReviewsForService(req.params.id);
        res.json(serviceReviews);
    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ message: "Failed to fetch reviews" });
    }
});

/**
 * POST /api/services/:id/reviews
 * Create a review for a service (requires verification, blocks during disputes)
 */
router.post("/:id/reviews", isAuthenticated, async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;
        const serviceId = req.params.id;
        const user = await storage.getUser(userId);

        if (!user?.isVerified) {
            return res.status(403).json({ message: "Identity verification required to post reviews" });
        }

        // Check for active disputes - block reviews during disputes
        const service = await storage.getService(serviceId);
        if (service) {
            // Find any bookings between this user and vendor
            const userBookings = await db
                .select({ id: bookings.id })
                .from(bookings)
                .where(
                    and(
                        eq(bookings.customerId, userId),
                        eq(bookings.vendorId, service.ownerId)
                    )
                );

            const vendorBookings = await db
                .select({ id: bookings.id })
                .from(bookings)
                .where(
                    and(
                        eq(bookings.vendorId, userId),
                        eq(bookings.customerId, service.ownerId)
                    )
                );

            const allBookingIds = [...userBookings.map(b => b.id), ...vendorBookings.map(b => b.id)];

            if (allBookingIds.length > 0) {
                // Check for open disputes on any of these bookings
                for (const bookingId of allBookingIds) {
                    const [openDispute] = await db
                        .select()
                        .from(escrowDisputes)
                        .where(
                            and(
                                eq(escrowDisputes.bookingId, bookingId),
                                eq(escrowDisputes.status, "open")
                            )
                        )
                        .limit(1);

                    if (openDispute) {
                        return res.status(403).json({
                            message: "Cannot leave reviews while an active dispute exists. Please resolve the dispute first.",
                            disputeId: openDispute.id
                        });
                    }
                }
            }
        }

        const validated = insertReviewSchema.parse(req.body);
        const review = await storage.createReview({
            ...validated,
            userId,
            serviceId,
        });

        res.status(201).json(review);
    } catch (error: any) {
        if (error.name === "ZodError") {
            return res.status(400).json({ message: fromZodError(error).message });
        }
        console.error("Error creating review:", error);
        res.status(500).json({ message: "Failed to create review" });
    }
});

// ===========================================
// EXPORTS
// ===========================================

export { router as servicesRouter };

export function registerServicesRoutes(app: any): void {
    app.use("/api/services", router);
}
