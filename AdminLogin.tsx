import { useState } from "react";
import { AdminAuthResult } from "@/hooks/useAdminAuth";
import { supabase } from "@/lib/supabase";

interface AdminLoginProps {
  auth: AdminAuthResult;
}

export default function AdminLogin({ auth }: AdminLoginProps) {
  const { authState, signInWithEmail, signInWithGoogle, signOut, errorMessage, user } = auth;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/admin`,
    });
    setResetLoading(false);
    if (!error) {
      setResetSent(true);
    } else {
      setLocalError("Error al enviar el email. Verifica la dirección.");
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    setLoading(true);
    const err = await signInWithEmail(email, password);
    if (err) setLocalError(err);
    setLoading(false);
  };

  // Loading inicial
  if (authState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-500 text-sm">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Unauthorized — acceso denegado
  if (authState === "unauthorized") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
        <div className="bg-white rounded-2xl border border-stone-100 p-10 w-full max-w-sm text-center">
          <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-red-100 text-red-500 mx-auto mb-4">
            <i className="ri-shield-cross-line text-2xl"></i>
          </div>
          <h2 className="text-lg font-semibold text-stone-900 mb-2">Acceso denegado</h2>
          {user && (
            <p className="text-stone-500 text-sm mb-2">
              <strong>{user.email}</strong> no tiene permisos de administrador.
            </p>
          )}
          <p className="text-stone-400 text-xs mb-6 leading-relaxed">
            Tu email no está registrado como administrador. Contacta con el propietario de la plataforma.
          </p>
          <button onClick={signOut}
            className="w-full border border-stone-200 text-stone-600 py-2.5 rounded-full text-sm font-medium hover:bg-stone-50 cursor-pointer whitespace-nowrap transition-colors">
            <i className="ri-logout-box-line mr-1"></i> Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  const displayError = localError || errorMessage;

  // --- RESET PASSWORD MODE ---
  if (resetMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl border border-stone-100 p-8">
            <div className="text-center mb-7">
              <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-amber-100 text-amber-600 mx-auto mb-4">
                <i className="ri-lock-password-line text-2xl"></i>
              </div>
              <h1 className="text-xl font-semibold text-stone-900">Recuperar contraseña</h1>
              <p className="text-stone-400 text-sm mt-1">Te enviaremos un enlace por email</p>
            </div>

            {resetSent ? (
              <div className="text-center">
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto mb-4">
                  <i className="ri-mail-check-line text-3xl"></i>
                </div>
                <h3 className="font-semibold text-stone-900 mb-2">¡Email enviado!</h3>
                <p className="text-stone-500 text-sm mb-6 leading-relaxed">
                  Revisa tu bandeja de entrada en <strong>{resetEmail}</strong>. Haz clic en el enlace para crear una nueva contraseña.
                </p>
                <button
                  onClick={() => { setResetMode(false); setResetSent(false); setResetEmail(""); }}
                  className="w-full bg-stone-900 text-white py-3 rounded-full text-sm font-semibold hover:bg-stone-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Volver al login
                </button>
              </div>
            ) : (
              <>
                {displayError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5 flex items-start gap-2">
                    <i className="ri-error-warning-line text-red-500 text-sm mt-0.5 flex-shrink-0"></i>
                    <p className="text-red-600 text-xs leading-relaxed">{displayError}</p>
                  </div>
                )}
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1.5">Email de administrador</label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="tu@email.com"
                      required
                      className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 bg-stone-50"
                    />
                  </div>
                  <button type="submit" disabled={resetLoading}
                    className="w-full bg-amber-500 text-white py-3 rounded-full text-sm font-semibold hover:bg-amber-600 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 flex items-center justify-center gap-2">
                    {resetLoading
                      ? <><i className="ri-loader-4-line animate-spin"></i> Enviando...</>
                      : <><i className="ri-send-plane-line"></i> Enviar enlace de recuperación</>
                    }
                  </button>
                </form>
                <button
                  onClick={() => { setResetMode(false); setLocalError(""); }}
                  className="w-full mt-4 text-stone-500 text-sm hover:text-stone-700 cursor-pointer transition-colors text-center"
                >
                  <i className="ri-arrow-left-line mr-1"></i> Volver al login
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-stone-100 p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-stone-900 text-white mx-auto mb-4">
              <i className="ri-shield-keyhole-line text-2xl"></i>
            </div>
            <h1 className="text-xl font-semibold text-stone-900">Panel de Control</h1>
            <p className="text-stone-400 text-sm mt-1">NEXURA — Acceso restringido</p>
          </div>

          {/* Error */}
          {displayError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5 flex items-start gap-2">
              <i className="ri-error-warning-line text-red-500 text-sm mt-0.5 flex-shrink-0"></i>
              <p className="text-red-600 text-xs leading-relaxed">{displayError}</p>
            </div>
          )}

          {/* Botón Admin Master */}
          <div className="mb-5">
            <button
              onClick={() => { setShowEmailForm(true); setLocalError(""); }}
              className="w-full bg-stone-900 text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-stone-700 transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-vip-crown-line text-amber-400"></i>
              </div>
              Entrar como Admin Master
            </button>
            <p className="text-center text-stone-400 text-xs mt-2 leading-relaxed">
              Acceso directo sin verificaciones — email y contraseña
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-stone-200"></div>
            <span className="text-xs text-stone-400">o también</span>
            <div className="flex-1 h-px bg-stone-200"></div>
          </div>

          {/* Google */}
          <button onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap mb-3">
            <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          {/* Toggle Email Form */}
          {!showEmailForm ? (
            <button
              onClick={() => { setShowEmailForm(true); setLocalError(""); }}
              className="w-full flex items-center justify-center gap-2 border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap"
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-mail-line text-stone-500"></i>
              </div>
              Entrar con email y contraseña
            </button>
          ) : (
            <div className="mt-3 space-y-4">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@nexura.es"
                    required
                    autoComplete="off"
                    className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1.5">Contraseña</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Tu contraseña"
                      required
                      autoComplete="off"
                      className="w-full border border-stone-200 rounded-xl px-4 py-3 pr-10 text-sm text-stone-800 focus:outline-none focus:border-stone-400 bg-stone-50"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer w-5 h-5 flex items-center justify-center">
                      <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"}></i>
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-stone-900 text-white py-3 rounded-full text-sm font-semibold hover:bg-stone-700 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading
                    ? <><i className="ri-loader-4-line animate-spin"></i> Entrando...</>
                    : <><i className="ri-login-box-line"></i> Entrar al panel</>
                  }
                </button>
              </form>
              <button
                onClick={() => { setResetMode(true); setLocalError(""); setResetEmail(email); }}
                className="w-full text-stone-400 text-xs hover:text-amber-600 cursor-pointer transition-colors text-center"
              >
                <i className="ri-lock-unlock-line mr-1"></i> ¿Olvidaste tu contraseña?
              </button>
              <button
                onClick={() => { setShowEmailForm(false); setLocalError(""); }}
                className="w-full text-stone-400 text-xs hover:text-stone-600 cursor-pointer transition-colors text-center"
              >
                <i className="ri-arrow-up-line mr-1"></i> Ocultar formulario
              </button>
            </div>
          )}

          <p className="text-center text-stone-400 text-xs mt-6 leading-relaxed">
            Solo cuentas autorizadas pueden acceder al panel.
          </p>
        </div>
      </div>
    </div>
  );
}