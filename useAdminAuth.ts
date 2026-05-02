import { useState, useEffect, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type AuthState = "loading" | "unauthenticated" | "authorized" | "unauthorized";

export interface AdminAuthResult {
  authState: AuthState;
  user: User | null;
  session: Session | null;
  isMaster: boolean;
  signInWithEmail: (email: string, password: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  errorMessage: string;
}

export function useAdminAuth(): AdminAuthResult {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isMaster, setIsMaster] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Verificar si un email es admin (y si es master)
  const checkAdminAccess = useCallback(async (email: string): Promise<{ ok: boolean; master: boolean }> => {
    if (!email) return { ok: false, master: false };
    try {
      const { data } = await supabase
        .from("admin_users")
        .select("activo, rol")
        .eq("email", email)
        .eq("activo", true)
        .maybeSingle();
      return { ok: !!data, master: data?.rol === "master" };
    } catch {
      return { ok: false, master: false };
    }
  }, []);

  // Inicializar: verificar sesión existente al cargar
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      if (cancelled) return;

      if (!s?.user) {
        setAuthState("unauthenticated");
        return;
      }

      setSession(s);
      setUser(s.user);

      const result = await checkAdminAccess(s.user.email || "");
      if (cancelled) return;

      if (result.ok) {
        setAuthState("authorized");
        setIsMaster(result.master);
      } else {
        setAuthState("unauthorized");
        setIsMaster(false);
        setErrorMessage(`El email ${s.user.email} no tiene permisos de administrador.`);
      }
    };

    init();

    // Listener de cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (cancelled) return;

      if (event === "SIGNED_OUT" || !s) {
        setUser(null);
        setSession(null);
        setAuthState("unauthenticated");
        setErrorMessage("");
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setSession(s);
        setUser(s.user);
        const result = await checkAdminAccess(s.user.email || "");
        if (cancelled) return;
        if (result.ok) {
          setAuthState("authorized");
          setIsMaster(result.master);
          setErrorMessage("");
        } else {
          setAuthState("unauthorized");
          setIsMaster(false);
          setErrorMessage(`El email ${s.user.email} no tiene permisos de administrador.`);
        }
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [checkAdminAccess]);

  // Login con email + password — FLUJO DIRECTO
  const signInWithEmail = useCallback(async (email: string, password: string): Promise<string | null> => {
    setErrorMessage("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const msg = error.message.toLowerCase().includes("invalid")
          ? "Email o contraseña incorrectos."
          : error.message;
        setErrorMessage(msg);
        return msg;
      }

      if (!data.user || !data.session) {
        setErrorMessage("No se pudo iniciar sesión.");
        return "No se pudo iniciar sesión.";
      }

      // FLUJO DIRECTO: verificar admin INMEDIATAMENTE sin esperar listener
      setSession(data.session);
      setUser(data.user);

      const result = await checkAdminAccess(data.user.email || "");
      if (result.ok) {
        setAuthState("authorized");
        setIsMaster(result.master);
        setErrorMessage("");
        return null;
      } else {
        setAuthState("unauthorized");
        setIsMaster(false);
        setErrorMessage(`El email ${data.user.email} no tiene permisos de administrador.`);
        return `El email ${data.user.email} no tiene permisos de administrador.`;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setErrorMessage(msg);
      return msg;
    }
  }, [checkAdminAccess]);

  // Login con Google
  const signInWithGoogle = useCallback(async () => {
    setErrorMessage("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.href.split("?")[0],
          queryParams: { access_type: "offline", prompt: "select_account" },
        },
      });
      if (error) setErrorMessage("Error al iniciar sesión con Google.");
    } catch {
      setErrorMessage("Error al iniciar sesión con Google.");
    }
  }, []);

  // Logout
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setAuthState("unauthenticated");
    setIsMaster(false);
    setErrorMessage("");
  }, []);

  return { authState, user, session, isMaster, signInWithEmail, signInWithGoogle, signOut, errorMessage };
}