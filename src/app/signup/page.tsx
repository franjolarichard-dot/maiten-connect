"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { UserRole } from "@/lib/types";

export default function SignUpPage() {
  const { signUpWithEmail, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("CLIENT");
  
  const [error, setError] = useState("");
  const [signingUp, setSigningUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setError("");
    setSigningUp(true);
    try {
      await signUpWithEmail(email, password, name, role, phone);
      router.push(role === "PROVIDER" ? "/dashboard/provider" : "/");
    } catch (err: any) {
      console.error("Signup email error:", err);
      if (err.code === "auth/operation-not-allowed") {
        setError("El registro por email no está habilitado en Firebase. Por favor actívalo en la consola.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Este correo ya está registrado. Intenta iniciar sesión.");
      } else {
        setError(`Error al crear la cuenta: ${err.message}`);
      }
    } finally {
      setSigningUp(false);
    }
  };

  return (
    <main className="flex-grow flex items-center justify-center p-6 relative overflow-hidden min-h-screen">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full bg-slate-50 dark:bg-slate-900 -z-20"></div>
      <div className="absolute top-[10%] left-[10%] w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>

      <div className="glass-card w-full max-w-lg p-8 sm:p-12 z-10">
        <h2 className="text-3xl font-bold text-foreground mb-2">Crear Cuenta</h2>
        <p className="text-slate-500 mb-8 font-medium">Únete a la red de servicios más grande del litoral.</p>

        {error && <p className="bg-red-50 dark:bg-red-900/20 text-red-500 p-4 rounded-xl text-sm mb-6 font-medium border border-red-100 dark:border-red-800">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Nombre Completo</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                placeholder="Nombre Apellido"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Celular / WhatsApp</label>
              <input 
                type="text" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                placeholder="56912345678"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Correo Electrónico</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
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
              className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
              placeholder="Min. 6 caracteres"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-3 ml-1">¿Para qué usarás la plataforma?</label>
            <div className="grid grid-cols-2 gap-4">
               <button 
                 type="button"
                 onClick={() => setRole("CLIENT")}
                 className={`py-3 px-4 rounded-xl border-2 font-bold transition-all ${role === "CLIENT" ? "border-primary bg-primary/5 text-primary" : "border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-400"}`}
               >
                 Busco Servicios
               </button>
               <button 
                 type="button"
                 onClick={() => setRole("PROVIDER")}
                 className={`py-3 px-4 rounded-xl border-2 font-bold transition-all ${role === "PROVIDER" ? "border-secondary bg-secondary/5 text-secondary" : "border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-400"}`}
               >
                 Ofrezco Servicios
               </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={signingUp}
            className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-extrabold py-4 rounded-xl transition-all shadow-xl mt-4 disabled:bg-slate-400 hover:scale-[1.01] active:scale-[0.99]"
          >
            {signingUp ? "Creando Cuenta..." : "Registrarme"}
          </button>

          <p className="text-center text-slate-500 text-sm mt-6">
            ¿Ya tienes cuenta? <Link href="/login" className="text-primary font-bold hover:underline">Inicia sesión</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
