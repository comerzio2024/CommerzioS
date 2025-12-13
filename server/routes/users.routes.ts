/**
 * Users Routes
 * 
 * Modular endpoints for user management:
 * - Profile CRUD
 * - Address management
 * - User transactions
 * - Account deactivation
 */

import { Router, Response } from "express";
import { isAuthenticated } from "../auth";
import { storage } from "../storage";
import { db } from "../db";
import { eq, desc } from "drizzle-orm";
import { users, userAddresses, creditTransactions } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

const router = Router();

// ===========================================
// PROFILE
// ===========================================

/**
 * PATCH /api/users/me
 * Update current user profile
 */
router.patch("/me", isAuthenticated, async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;
        const {
            firstName, lastName, bio, phone, profileImageUrl,
            preferredLanguage, businessName, vatNumber,
        } = req.body;

        const updates: any = {};
        if (firstName !== undefined) updates.firstName = firstName;
        if (lastName !== undefined) updates.lastName = lastName;
        if (bio !== undefined) updates.bio = bio;
        if (phone !== undefined) updates.phone = phone;
        if (profileImageUrl !== undefined) updates.profileImageUrl = profileImageUrl;
        if (preferredLanguage !== undefined) updates.preferredLanguage = preferredLanguage;
        if (businessName !== undefined) updates.businessName = businessName;
        if (vatNumber !== undefined) updates.vatNumber = vatNumber;

        if (Object.keys(updates).length > 0) {
            updates.updatedAt = new Date();
            await db.update(users).set(updates).where(eq(users.id, userId));
        }

        const user = await storage.getUser(userId);
        res.json(user);
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Failed to update profile" });
    }
});

/**
 * DELETE /api/users/me
 * Delete current user account
 */
router.delete("/me", isAuthenticated, async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;
        await storage.deleteUser(userId);
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting account:", error);
        res.status(500).json({ message: "Failed to delete account" });
    }
});

/**
 * POST /api/users/me/deactivate
 * Deactivate current user account
 */
router.post("/me/deactivate", isAuthenticated, async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;
        const { deactivateUser } = await import("../authService");
        const result = await deactivateUser(userId);
        res.json(result);
    } catch (error: any) {
        console.error("Error deactivating account:", error);
        res.status(500).json({ message: error.message || "Failed to deactivate account" });
    }
});

// ===========================================
// ADDRESSES
// ===========================================

/**
 * GET /api/users/me/addresses
 * Get user addresses
 */
router.get("/me/addresses", isAuthenticated, async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;
        const addresses = await db.select()
            .from(userAddresses)
            .where(eq(userAddresses.userId, userId))
            .orderBy(desc(userAddresses.isDefault));
        res.json(addresses);
    } catch (error) {
        console.error("Error fetching addresses:", error);
        res.status(500).json({ message: "Failed to fetch addresses" });
    }
});

/**
 * POST /api/users/me/addresses
 * Add address
 */
router.post("/me/addresses", isAuthenticated, async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;
        const { label, street, city, postalCode, canton, country, isDefault } = req.body;

        // If setting as default, unset others
        if (isDefault) {
            await db.update(userAddresses)
                .set({ isDefault: false })
                .where(eq(userAddresses.userId, userId));
        }

        const [address] = await db.insert(userAddresses).values({
            userId,
            label,
            street,
            city,
            postalCode,
            canton,
            country: country || "CH",
            isDefault: isDefault || false,
        }).returning();

        res.status(201).json(address);
    } catch (error) {
        console.error("Error adding address:", error);
        res.status(500).json({ message: "Failed to add address" });
    }
});

/**
 * PATCH /api/users/me/addresses/:id
 * Update address
 */
router.patch("/me/addresses/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;
        const addressId = req.params.id;

        // Verify ownership
        const [existing] = await db.select()
            .from(userAddresses)
            .where(eq(userAddresses.id, addressId))
            .limit(1);

        if (!existing || existing.userId !== userId) {
            return res.status(404).json({ message: "Address not found" });
        }

        const { label, street, city, postalCode, canton, country, isDefault } = req.body;

        if (isDefault) {
            await db.update(userAddresses)
                .set({ isDefault: false })
                .where(eq(userAddresses.userId, userId));
        }

        const [updated] = await db.update(userAddresses)
            .set({
                label: label ?? existing.label,
                street: street ?? existing.street,
                city: city ?? existing.city,
                postalCode: postalCode ?? existing.postalCode,
                canton: canton ?? existing.canton,
                country: country ?? existing.country,
                isDefault: isDefault ?? existing.isDefault,
            })
            .where(eq(userAddresses.id, addressId))
            .returning();

        res.json(updated);
    } catch (error) {
        console.error("Error updating address:", error);
        res.status(500).json({ message: "Failed to update address" });
    }
});

/**
 * DELETE /api/users/me/addresses/:id
 * Delete address
 */
router.delete("/me/addresses/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;
        const addressId = req.params.id;

        // Verify ownership
        const [existing] = await db.select()
            .from(userAddresses)
            .where(eq(userAddresses.id, addressId))
            .limit(1);

        if (!existing || existing.userId !== userId) {
            return res.status(404).json({ message: "Address not found" });
        }

        await db.delete(userAddresses).where(eq(userAddresses.id, addressId));
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting address:", error);
        res.status(500).json({ message: "Failed to delete address" });
    }
});

// ===========================================
// TRANSACTIONS
// ===========================================

/**
 * GET /api/users/me/transactions
 * Get user credit transactions
 */
router.get("/me/transactions", isAuthenticated, async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;
        const limit = parseInt(req.query.limit as string) || 50;

        const transactions = await db.select()
            .from(creditTransactions)
            .where(eq(creditTransactions.userId, userId))
            .orderBy(desc(creditTransactions.createdAt))
            .limit(limit);

        res.json(transactions);
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ message: "Failed to fetch transactions" });
    }
});

// ===========================================
// EXPORTS
// ===========================================

export { router as usersRouter };

export function registerUsersRoutes(app: any): void {
    app.use("/api/users", router);
}
