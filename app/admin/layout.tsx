"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
    Users,
    LayoutDashboard,
    History,
    ChevronLeft,
    ShieldCheck,
    Menu,
    X,
    CreditCard,
    Video
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const sidebarItems = [
    { id: "dashboard", name: "Dashboard", icon: LayoutDashboard, href: "/admin" },
    { id: "users", name: "Manage Users", icon: Users, href: "/admin/users" },
    { id: "generations", name: "Global History", icon: History, href: "/admin/generations" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isAdmin, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        if (!loading && (!user || !isAdmin)) {
            router.push("/");
        }
    }, [user, isAdmin, loading, router]);

    if (loading || !user || !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#050505] transition-colors duration-500">
                <div className="w-10 h-10 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#080808] flex transition-colors duration-500 overflow-hidden">
            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 bg-white dark:bg-[#0c0c0c] border-r border-slate-200 dark:border-white/5 transition-all duration-300 transform",
                    sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0 lg:w-20"
                )}
            >
                <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        {sidebarOpen && (
                            <span className="font-bold tracking-tight text-slate-900 dark:text-white truncate">Admin Panel</span>
                        )}
                    </div>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400"
                    >
                        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>

                <nav className="p-4 space-y-2">
                    {sidebarItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                                    isActive
                                        ? "bg-purple-600/10 text-purple-600 dark:text-purple-400"
                                        : "text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-purple-600 dark:text-purple-400" : "text-slate-400 dark:text-gray-500 group-hover:text-purple-500")} />
                                {sidebarOpen && <span className="text-sm font-semibold">{item.name}</span>}
                                {isActive && (
                                    <motion.div
                                        layoutId="admin-nav-active"
                                        className="absolute left-0 w-1 h-6 bg-purple-600 rounded-r-full"
                                    />
                                )}
                            </Link>
                        )
                    })}
                </nav>

                <div className="absolute bottom-6 left-0 right-0 px-4">
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                    >
                        <ChevronLeft className="w-5 h-5 shrink-0" />
                        {sidebarOpen && <span className="text-sm font-semibold">Exit Admin</span>}
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className={cn(
                "flex-1 flex flex-col transition-all duration-300 min-w-0 h-screen overflow-hidden",
                sidebarOpen ? "lg:ml-64" : "lg:ml-20"
            )}>
                <header className="h-20 border-b border-slate-200 dark:border-white/5 bg-white/50 dark:bg-[#080808]/50 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
                    <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        {sidebarItems.find(i => i.href === pathname)?.icon && (
                            <span className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg">
                                {(() => {
                                    const Icon = sidebarItems.find(i => i.href === pathname)?.icon;
                                    return Icon ? <Icon size={18} className="text-purple-500" /> : null;
                                })()}
                            </span>
                        )}
                        {sidebarItems.find(i => i.href === pathname)?.name || "Admin"}
                    </h1>

                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">{user.displayName || "Admin User"}</span>
                            <span className="text-[10px] uppercase tracking-tighter text-purple-600 dark:text-purple-400 font-black">System Administrator</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/20">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    {children}
                </div>
            </main>
        </div>
    );
}
