"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Zap, Sparkles, CreditCard, Clock, Video, Info } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getUserQuota, type QuotaData } from "@/lib/quota";

export default function PlanPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [quota, setQuota] = useState<QuotaData | null>(null);
    const [dbError, setDbError] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        } else if (user) {
            getUserQuota(user.uid)
                .then(setQuota)
                .catch((err) => {
                    console.error("Firebase Database Error:", err);
                    setDbError(err.message || "Could not connect to database.");
                    // Fallback so it doesn't infinite load
                    setQuota({ videosUsed: 0, videosTotal: 0, weekStart: new Date().toISOString() });
                });
        }
    }, [user, loading, router]);

    if (loading || !mounted || !user || !quota) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#080808] transition-colors duration-500">
                <div className="w-10 h-10 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
            </div>
        );
    }

    const videoPercentage = quota.videosTotal > 0 ? Math.round((quota.videosUsed / quota.videosTotal) * 100) : 0;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#080808] text-slate-900 dark:text-slate-200 font-sans selection:bg-purple-500/30 overflow-y-auto w-full transition-colors duration-500">

            {/* Background Zen Glow */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 dark:bg-purple-900/10 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 dark:bg-blue-900/10 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-pulse" style={{ animationDuration: '10s' }} />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
                {/* Header */}
                <header className="flex items-center justify-between mb-12">
                    <button
                        onClick={() => router.push("/")}
                        className="flex items-center gap-2 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-semibold">Back to Studio</span>
                    </button>
                </header>

                {/* Dashboard Title section */}
                <div className="mb-10 space-y-2">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Account Overview
                        </h1>
                        <p className="text-slate-500 dark:text-gray-400 mt-2">
                            Manage your current plan, check usage quotas, and view features.
                        </p>
                    </motion.div>
                </div>

                {dbError && (
                    <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-3">
                        <Info className="w-5 h-5 shrink-0" />
                        <p className="text-sm font-medium">
                            <strong className="block mb-0.5">Database Connection Error</strong>
                            {dbError}. Please ensure Realtime Database is enabled in Firebase Console and rules are public during testing.
                        </p>
                    </div>
                )}

                <div className="grid md:grid-cols-3 gap-8">

                    {/* Active Plan Card (Spans 1 Column) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="md:col-span-1 border border-purple-200 dark:border-purple-500/30 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 relative overflow-hidden flex flex-col shadow-xl shadow-purple-500/5"
                    >
                        {/* Inner Glow */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center shrink-0">
                                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Current Plan</p>
                                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Active</h2>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8 flex-1">
                            {[
                                "Priority GPU processing",
                                "1080p & 4K upscaling",
                                "Up to 10s video duration",
                                "No watermarks"
                            ].map((feature, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
                                    <span className="text-sm font-medium text-slate-700 dark:text-gray-300">{feature}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto space-y-3">
                            <div className="bg-slate-100 dark:bg-white/5 rounded-xl p-3 flex items-center gap-3">
                                <CreditCard className="w-4 h-4 text-slate-400 dark:text-gray-500" />
                                <div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-gray-400">Week started</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{new Date(quota.weekStart).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <button className="w-full py-2.5 rounded-xl font-bold text-sm text-slate-700 dark:text-white bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 transition-colors">
                                Manage Billing
                            </button>
                        </div>
                    </motion.div>

                    {/* Quotas & Usage Dashboard (Spans 2 Columns) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="md:col-span-2 space-y-6"
                    >
                        {/* Generated Videos Quota */}
                        <div className="bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                                        <Video className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">Video Generations</h3>
                                </div>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                    {quota.videosUsed} <span className="text-slate-500 dark:text-gray-400 font-medium">/ {quota.videosTotal}</span>
                                </span>
                            </div>

                            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${videoPercentage}%` }}
                                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                                    className={cn(
                                        "h-full rounded-full",
                                        videoPercentage > 90 ? "bg-red-500" : "bg-gradient-to-r from-blue-500 to-indigo-500"
                                    )}
                                />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-gray-400">
                                You have used {videoPercentage}% of your monthly video generation quota.
                            </p>
                        </div>

                        {/* Compute Minutes Quota - Removed as limit is now video count based */}


                    </motion.div>

                </div>
            </div>
        </div>
    );
}
