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

const WEEKLY_LIMIT = 100;

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
    const usageRef = ref(rtdb, `users/${userId}/usage`);

    const snapshot = await get(usageRef);
    let data = snapshot.exists() ? snapshot.val() : null;

    if (!data || data.weekStart !== currentWeek) {
        // Reset or initialize quota for a new week
        data = {
            weekStart: currentWeek,
            videosUsed: 0
        };
        await set(usageRef, data);
    }

    return {
        videosUsed: data.videosUsed || 0,
        videosTotal: WEEKLY_LIMIT,
        weekStart: data.weekStart
    };
}

export async function checkQuota(userId: string): Promise<boolean> {
    const quota = await getUserQuota(userId);
    return quota.videosUsed < quota.videosTotal;
}

export async function incrementQuota(userId: string): Promise<void> {
    if (!rtdb) return;
    const currentWeek = getWeekStart();
    const usageRef = ref(rtdb, `users/${userId}/usage`);

    // Ensure we are incrementing the current week's quota appropriately
    await update(usageRef, {
        videosUsed: increment(1),
        weekStart: currentWeek
    });
}
