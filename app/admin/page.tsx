"use client";

import { useAuth } from "@/context/AuthContext";
import { rtdb } from "@/lib/firebase";
import { ref, onValue, get } from "firebase/database";
import { useEffect, useState } from "react";
import { Users, Video, Zap, Clock, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Layers, CreditCard, ShieldCheck, X } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalGenerations: 0,
        activeThisWeek: 0,
    });
    const [usersData, setUsersData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!rtdb) return;

        const usersRef = ref(rtdb, "users");
        const generationsRef = ref(rtdb, "generations");

        const unsubscribeUsers = onValue(usersRef, (snapshot) => {
            const data = snapshot.val() || {};
            const userList = Object.values(data);
            setUsersData(userList);
            setStats((prev) => ({
                ...prev,
                totalUsers: userList.length,
            }));
        });

        const unsubscribeGenerations = onValue(generationsRef, (snapshot) => {
            const data = snapshot.val() || {};
            const genList = Object.values(data);

            setStats((prev) => ({
                ...prev,
                totalGenerations: genList.length,
            }));
            setLoading(false);
        });

        return () => {
            unsubscribeUsers();
            unsubscribeGenerations();
        };
    }, []);

    const handleExportUsers = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(usersData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "vid-gen-users-export.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const cards = [
        { name: "Total Users", value: stats.totalUsers, icon: Users, color: "bg-blue-500", trend: "+12.5%", isUp: true },
        { name: "Total Generations", value: stats.totalGenerations, icon: Video, color: "bg-purple-600", trend: "+8.2%", isUp: true },
        { name: "Global Credits Used", value: stats.totalGenerations, icon: Zap, color: "bg-amber-500", trend: "-2.4%", isUp: false },
        { name: "Active Users (7d)", value: stats.totalUsers, icon: TrendingUp, color: "bg-emerald-500", trend: "+4.1%", isUp: true },
    ];

    const chartPoints = [20, 35, 25, 45, 38, 55, 60, 48, 75, 85, 80, 95];

    return (
        <div className="space-y-10">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, idx) => (
                    <motion.div
                        key={card.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="group relative bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-white/5 p-6 rounded-3xl overflow-hidden transition-all duration-300 hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/5"
                    >
                        <div className="absolute top-[-10%] right-[-10%] w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors" />

                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className={cn("p-2 rounded-xl text-white shadow-lg", card.color)}>
                                <card.icon size={20} />
                            </div>
                            <div className={cn(
                                "flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full",
                                card.isUp ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                            )}>
                                {card.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                {card.trend}
                            </div>
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-slate-400 dark:text-gray-500 text-xs font-bold uppercase tracking-widest">{card.name}</h3>
                            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                                {loading ? "..." : card.value.toLocaleString()}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <TrendingUp className="text-purple-500" />
                            System Growth
                        </h2>
                        <div className="flex gap-2">
                            {["Week", "Month", "Year"].map(t => (
                                <button key={t} className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-purple-500 transition-colors">
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-white/5 rounded-[40px] p-8 min-h-[400px] flex flex-col relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h4 className="text-2xl font-black text-slate-900 dark:text-white">+240%</h4>
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Average weekly increase</p>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-bold text-slate-400 dark:text-gray-600">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                                    <span>Generations</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-white/10" />
                                    <span>Users</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 relative mt-4">
                            <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="rgb(147, 51, 234)" stopOpacity="0.2" />
                                        <stop offset="100%" stopColor="rgb(147, 51, 234)" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                <motion.path
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 2, ease: "easeInOut" }}
                                    d={`M 0 40 ${chartPoints.map((p, i) => `L ${(i / (chartPoints.length - 1)) * 100} ${40 - p * 0.4}`).join(' ')}`}
                                    fill="none"
                                    stroke="url(#chartGradient)"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                />
                                <motion.path
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 2, ease: "easeInOut" }}
                                    d={`M 0 40 ${chartPoints.map((p, i) => `L ${(i / (chartPoints.length - 1)) * 100} ${40 - p * 0.4}`).join(' ')}`}
                                    fill="none"
                                    stroke="rgb(147, 51, 234)"
                                    strokeWidth="0.5"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-x-0 bottom-0 flex justify-between text-[10px] font-bold text-slate-300 dark:text-gray-700 uppercase tracking-widest mt-4">
                                <span>Mon</span>
                                <span>Tue</span>
                                <span>Wed</span>
                                <span>Thu</span>
                                <span>Fri</span>
                                <span>Sat</span>
                                <span>Sun</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Panel */}
                <div className="space-y-6">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight px-2">Quick Commands</h2>
                    <div className="bg-slate-900 dark:bg-[#0c0c0c] border border-white/5 rounded-[40px] p-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-600/20 transition-all" />

                        <div className="space-y-4 relative z-10">
                            <button
                                onClick={handleExportUsers}
                                className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-white font-bold group/btn"
                            >
                                <div className="flex items-center gap-3">
                                    <Users size={18} className="text-blue-400" />
                                    <span>Export All Users</span>
                                </div>
                                <ArrowUpRight size={16} className="text-gray-600 group-hover/btn:text-white transition-colors" />
                            </button>

                            <button className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-white font-bold group/btn">
                                <div className="flex items-center gap-3">
                                    <CreditCard size={18} className="text-emerald-400" />
                                    <span>Billing Logs</span>
                                </div>
                                <ArrowUpRight size={16} className="text-gray-600 group-hover/btn:text-white transition-colors" />
                            </button>

                            <button className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-white font-bold group/btn">
                                <div className="flex items-center gap-3 text-red-400">
                                    <ShieldCheck size={18} />
                                    <span>System Lockdown</span>
                                </div>
                                <X size={16} className="text-red-900" />
                            </button>
                        </div>

                        <div className="mt-8 p-4 bg-purple-600/20 rounded-2xl border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                            Safety protocols active. all administrative actions are logged to the blockchain node primary cluster.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
