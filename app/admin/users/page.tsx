"use client";

import { useAuth } from "@/context/AuthContext";
import { rtdb } from "@/lib/firebase";
import { ref, onValue, update, remove } from "firebase/database";
import { useEffect, useState } from "react";
import {
    Search,
    MoreVertical,
    ShieldCheck,
    User,
    Zap,
    Trash2,
    ShieldAlert,
    Edit2,
    Check,
    X,
    CreditCard,
    Mail,
    ExternalLink,
    Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    isAdmin: boolean;
    allowedCredits: number;
    createdAt: string;
    usage?: {
        videosUsed: number;
        weekStart: string;
    };
}

export default function UserManagement() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editCredits, setEditCredits] = useState<number>(0);

    useEffect(() => {
        if (!rtdb) {
            setLoading(false);
            return;
        }

        const usersRef = ref(rtdb, "users");
        const unsubscribe = onValue(usersRef, (snapshot) => {
            const data = snapshot.val() || {};
            const userList = Object.entries(data).map(([uid, profile]: [string, any]) => ({
                uid,
                ...profile
            }));
            setUsers(userList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
        if (!rtdb) return;
        await update(ref(rtdb, `users/${userId}`), { isAdmin: !currentStatus });
    };

    const handleUpdateCredits = async (userId: string) => {
        if (!rtdb) return;
        await update(ref(rtdb, `users/${userId}`), { allowedCredits: editCredits });
        setEditingId(null);
    };

    const handleDeleteUser = async (userId: string) => {
        if (!rtdb || !confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
        try {
            await remove(ref(rtdb, `users/${userId}`));
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Failed to delete user mapping. Note: This only removes the database entry, not the Auth account.");
        }
    };

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.displayName?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* Search Header */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full max-w-md group">
                    <div className="absolute inset-0 bg-purple-500/10 rounded-2xl blur-xl group-focus-within:bg-purple-500/20 transition-all" />
                    <div className="relative bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-white/5 rounded-2xl px-4 py-3 flex items-center gap-3">
                        <Search className="text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search users by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-transparent border-none focus:outline-none text-slate-900 dark:text-white w-full placeholder:text-slate-300 dark:placeholder:text-gray-600 text-sm font-medium"
                        />
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="px-4 py-2 bg-purple-600/10 border border-purple-500/20 rounded-xl flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">Total Registered</span>
                        <span className="text-xl font-black text-slate-900 dark:text-white px-2 border-l border-slate-200 dark:border-white/10 ml-2">{users.length}</span>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500">User Profile</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500">Status</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500 text-center">Plan Limit (WIP)</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500 text-center">Allowed Credits</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            <AnimatePresence>
                                {filteredUsers.map((u, idx) => (
                                    <motion.tr
                                        key={u.uid}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors"
                                    >
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-white/10 dark:to-white/5 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                                                    {u.photoURL ? (
                                                        <img src={u.photoURL} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="text-slate-400 dark:text-gray-500" size={24} />
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{u.displayName || "Unknown Creator"}</span>
                                                    <span className="text-xs text-slate-400 dark:text-gray-500 truncate">{u.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            {u.isAdmin ? (
                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase tracking-tighter">
                                                    <ShieldCheck size={12} />
                                                    Administrator
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full text-slate-500 dark:text-gray-500 text-[10px] font-black uppercase tracking-tighter">
                                                    Standard User
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-gray-600 rounded-lg">Free Tier (0)</span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            {editingId === u.uid ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={editCredits}
                                                        onChange={(e) => setEditCredits(parseInt(e.target.value) || 0)}
                                                        className="w-16 bg-white dark:bg-white/5 border border-purple-500/30 rounded-lg px-2 py-1 text-xs text-center focus:outline-none"
                                                        autoFocus
                                                    />
                                                    <button onClick={() => handleUpdateCredits(u.uid)} className="p-1 h-7 w-7 bg-emerald-500 text-white rounded-lg hover:scale-110 transition-all flex items-center justify-center">
                                                        <Check size={14} />
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="p-1 h-7 w-7 bg-slate-100 dark:bg-white/10 text-slate-500 rounded-lg hover:scale-110 transition-all flex items-center justify-center">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center gap-3 group/edit">
                                                    <span className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                                                        {u.allowedCredits ?? 0}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(u.uid);
                                                            setEditCredits(u.allowedCredits || 0);
                                                        }}
                                                        className="p-1.5 opacity-0 group-hover/edit:opacity-100 text-slate-400 hover:text-purple-500 transition-all"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-5 text-right flex justify-end gap-2">
                                            <button
                                                onClick={() => handleToggleAdmin(u.uid, u.isAdmin)}
                                                title={u.isAdmin ? "Revoke Admin" : "Make Admin"}
                                                className={cn(
                                                    "h-9 w-9 rounded-xl flex items-center justify-center transition-all",
                                                    u.isAdmin ? "bg-purple-600 text-white shadow-lg" : "bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-purple-500"
                                                )}
                                            >
                                                <ShieldAlert size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(u.uid)}
                                                className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-red-500 flex items-center justify-center transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>

                    {filteredUsers.length === 0 && !loading && (
                        <div className="py-20 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-4">
                                <Search className="text-slate-200" size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No results found</h3>
                            <p className="text-sm text-slate-400">Try adjusting your search query</p>
                        </div>
                    )}

                    {loading && (
                        <div className="py-20 flex flex-col items-center justify-center">
                            <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
