'use server';

import { db } from "@/lib/db";
import { utilities } from "@/lib/db/schema";
import type { UtilityCategory } from "@/components/cec-form/schema";
import { eq, and, asc } from "drizzle-orm";

// Get a list of items for a specific category
export async function getUtilityList(category: UtilityCategory): Promise<string[]> {
    try {
        const results = await db.select({ item: utilities.item })
            .from(utilities)
            .where(eq(utilities.category, category))
            .orderBy(asc(utilities.item));
        
        return results.map(row => row.item);
    } catch (error) {
        console.error(`Error getting utility list for ${category}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to get utility list for ${category}: ${errorMessage}`);
    }
}

// Add a new item to a category list
export async function addUtilityItem(category: UtilityCategory, item: string): Promise<void> {
    try {
        await db.insert(utilities).values({ category, item });
    } catch (error) {
        console.error(`Error adding item to ${category}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        // Don't throw a generic error, let the UI handle duplicate errors
        if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint')) {
            throw new Error(`L'élément "${item}" existe déjà dans cette catégorie.`);
        }
        throw new Error(`Failed to add item to ${category}: ${errorMessage}`);
    }
}

// Delete an item from a category list
export async function deleteUtilityItem(category: UtilityCategory, item: string): Promise<void> {
    try {
        await db.delete(utilities)
            .where(and(eq(utilities.category, category), eq(utilities.item, item)));
    } catch (error) {
        console.error(`Error deleting item from ${category}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to delete item from ${category}: ${errorMessage}`);
    }
}