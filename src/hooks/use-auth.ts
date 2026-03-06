"use client";

import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth-store";
import type { User } from "@/types";
import { useCallback, useEffect } from "react";

// #region agent log
const _dbg = (loc: string, msg: string, data: Record<string, unknown>, hid: string) => {
  fetch("http://127.0.0.1:7775/ingest/26a70d74-ea86-4857-b4f3-d26f44a62a8d", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "53d7d4" },
    body: JSON.stringify({ sessionId: "53d7d4", location: loc, message: msg, data, timestamp: Date.now(), hypothesisId: hid }),
  }).catch(() => {});
};
// #endregion

export function useAuth() {
  const { user, setUser, setLoading, setMustChangePassword } = useAuthStore();

  const markInvitesAsUsed = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        return;
      }

      await fetch("/api/invites/mark-used", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
    } catch (error) {
      console.error("useAuth: Error marking invite as used:", error);
    }
  }, []);

  const fetchUserProfile = useCallback(
    async (_userId: string) => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
        // Use /api/profile which bypasses RLS and returns correct locked status
        const res = await fetch(`/api/profile?t=${Date.now()}`, {
          credentials: "include",
          headers,
          cache: "no-store",
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          // #region agent log
          _dbg("use-auth.ts:profile-fail", "Profile fetch failed, setUser(null)", { status: res.status, err }, "H2");
          // #endregion
          console.error("Error fetching user profile:", err);
          setUser(null);
          setLoading(false);
          return;
        }
        const data = (await res.json()) as User;
        // #region agent log
        _dbg("use-auth.ts:profile-ok", "Profile fetched, setUser(data)", { hasName: !!data?.name, hasEmail: !!data?.email, name: data?.name || null }, "H4");
        // #endregion
        setUser(data);
        await markInvitesAsUsed();
      } catch (error) {
        // #region agent log
        _dbg("use-auth.ts:profile-catch", "Profile fetch threw, setUser(null)", { err: String(error) }, "H2");
        // #endregion
        console.error("Error fetching user profile:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    },
    [markInvitesAsUsed, setLoading, setUser]
  );

  useEffect(() => {
    const refreshProfile = (trigger: string) => {
      setLoading(true);
      supabase.auth
        .getSession()
        .then(({ data: { session } }) => {
          const hasSession = !!session?.user;
          // #region agent log
          _dbg("use-auth.ts:getSession", "getSession result", { trigger, hasSession, userId: session?.user?.id?.slice(0, 8) }, "H1");
          // #endregion
          if (session?.user) {
            fetchUserProfile(session.user.id);
          } else {
            // #region agent log
            _dbg("use-auth.ts:session-null", "Session null, setUser(null)", { trigger }, "H1");
            // #endregion
            setUser(null);
            setLoading(false);
          }
        })
        .catch((error) => {
          // #region agent log
          _dbg("use-auth.ts:getSession-catch", "getSession threw, setUser(null)", { err: String(error) }, "H1");
          // #endregion
          console.error("useAuth: Error getting session:", error);
          setUser(null);
          setLoading(false);
        });
    };

    // Initial load and on page refresh - fetch immediately
    refreshProfile("init");

    // Refetch when user returns to tab (e.g. admin unlocked them while they had tab open)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshProfile("visibilitychange");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Listen for manual refresh (e.g. user clicks "Refresh" after admin unlocks)
    const handleRefreshEvent = () => refreshProfile("auth:refreshProfile");
    document.addEventListener("auth:refreshProfile", handleRefreshEvent);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const hasSession = !!session?.user;
      // #region agent log
      _dbg("use-auth.ts:onAuthStateChange", "Auth state changed", { event, hasSession, userId: session?.user?.id?.slice(0, 8) }, "H1");
      // #endregion
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        // #region agent log
        _dbg("use-auth.ts:onAuth-null", "onAuthStateChange session=null, setUser(null)", { event }, "H1");
        // #endregion
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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    // Heuristic: if matches our temp pattern, force change
    if (/Aa![0-9]{3,}$/.test(password)) {
      setMustChangePassword(true);
    } else {
      setMustChangePassword(false);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    // Use the auth/reset-password route which handles Supabase redirects
    const redirectUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`
      : `${
          typeof window !== "undefined" ? window.location.origin : ""
        }/auth/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      throw error;
    }
  };

  return {
    user,
    signIn,
    signOut,
    resetPassword,
  };
}
