"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
    onAuthStateChanged,
    User,
    signOut as firebaseSignOut
} from "firebase/auth";
import { auth, rtdb } from "@/lib/firebase";
import { ref, onValue, set, get, update } from "firebase/database";

interface AuthContextType {
    user: User | null;
    isAdmin: boolean;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isAdmin: false,
    loading: true,
    logout: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            if (!user) {
                setIsAdmin(false);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user) return;

        if (!rtdb) {
            setLoading(false);
            return;
        }

        const userRef = ref(rtdb, `users/${user.uid}`);

        // Initialize/Update user node with default fields
        get(userRef).then((snapshot) => {
            const data = snapshot.val();
            if (!snapshot.exists()) {
                set(userRef, {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    createdAt: new Date().toISOString(),
                    isAdmin: false,
                    allowedCredits: 0
                });
            } else if (data) {
                const updates: any = {};
                if (data.isAdmin === undefined) updates.isAdmin = false;
                if (data.allowedCredits === undefined) updates.allowedCredits = 0;

                if (Object.keys(updates).length > 0) {
                    update(userRef, updates);
                }
            }
        }).catch(err => {
            console.error("Error fetching user stats:", err);
            setLoading(false);
        });

        const unsubscribeAdmin = onValue(ref(rtdb, `users/${user.uid}/isAdmin`), (snapshot) => {
            setIsAdmin(!!snapshot.val());
            setLoading(false);
        }, (err) => {
            console.error("Admin status listener error:", err);
            setLoading(false);
        });

        return () => unsubscribeAdmin();
    }, [user]);

    const logout = async () => {
        if (!auth) return;
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isAdmin, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

