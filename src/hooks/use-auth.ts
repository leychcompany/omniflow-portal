"use client";

import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth-store";
import type { User } from "@/types";
import { useCallback, useEffect } from "react";

export function useAuth() {
  const { user, setUser, setLoading, setMustChangePassword } = useAuthStore();

  const markInvitesAsUsed = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch("/api/invites/mark-used", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
    } catch (error) {
      console.error("useAuth: Error marking invite as used:", error);
    }
  }, []);

  const fetchUserProfile = useCallback(
    async (_userId: string) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
        const res = await fetch(`/api/profile?t=${Date.now()}`, {
          credentials: "include",
          headers,
          cache: "no-store",
        });
        if (!res.ok) {
          console.error("Error fetching user profile:", await res.json().catch(() => ({})));
          setUser(null);
          useAuthStore.getState().signOut();
          setLoading(false);
          return;
        }
        const data = (await res.json()) as User;
        setUser(data);
        await markInvitesAsUsed();
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUser(null);
        useAuthStore.getState().signOut();
      } finally {
        setLoading(false);
      }
    },
    [markInvitesAsUsed, setLoading, setUser]
  );

  useEffect(() => {
    const refreshProfile = () => {
      setLoading(true);
      supabase.auth
        .getSession()
        .then(({ data: { session } }) => {
          if (session?.user) {
            fetchUserProfile(session.user.id);
          } else {
            setUser(null);
            setLoading(false);
          }
        })
        .catch((error) => {
          console.error("useAuth: Error getting session:", error);
          setUser(null);
          setLoading(false);
        });
    };

    refreshProfile();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshProfile();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const handleRefreshEvent = () => refreshProfile();
    document.addEventListener("auth:refreshProfile", handleRefreshEvent);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("auth:refreshProfile", handleRefreshEvent);
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, setLoading, setUser]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setMustChangePassword(/Aa![0-9]{3,}$/.test(password));
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`
      : (typeof window !== "undefined" ? window.location.origin : "") + "/auth/reset-password";
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl });
    if (error) throw error;
  };

  return { user, signIn, signOut, resetPassword };
}
