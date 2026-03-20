"use client"; // Force rebuild v2

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const { user, profile, loading, signInWithGoogle, signInWithEmail } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"GOOGLE" | "EMAIL">("GOOGLE");
  const [error, setError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    if (user && profile && !loading) {
      if (profile.role === "PROVIDER") {
        router.push("/dashboard/provider"); 
      } else {
        router.push("/"); // Cliente vuelve al inicio para buscar servicios
      }
    }
  }, [user, profile, loading, router]);

  const handleGoogleLogin = async (role: "CLIENT" | "PROVIDER") => {
    try {
      await signInWithGoogle(role);
    } catch (err: any) {
      setError(err.message || "Error al ingresar con Google");
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoggingIn(true);
    try {
      await signInWithEmail(email, password);
    } catch (err: any) {
      console.error("Login email error:", err);
      if (err.code === "auth/operation-not-allowed") {
        setError("El ingreso por email no está habilitado en Firebase. Por favor actívalo en la consola.");
      } else if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Credenciales inválidas. Verifica tu correo y contraseña.");
      } else {
        setError(`Error al ingresar: ${err.message}`);
      }
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <main className="flex-grow flex items-center justify-center p-6 relative overflow-hidden min-h-screen">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full bg-slate-50 dark:bg-slate-900 -z-20"></div>
      <div className="absolute top-[20%] right-[20%] w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute bottom-[20%] left-[20%] w-72 h-72 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>

      <div className="glass-card w-full max-w-md p-8 sm:p-12 z-10 flex flex-col items-center">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/30 text-white">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"></path></svg>
        </div>
        
        <h2 className="text-3xl font-bold text-foreground mb-2 text-center">Bienvenido</h2>
        <p className="text-slate-500 text-center mb-8">
          {authMode === "GOOGLE" ? "Elige cómo quieres ingresar" : "Ingresa con tu correo"}
        </p>

        {error && <p className="w-full bg-red-50 dark:bg-red-900/20 text-red-500 p-3 rounded-lg text-sm mb-4 text-center font-medium">{error}</p>}

        {authMode === "GOOGLE" ? (
          <div className="w-full flex flex-col gap-4">
            <button 
              onClick={() => handleGoogleLogin("CLIENT")}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary text-foreground font-semibold py-3 px-4 rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              Ingresar como Cliente
            </button>

            <button 
              onClick={() => handleGoogleLogin("PROVIDER")}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-secondary text-foreground font-semibold py-3 px-4 rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              Ingresar como Especialista
            </button>

            <button 
              onClick={() => setAuthMode("EMAIL")}
              className="mt-2 text-primary font-medium text-sm hover:underline"
            >
              Prefiero usar mi correo electrónico
            </button>
          </div>
        ) : (
          <form onSubmit={handleEmailLogin} className="w-full flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="tu@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Contraseña</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            <button 
              type="submit"
              disabled={loggingIn}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/30 mt-2 disabled:bg-slate-400"
            >
              {loggingIn ? "Ingresando..." : "Entrar"}
            </button>
            
            <div className="flex flex-col items-center gap-3 mt-4">
              <button 
                type="button"
                onClick={() => setAuthMode("GOOGLE")}
                className="text-slate-500 text-sm hover:text-primary transition-colors"
              >
                Volver a ingreso con Google
              </button>
              <p className="text-slate-500 text-sm">
                ¿No tienes cuenta? <Link href="/signup" className="text-primary font-bold hover:underline">Regístrate aquí</Link>
              </p>
            </div>
          </form>
        )}

        <Link href="/" className="mt-8 text-sm text-slate-500 hover:text-primary transition-colors">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
