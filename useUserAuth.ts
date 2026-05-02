import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, DbMember } from "@/lib/supabase";

export type UserAuthState = "loading" | "unauthenticated" | "authenticated";

export interface UserAuthResult {
  authState: UserAuthState;
  user: User | null;
  session: Session | null;
  member: DbMember | null;
  isOAuthUser: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, tipo: "huesped" | "anfitrion") => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  refreshMember: () => Promise<void>;
}

function getNetworkErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("Failed to fetch") || msg.includes("fetch") || msg.includes("Network")) {
    return "No se puede conectar con el servidor. Comprueba tu conexión a internet o inténtalo más tarde.";
  }
  return msg;
}

export function useUserAuth(): UserAuthResult {
  const [authState, setAuthState] = useState<UserAuthState>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [member, setMember] = useState<DbMember | null>(null);
  const [isOAuthUser, setIsOAuthUser] = useState(false);

  const fetchMember = async (email: string) => {
    try {
      const { data } = await supabase
        .from("members")
        .select("*")
        .eq("email", email)
        .maybeSingle();
      setMember(data as DbMember | null);
    } catch {
      setMember(null);
    }
  };

  const checkOAuth = (u: User) => {
    const provider = u.app_metadata?.provider;
    setIsOAuthUser(provider === "github" || provider === "google" || provider === "facebook");
  };

  const refreshMember = async () => {
    if (user?.email) await fetchMember(user.email);
  };

  useEffect(() => {
    // Safety timeout: never stay in "loading" more than 2s
    const safetyTimeout = setTimeout(() => {
      setAuthState((prev) => prev === "loading" ? "unauthenticated" : prev);
    }, 2000);

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      clearTimeout(safetyTimeout);
      if (!s) {
        setAuthState("unauthenticated");
        return;
      }
      setSession(s);
      setUser(s.user);
      checkOAuth(s.user);
      await fetchMember(s.user.email || "");
      setAuthState("authenticated");
    }).catch(() => {
      clearTimeout(safetyTimeout);
      setAuthState("unauthenticated");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (event === "SIGNED_OUT" || !s) {
        setUser(null);
        setSession(null);
        setMember(null);
        setIsOAuthUser(false);
        setAuthState("unauthenticated");
        return;
      }
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setSession(s);
        setUser(s.user);
        checkOAuth(s.user);
        await fetchMember(s.user.email || "");
        setAuthState("authenticated");
      }
    });

    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: getNetworkErrorMessage(error) };
      return { error: null };
    } catch (err) {
      return { error: getNetworkErrorMessage(err) };
    }
  };

  const signUpWithEmail = async (email: string, password: string, tipo: "huesped" | "anfitrion") => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { tipo } },
      });
      if (error) return { error: getNetworkErrorMessage(error) };
      return { error: null };
    } catch (err) {
      return { error: getNetworkErrorMessage(err) };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) return { error: getNetworkErrorMessage(error) };
      return { error: null };
    } catch (err) {
      return { error: getNetworkErrorMessage(err) };
    }
  };

  return { authState, user, session, member, isOAuthUser, signInWithEmail, signUpWithEmail, signOut, resetPassword, refreshMember };
}
