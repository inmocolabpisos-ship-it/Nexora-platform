import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/feature/Navbar";
import Footer from "@/components/feature/Footer";

type PageState = "loading" | "ready" | "invalid" | "success";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const resolved = useRef(false);

  useEffect(() => {
    const resolve = (state: PageState) => {
      if (resolved.current) return;
      resolved.current = true;
      setPageState(state);
    };

    // Method 1: Hash fragment (#access_token=...&type=recovery)
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const type = params.get("type");

      if (accessToken && refreshToken && type === "recovery") {
        supabase.auth
          .setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(({ error: sessionError }) => {
            if (sessionError) {
              resolve("invalid");
            } else {
              resolve("ready");
              window.history.replaceState(null, "", window.location.pathname + window.location.search);
            }
          });
        return;
      }
    }

    // Method 2: onAuthStateChange PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        resolve("ready");
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    });

    // Method 3: Check if there's already a valid session (PKCE flow)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // If we have a session and came here, it might be a valid recovery session
        // Check if the URL has a code param (PKCE flow)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        if (code) {
          resolve("ready");
        }
      }
    });

    // Fallback: after 4 seconds if nothing resolved, mark invalid
    const timeout = setTimeout(() => {
      resolve("invalid");
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) {
      if (err.message.includes("Auth session missing")) {
        setError("La sesión ha expirado. Solicita un nuevo enlace de recuperación.");
      } else if (err.message.includes("same password")) {
        setError("La nueva contraseña no puede ser igual a la anterior.");
      } else {
        setError(err.message);
      }
      return;
    }

    setPageState("success");
    await supabase.auth.signOut();
    setTimeout(() => navigate("/login"), 3000);
  };

  const getPasswordStrength = () => {
    if (password.length === 0) return 0;
    if (password.length < 6) return 1;
    if (password.length < 8) return 2;
    if (password.length < 12) return 3;
    return 4;
  };

  const strengthColors = ["bg-stone-200", "bg-red-400", "bg-amber-400", "bg-yellow-400", "bg-emerald-400"];
  const strengthLabels = ["", "Muy débil", "Débil", "Buena", "Fuerte"];
  const strength = getPasswordStrength();

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center pt-24 pb-16 px-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-stone-900 text-white mx-auto mb-4">
              <i className="ri-lock-password-line text-2xl"></i>
            </div>
            <h1 className="text-2xl font-semibold text-stone-900">Nueva contraseña</h1>
            <p className="text-stone-500 text-sm mt-1">Elige una contraseña segura para tu cuenta</p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-100 p-8">
            {/* Loading */}
            {pageState === "loading" && (
              <div className="text-center py-8">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-stone-100 mx-auto mb-4">
                  <i className="ri-loader-4-line animate-spin text-2xl text-stone-600"></i>
                </div>
                <p className="text-stone-600 font-medium mb-1">Verificando enlace...</p>
                <p className="text-stone-400 text-sm">Esto solo tarda un momento</p>
              </div>
            )}

            {/* Success */}
            {pageState === "success" && (
              <div className="text-center py-4">
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto mb-4">
                  <i className="ri-shield-check-line text-3xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-stone-900 mb-2">¡Contraseña actualizada!</h3>
                <p className="text-stone-500 text-sm mb-1">Tu contraseña se ha cambiado correctamente.</p>
                <p className="text-stone-400 text-xs">Redirigiendo al inicio de sesión en 3 segundos...</p>
                <div className="mt-4 h-1 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full animate-[shrink_3s_linear_forwards]" style={{ width: "100%", animation: "width 3s linear forwards" }}></div>
                </div>
              </div>
            )}

            {/* Invalid / expired */}
            {pageState === "invalid" && (
              <div className="text-center py-4">
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-amber-100 text-amber-600 mx-auto mb-4">
                  <i className="ri-error-warning-line text-3xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-stone-900 mb-2">Enlace no válido o expirado</h3>
                <p className="text-stone-500 text-sm mb-6 leading-relaxed">
                  Este enlace ha expirado o ya fue utilizado.<br />
                  Los enlaces de recuperación son válidos durante <strong>1 hora</strong>.
                </p>
                <button
                  onClick={() => navigate("/login")}
                  className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-stone-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-mail-send-line"></i> Solicitar nuevo enlace
                </button>
              </div>
            )}

            {/* Form */}
            {pageState === "ready" && (
              <form onSubmit={handleReset} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 flex items-start gap-2">
                    <i className="ri-error-warning-line mt-0.5 flex-shrink-0"></i>
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1.5">Nueva contraseña</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      className="w-full border border-stone-200 rounded-lg px-4 py-2.5 pr-10 text-sm text-stone-800 focus:outline-none focus:border-stone-400 bg-stone-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer w-5 h-5 flex items-center justify-center"
                    >
                      <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"}></i>
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              i <= strength ? strengthColors[strength] : "bg-stone-200"
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs ${strength <= 1 ? "text-red-500" : strength <= 2 ? "text-amber-500" : "text-emerald-600"}`}>
                        {strengthLabels[strength]}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1.5">Confirmar contraseña</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu contraseña"
                    required
                    className={`w-full border rounded-lg px-4 py-2.5 text-sm text-stone-800 focus:outline-none bg-stone-50 transition-colors ${
                      confirmPassword && confirmPassword !== password
                        ? "border-red-300 focus:border-red-400"
                        : confirmPassword && confirmPassword === password
                        ? "border-emerald-300 focus:border-emerald-400"
                        : "border-stone-200 focus:border-stone-400"
                    }`}
                  />
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <i className="ri-close-circle-line"></i> Las contraseñas no coinciden
                    </p>
                  )}
                  {confirmPassword && confirmPassword === password && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <i className="ri-checkbox-circle-line"></i> Las contraseñas coinciden
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || password !== confirmPassword || password.length < 6}
                  className="w-full bg-stone-900 text-white py-3 rounded-full text-sm font-semibold hover:bg-stone-700 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? <><i className="ri-loader-4-line animate-spin mr-1"></i> Guardando...</>
                    : <><i className="ri-save-line mr-1"></i> Guardar nueva contraseña</>
                  }
                </button>
              </form>
            )}
          </div>

          {pageState !== "success" && pageState !== "loading" && (
            <p className="text-center text-xs text-stone-400 mt-4">
              ¿Necesitas ayuda?{" "}
              <button onClick={() => navigate("/login")} className="text-stone-600 hover:underline cursor-pointer">
                Volver al inicio de sesión
              </button>
            </p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
