import { rtdb } from "./firebase";
import { ref, get, update, increment, set } from "firebase/database";

// Utility to get the start of the current week (Monday)
export function getWeekStart() {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    const weekStart = new Date(d.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart.toISOString().split('T')[0];
}

const WEEKLY_LIMIT = 0;

export interface QuotaData {
    videosUsed: number;
    videosTotal: number;
    weekStart: string;
}

export async function getUserQuota(userId: string): Promise<QuotaData> {
    if (!userId) throw new Error("User ID is required");

    const currentWeek = getWeekStart();
    if (!rtdb) {
        return {
            videosUsed: 0,
            videosTotal: WEEKLY_LIMIT,
            weekStart: currentWeek
        };
    }

    // Fetch the entire user profile to check for admin-allocated credits (allowedCredits)
    const userRef = ref(rtdb, `users/${userId}`);
    const snapshot = await get(userRef);
    const userData = snapshot.val() || {};

    let usage = userData.usage;
    // Admin can set 'allowedCredits' directly in the user node to override global limit
    const allowedCredits = userData.allowedCredits ?? WEEKLY_LIMIT;

    // If allowedCredits is missing in DB, populate it with current default
    if (userData.allowedCredits === undefined) {
        await update(userRef, { allowedCredits: WEEKLY_LIMIT });
    }

    if (!usage || usage.weekStart !== currentWeek) {
        // Reset or initialize usage for the current week
        usage = {
            weekStart: currentWeek,
            videosUsed: 0
        };
        const usageRef = ref(rtdb, `users/${userId}/usage`);
        await set(usageRef, usage);
    }

    return {
        videosUsed: usage.videosUsed || 0,
        videosTotal: allowedCredits,
        weekStart: usage.weekStart
    };
}

export async function checkQuota(userId: string): Promise<boolean> {
    const quota = await getUserQuota(userId);
    return quota.videosUsed < quota.videosTotal;
}

export async function incrementQuota(userId: string, generationDetails?: any): Promise<void> {
    if (!rtdb) return;
    const currentWeek = getWeekStart();
    const usageRef = ref(rtdb, `users/${userId}/usage`);
    const globalGenerationsRef = ref(rtdb, `generations`);
    const newGenRef = ref(rtdb, `generations/${Date.now()}_${userId}`);

    // Ensure we are incrementing the current week's quota appropriately
    await update(usageRef, {
        videosUsed: increment(1),
        weekStart: currentWeek
    });

    // Log the generation globally
    if (generationDetails) {
        await set(newGenRef, {
            ...generationDetails,
            userId,
            timestamp: new Date().toISOString()
        });
    }
}

