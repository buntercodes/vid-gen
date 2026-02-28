"use client";

import { useAuth } from "@/context/AuthContext";
import { rtdb } from "@/lib/firebase";
import { ref, onValue, query, limitToLast, orderByKey } from "firebase/database";
import { useEffect, useState } from "react";
import {
    Search,
    Video,
    Sparkles,
    Play,
    Download,
    Layers,
    Calendar,
    Clock,
    User,
    Monitor,
    Smartphone,
    Square,
    Film,
    Zap,
    ChevronRight,
    MoreHorizontal,
    Mail,
    List
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface GenerationRecord {
    id: string;
    userId: string;
    prompt: string;
    model: string;
    aspectRatio: string;
    duration: string;
    timestamp: string;
    type: string;
}

const iconMap: any = {
    "16:9": Monitor,
    "9:16": Smartphone,
    "1:1": Square,
    "21:9": Film,
};

export default function AdminGenerations() {
    const [generations, setGenerations] = useState<GenerationRecord[]>([]);
    const [userMap, setUserMap] = useState<Record<string, { email: string; displayName: string }>>({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!rtdb) {
            setLoading(false);
            return;
        }

        // Fetch generations (last 100)
        const genRef = query(ref(rtdb, "generations"), limitToLast(100));
        const unsubscribeGen = onValue(genRef, (snapshot) => {
            const data = snapshot.val() || {};
            const list = Object.entries(data).map(([id, record]: [string, any]) => ({
                id,
                ...record
            })).reverse();
            setGenerations(list);
            setLoading(false);
        });

        // Fetch user map for emails
        const usersRef = ref(rtdb, "users");
        const unsubscribeUsers = onValue(usersRef, (snapshot) => {
            const data = snapshot.val() || {};
            const mapping: any = {};
            Object.entries(data).forEach(([uid, profile]: [string, any]) => {
                mapping[uid] = {
                    email: profile.email,
                    displayName: profile.displayName
                };
            });
            setUserMap(mapping);
        });

        return () => {
            unsubscribeGen();
            unsubscribeUsers();
        };
    }, []);

    const filteredGens = generations.filter(g =>
        g.prompt?.toLowerCase().includes(search.toLowerCase()) ||
        userMap[g.userId]?.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* Filters Area */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full max-w-md group">
                    <div className="absolute inset-0 bg-purple-500/10 rounded-2xl blur-xl group-focus-within:bg-purple-500/20 transition-all opacity-0 group-hover:opacity-100 dark:group-hover:opacity-20" />
                    <div className="relative bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-white/5 rounded-2xl px-4 py-3 flex items-center gap-3">
                        <Search className="text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by prompt or user email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-transparent border-none focus:outline-none text-slate-900 dark:text-white w-full placeholder:text-slate-300 dark:placeholder:text-gray-600 text-sm"
                        />
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="px-4 py-2 bg-slate-900 dark:bg-white/5 border border-white/10 rounded-xl flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-gray-400">Activity Level</span>
                        <span className="text-xl font-black text-white px-2 border-l border-white/10 ml-2">Moderate</span>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-2" />
                    </div>
                </div>
            </div>

            {/* Generations Log */}
            <div className="bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-white/5 rounded-[40px] overflow-hidden shadow-2xl transition-all hover:border-purple-500/10">
                <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <List className="text-purple-500" />
                        Live Command Stream
                    </h2>
                    <div className="flex gap-4">
                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-gray-600">Showing Last 100</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-white/[0.01] border-b border-slate-100 dark:border-white/5">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500">Video Content</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500">Creator</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500">Parameters</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500">Timestamp</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {filteredGens.map((g, idx) => {
                                const RatioIcon = iconMap[g.aspectRatio] || Monitor;
                                const userData = userMap[g.userId] || { email: "Unknown", displayName: "Unknown" };
                                return (
                                    <motion.tr
                                        key={g.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.02 }}
                                        className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors"
                                    >
                                        <td className="px-8 py-6 min-w-[300px]">
                                            <div className="flex gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center shrink-0 border border-white/5 relative group-hover:scale-105 transition-transform">
                                                    <Video size={18} className="text-purple-500" />
                                                    <div className="absolute top-0 right-0 p-1">
                                                        <div className="w-1 h-1 rounded-full bg-purple-500 animate-ping" />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-xs font-black text-slate-900 dark:text-white line-clamp-2 leading-relaxed tracking-tight break-words uppercase">{g.prompt}</span>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-[9px] font-black uppercase tracking-widest rounded-md">{g.model.split('-')[0]}</span>
                                                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-500 text-[9px] font-black uppercase tracking-widest rounded-md">{g.type}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                                                    <User size={14} className="text-slate-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-900 dark:text-white">{userData.displayName}</span>
                                                    <span className="text-[10px] text-slate-400 dark:text-gray-500">{userData.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-gray-400">
                                                    <RatioIcon size={14} className="text-blue-500" />
                                                    <span>{g.aspectRatio}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-gray-400">
                                                    <Clock size={14} className="text-amber-500" />
                                                    <span>{g.duration}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-gray-400">
                                                <span>{new Date(g.timestamp).toLocaleDateString()}</span>
                                                <span className="text-[9px] opacity-60 mt-1">{new Date(g.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-purple-500 hover:bg-white dark:hover:bg-white/10 flex items-center justify-center transition-all border border-transparent hover:border-purple-500/20 shadow-sm">
                                                <Play size={18} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                )
                            })}
                        </tbody>
                    </table>

                    {!loading && filteredGens.length === 0 && (
                        <div className="py-20 text-center uppercase tracking-[0.2em] font-black text-[10px] text-slate-400 dark:text-gray-600">
                            Null stream: No telemetry data matching filter
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
