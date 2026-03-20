"use client";

import { useState } from "react";
import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const ADMIN_PASSWORD = "maiten2025"; // Cámbiala por la que quieras

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [services, setServices] = useState("");
  const [city, setCity] = useState("Maitencillo");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [providers, setProviders] = useState<string[]>([]);

  if (!authorized) {
    return (
      <main className="flex-grow flex items-center justify-center p-6 min-h-screen">
        <div className="glass-card p-8 w-full max-w-sm text-center">
          <div className="w-14 h-14 bg-slate-900 dark:bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-7 h-7 text-white dark:text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <h2 className="text-xl font-bold mb-2 text-foreground">Acceso Restringido</h2>
          <p className="text-slate-500 text-sm mb-6">Ingresa la clave de administrador</p>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && password === ADMIN_PASSWORD) setAuthorized(true); }}
            placeholder="Contraseña"
            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-primary mb-4"
          />
          <button
            onClick={() => { if (password === ADMIN_PASSWORD) setAuthorized(true); else setMsg("Contraseña incorrecta"); }}
            className="w-full bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white font-bold py-3 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer"
          >
            Entrar
          </button>
          {msg && <p className="text-red-500 text-sm mt-3">{msg}</p>}
        </div>
      </main>
    );
  }

  const handleAdd = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const randomId = "prov_" + Math.random().toString(36).substring(2, 9);
      const servicesArray = services.split(",").map(s => s.trim().toLowerCase());

      await setDoc(doc(db, "providers", randomId), {
        uid: randomId,
        displayName: name,
        phone: phone || "",
        email: "ingreso_rapido@admin.com",
        role: "PROVIDER",
        servicesOffered: servicesArray,
        location: {
          lat: -32.650,
          lng: -71.433,
          address: "Centro",
          city: city
        },
        activeRadiusKm: 30,
        rating: 5.0,
        reviewCount: 0,
        isAvailable: true,
        createdAt: new Date()
      });

      setProviders(prev => [...prev, `${name} (${servicesArray.join(", ")}) - ${city}`]);
      setMsg(`✅ "${name}" agregado exitosamente`);
      setName("");
      setPhone("");
      setServices("");
    } catch(err: any) {
      setMsg("❌ Error: " + err.message);
    }
    setLoading(false);
  };

  return (
    <main className="flex-grow p-6 sm:p-12 pt-28 max-w-4xl mx-auto w-full min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">Ingreso Rápido de Proveedores</h1>
          <p className="text-slate-500 mt-1">Carga inicial de especialistas en la plataforma</p>
        </div>
        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold rounded-full">ADMIN</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form */}
        <div className="md:col-span-2 glass-card p-8">
          {msg && <div className={`mb-6 p-4 rounded-lg font-medium text-sm ${msg.startsWith("✅") ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300" : "bg-red-100 dark:bg-red-900/30 text-red-700"}`}>{msg}</div>}

          <form onSubmit={handleAdd} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Nombre Completo o Empresa *</label>
              <input required value={name} onChange={e=>setName(e.target.value)} type="text" className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-primary transition-all" placeholder="Ej: Juan Pérez / Piscinas del Litoral" />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Teléfono / WhatsApp</label>
              <input value={phone} onChange={e=>setPhone(e.target.value)} type="text" className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-primary transition-all" placeholder="Ej: +56912345678" />
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Servicios que ofrece (separados por coma) *</label>
              <input required value={services} onChange={e=>setServices(e.target.value)} type="text" className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-primary transition-all" placeholder="Ej: piscinas, jardinero, limpieza" />
              <p className="text-xs text-slate-500 mt-2">La IA buscará coincidencias con estas palabras clave.</p>
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Sector Principal</label>
              <select value={city} onChange={e=>setCity(e.target.value)} className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-primary transition-all cursor-pointer">
                <option>Maitencillo</option>
                <option>Zapallar</option>
                <option>Cachagua</option>
                <option>Papudo</option>
                <option>Puchuncaví</option>
                <option>Quintero</option>
              </select>
            </div>
            
            <button disabled={loading} type="submit" className="mt-2 bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl disabled:bg-slate-400 hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg shadow-primary/30 cursor-pointer">
              {loading ? "Guardando..." : "Agregar Proveedor"}
            </button>
          </form>
        </div>

        {/* Sidebar: Recently added */}
        <div className="glass-card p-6 h-fit">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Agregados esta sesión</h3>
          {providers.length === 0 ? (
            <p className="text-slate-500 text-sm">Aún no has agregado proveedores.</p>
          ) : (
            <ul className="space-y-3">
              {providers.map((p, i) => (
                <li key={i} className="text-sm bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-start gap-2">
                  <svg className="w-4 h-4 text-primary mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  <span className="text-slate-700 dark:text-slate-300">{p}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
