'use server';

import { getDb } from "@/lib/postgres";
import { utilities } from "@/lib/db/schema";
import type { UtilityCategory } from "@/components/cec-form/schema";
import { eq, and, asc, inArray } from "drizzle-orm";

// Get a list of items for a specific category
export async function getUtilityList(category: UtilityCategory): Promise<string[]> {
    try {
        const db = getDb();
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

// New function to get multiple utility lists at once
export async function getUtilities(categories: UtilityCategory[]): Promise<Record<UtilityCategory, string[]>> {
    try {
        if (categories.length === 0) {
            return {} as Record<UtilityCategory, string[]>;
        }
        
        const db = getDb();
        const results = await db.select({
            category: utilities.category,
            item: utilities.item
        })
        .from(utilities)
        .where(inArray(utilities.category, categories))
        .orderBy(asc(utilities.category), asc(utilities.item));

        // Initialize the record with empty arrays for each requested category
        const grouped = categories.reduce((acc, cat) => {
            acc[cat] = [];
            return acc;
        }, {} as Record<UtilityCategory, string[]>);

        // Populate the arrays with items from the database results
        for (const row of results) {
            // The `inArray` filter ensures that row.category is a key in our `grouped` object
            grouped[row.category as UtilityCategory].push(row.item);
        }

        return grouped;
    } catch (error) {
        console.error(`Error getting utility lists for categories:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to get utility lists: ${errorMessage}`);
    }
}


// Add a new item to a category list
export async function addUtilityItem(category: UtilityCategory, item: string): Promise<void> {
    try {
        const db = getDb();
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
        const db = getDb();
        await db.delete(utilities)
            .where(and(eq(utilities.category, category), eq(utilities.item, item)));
    } catch (error) {
        console.error(`Error deleting item from ${category}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to delete item from ${category}: ${errorMessage}`);
    }
}