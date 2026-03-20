"use client";

import { useState, useEffect } from "react";
import { collection, doc, setDoc, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const ADMIN_PASSWORD = "maiten2025";

interface Provider {
  id: string;
  displayName: string;
  phone: string;
  servicesOffered: string[];
  location: { city: string };
  isAvailable: boolean;
}

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [services, setServices] = useState("");
  const [city, setCity] = useState("Maitencillo");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [allProviders, setAllProviders] = useState<Provider[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editServices, setEditServices] = useState("");
  const [tab, setTab] = useState<"add" | "list">("list");

  // Cargar todos los proveedores de Firestore
  const loadProviders = async () => {
    const snapshot = await getDocs(collection(db, "providers"));
    const list: Provider[] = [];
    snapshot.forEach((doc) => {
      const d = doc.data();
      list.push({
        id: doc.id,
        displayName: d.displayName || "Sin nombre",
        phone: d.phone || "",
        servicesOffered: d.servicesOffered || [],
        location: d.location || { city: "?" },
        isAvailable: d.isAvailable !== false,
      });
    });
    setAllProviders(list);
  };

  useEffect(() => {
    if (authorized) loadProviders();
  }, [authorized]);

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
        location: { lat: -32.650, lng: -71.433, address: "Centro", city: city },
        activeRadiusKm: 30,
        rating: 5.0,
        reviewCount: 0,
        isAvailable: true,
        createdAt: new Date()
      });

      setMsg(`✅ "${name}" agregado exitosamente`);
      setName("");
      setPhone("");
      setServices("");
      await loadProviders();
    } catch(err: any) {
      setMsg("❌ Error: " + err.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, provName: string) => {
    if (!confirm(`¿Eliminar a "${provName}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteDoc(doc(db, "providers", id));
      setMsg(`🗑️ "${provName}" eliminado`);
      await loadProviders();
    } catch(err: any) {
      setMsg("❌ Error: " + err.message);
    }
  };

  const startEdit = (p: Provider) => {
    setEditingId(p.id);
    setEditName(p.displayName);
    setEditPhone(p.phone);
    setEditServices(p.servicesOffered.join(", "));
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      await updateDoc(doc(db, "providers", editingId), {
        displayName: editName,
        phone: editPhone,
        servicesOffered: editServices.split(",").map(s => s.trim().toLowerCase()),
      });
      setEditingId(null);
      setMsg(`✅ Proveedor actualizado`);
      await loadProviders();
    } catch(err: any) {
      setMsg("❌ Error: " + err.message);
    }
  };

  return (
    <main className="flex-grow p-6 sm:p-12 pt-28 max-w-5xl mx-auto w-full min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">Panel de Administración</h1>
          <p className="text-slate-500 mt-1">Gestiona los especialistas de la plataforma</p>
        </div>
        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold rounded-full">ADMIN</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("list")} className={`px-5 py-2 rounded-xl font-bold text-sm transition-all cursor-pointer ${tab === "list" ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
          📋 Proveedores ({allProviders.length})
        </button>
        <button onClick={() => setTab("add")} className={`px-5 py-2 rounded-xl font-bold text-sm transition-all cursor-pointer ${tab === "add" ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
          ➕ Agregar Nuevo
        </button>
      </div>

      {msg && <div className={`mb-6 p-4 rounded-lg font-medium text-sm ${msg.startsWith("✅") || msg.startsWith("🗑") ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300" : "bg-red-100 dark:bg-red-900/30 text-red-700"}`}>{msg}</div>}

      {/* TAB: Lista de Proveedores */}
      {tab === "list" && (
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-foreground">Todos los Proveedores</h2>
            <button onClick={loadProviders} className="text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 cursor-pointer">🔄 Refrescar</button>
          </div>

          {allProviders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No hay proveedores registrados. Agrega el primero.</p>
              <button onClick={() => setTab("add")} className="mt-4 bg-primary text-white px-6 py-2 rounded-lg font-bold cursor-pointer">Agregar Proveedor</button>
            </div>
          ) : (
            <div className="space-y-3">
              {allProviders.map(p => (
                <div key={p.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center gap-3">
                  {editingId === p.id ? (
                    /* Modo edición */
                    <div className="flex-1 space-y-2">
                      <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm outline-none" placeholder="Nombre" />
                      <input value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm outline-none" placeholder="Teléfono" />
                      <input value={editServices} onChange={e => setEditServices(e.target.value)} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm outline-none" placeholder="Servicios (separados por coma)" />
                      <div className="flex gap-2">
                        <button onClick={handleUpdate} className="bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer">💾 Guardar</button>
                        <button onClick={() => setEditingId(null)} className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    /* Modo visualización */
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground truncate">{p.displayName}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {p.servicesOffered.join(", ")} • {p.location?.city || "?"} {p.phone && `• ${p.phone}`}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => startEdit(p)} className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-blue-200">✏️ Editar</button>
                        <button onClick={() => handleDelete(p.id, p.displayName)} className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-red-200">🗑️ Eliminar</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: Agregar Nuevo */}
      {tab === "add" && (
        <div className="glass-card p-8 max-w-2xl">
          <h2 className="text-xl font-semibold text-foreground mb-6">Ingreso Rápido de Proveedor</h2>
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
      )}
    </main>
  );
}
