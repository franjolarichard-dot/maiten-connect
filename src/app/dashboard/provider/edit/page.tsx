"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { updateProviderProfile } from "@/lib/db";
import { ProviderProfile } from "@/lib/types";

const CATEGORIES = ["Gasfitería", "Electricidad", "Limpieza", "Jardinería", "Arquitectura", "Fletes", "Construcción", "Otros"];

export default function ProviderEditProfile() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState<Partial<ProviderProfile>>({
    servicesOffered: [],
    isAvailable: true,
    location: {
      lat: -32.65,
      lng: -71.43,
      address: "",
      city: "Maitencillo"
    },
    activeRadiusKm: 30,
    phone: ""
  });

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "PROVIDER")) {
      router.push("/");
    }
    if (profile) {
      setFormData({
        servicesOffered: (profile as any).servicesOffered || [],
        isAvailable: (profile as any).isAvailable ?? true,
        location: (profile as any).location || { lat: -32.65, lng: -71.43, address: "", city: "Maitencillo" },
        activeRadiusKm: (profile as any).activeRadiusKm || 30,
        phone: (profile as any).phone || ""
      });
    }
  }, [user, profile, loading, router]);

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProviderProfile(user!.uid, formData);
      router.push("/dashboard/provider");
    } catch (err) {
      console.error(err);
      alert("Error al guardar cambios");
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (cat: string) => {
    setFormData(prev => ({
      ...prev,
      servicesOffered: prev.servicesOffered?.includes(cat)
        ? prev.servicesOffered.filter(c => c !== cat)
        : [...(prev.servicesOffered || []), cat]
    }));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <main className="flex-grow p-6 sm:p-12 max-w-3xl mx-auto w-full">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Configurar Perfil</h1>
        <button 
          onClick={() => router.push("/dashboard/provider")}
          className="text-slate-500 hover:text-foreground text-sm flex items-center gap-1 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Volver al panel
        </button>
      </div>

      <div className="glass-card p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Disponibilidad */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="font-bold text-foreground">Estado de Disponibilidad</h3>
              <p className="text-sm text-slate-500">¿Estás buscando trabajos actualmente?</p>
            </div>
            <button 
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isAvailable: !prev.isAvailable }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${formData.isAvailable ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isAvailable ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Teléfono */}
          <section>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Teléfono de contacto (WhatsApp)</label>
            <input 
              type="text" 
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Ej: 56912345678"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              required
            />
            <p className="mt-1 text-xs text-slate-500 italic">Formato: Código país + número (Sin el +). Ejemplo: 56912345678</p>
          </section>

          {/* Categorías */}
          <section>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Servicios que ofreces</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    formData.servicesOffered?.includes(cat)
                      ? "bg-primary text-white border-primary shadow-md shadow-primary/20 scale-[1.02]"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </section>

          {/* Ubicación */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Ubicación y Área</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs text-slate-500 mb-1">Ciudad Base</label>
                   <select 
                    value={formData.location?.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: { ...prev.location!, city: e.target.value } }))}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  >
                    <option value="Maitencillo">Maitencillo</option>
                    <option value="Zapallar">Zapallar</option>
                    <option value="Cachagua">Cachagua</option>
                    <option value="Papudo">Papudo</option>
                    <option value="Puchuncaví">Puchuncaví</option>
                  </select>
               </div>
               <div>
                  <label className="block text-xs text-slate-500 mb-1">Radio de Acción (Km)</label>
                  <input 
                    type="number" 
                    value={formData.activeRadiusKm}
                    onChange={(e) => setFormData(prev => ({ ...prev, activeRadiusKm: parseInt(e.target.value) }))}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
               </div>
            </div>
          </section>

          <button 
            type="submit"
            disabled={saving}
            className="w-full bg-primary hover:bg-primary-dark disabled:bg-slate-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </form>
      </div>
    </main>
  );
}
