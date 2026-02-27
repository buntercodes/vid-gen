"use client";

import { useState, useEffect } from "react";
import {
    signInWithPopup,
    GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Chrome, AlertCircle } from "lucide-react";

export const LoginCard = () => {
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    // Automatically redirect if user is already logged in or just logged in
    useEffect(() => {
        if (user && !authLoading) {
            router.push("/");
        }
    }, [user, authLoading, router]);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError("");
        const provider = new GoogleAuthProvider();
        if (!auth) {
            setError("Firebase is not properly configured. Please check your environment variables.");
            setLoading(false);
            return;
        }
        try {
            await signInWithPopup(auth, provider);
            // Redirection is handled by the useEffect above
        } catch (err: any) {
            console.error("Login error:", err);
            setError(err.message || "Failed to sign in with Google.");
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <button
                onClick={handleGoogleLogin}
                disabled={loading || authLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 to-blue-500 p-4 rounded-xl text-white font-semibold flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-purple-500/20"
            >
                {loading || authLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <>
                        <Chrome className="w-5 h-5" />
                        Continue with Google
                    </>
                )}
            </button>

            <p className="text-center text-xs text-gray-500 leading-relaxed px-4">
                By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
        </div>
    );
};


