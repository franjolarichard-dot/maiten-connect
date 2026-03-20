"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ServiceRequest } from "@/lib/types";
import { acceptServiceRequest } from "@/lib/db";

export default function ProviderDashboard() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "PROVIDER")) {
      router.push("/");
    }
  }, [user, profile, loading, router]);

  useEffect(() => {
    if (user?.uid) {
      const q = query(collection(db, "requests"), where("providerId", "==", user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const reqs: ServiceRequest[] = [];
        snapshot.forEach((doc) => {
          reqs.push({ id: doc.id, ...doc.data() } as ServiceRequest);
        });
        // Sort by newest first
        setRequests(reqs.sort((a, b) => {
           const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
           const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
           return timeB - timeA;
        }));
      });
      return () => unsubscribe();
    }
  }, [user?.uid]);

  const handleAccept = async (reqId: string) => {
    try {
      await acceptServiceRequest(reqId, user!.uid, "A la brevedad");
    } catch (e) {
      console.error(e);
      alert("Error al aceptar solicitud");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  const pendingReqs = requests.filter(r => r.status === "PENDING");
  const activeReqs = requests.filter(r => r.status === "ACCEPTED");

  return (
    <main className="flex-grow p-6 sm:p-12 max-w-7xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-8 text-foreground">Panel de Especialista</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Oportunidades Section */}
          <div className="glass-card p-6 border-l-4 border-l-primary relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
            <h2 className="text-xl font-semibold mb-4 text-foreground relative z-10 flex items-center justify-between">
              <span>Nuevas Oportunidades</span>
              {pendingReqs.length > 0 && <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">{pendingReqs.length}</span>}
            </h2>
            
            <div className="relative z-10 space-y-4">
              {pendingReqs.length === 0 ? (
                <div className="p-8 text-center bg-white/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                  <p className="text-slate-500">No hay nuevas solicitudes en tu área por ahora.</p>
                </div>
              ) : (
                pendingReqs.map(req => (
                  <div key={req.id} className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                     <div>
                       <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{req.serviceCategory}</span>
                       <p className="text-foreground font-medium mt-1">"{req.description}"</p>
                       <span className="text-xs text-slate-400">Hace instantes</span>
                     </div>
                     <button 
                       onClick={() => handleAccept(req.id!)}
                       className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-bold transition-colors shadow-sm"
                     >
                        Aceptar Trabajo
                     </button>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Trabajos en Curso */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground flex items-center justify-between">
              <span>Trabajos Confirmados (Matches)</span>
            </h2>
            <div className="space-y-4">
              {activeReqs.length === 0 ? (
                <p className="text-slate-500">No tienes trabajos activos.</p>
              ) : (
                activeReqs.map(req => (
                  <div key={req.id} className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-xl flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                       <div>
                         <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 capitalize">{req.serviceCategory}</span>
                         <p className="text-slate-800 dark:text-slate-200 font-medium">"{req.description}"</p>
                       </div>
                       <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-md">MATCH</span>
                    </div>
                    <div className="border-t border-emerald-200/50 dark:border-emerald-800/50 pt-3">
                       <a 
                         href="https://wa.me/56912345678" // Placeholder Whatsapp linking logic
                         target="_blank" rel="noreferrer"
                         className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1DA851] text-white py-2 rounded-lg font-bold transition-colors"
                       >
                         <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.298.045-.677.086-1.921-.432-1.498-.622-2.527-2.146-2.603-2.247-.076-.102-.622-.827-.622-1.579 0-.751.391-1.12.529-1.267.138-.146.299-.183.399-.183.1 0 .199.004.288.008.106.005.233-.038.358.261.128.307.436 1.066.474 1.144.038.077.064.167.013.267-.051.101-.077.164-.153.255-.078.093-.163.203-.23.28-.076.088-.155.185-.065.34.09.155.4 0 .66.903.26.241.517.382.684.484.167.102.261.085.358.053.053-.016.153-.082.34-.34.364-.492.368-.903.255-.1.085-.367-.123-.55-.268z"></path></svg>
                         Coordinar por WhatsApp
                       </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Profile Stats Sidebar */}
        <div className="flex flex-col gap-6">
          <div className="glass-card p-6 bg-slate-50/50 dark:bg-slate-800/30">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Mi Perfil Público</h2>
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary-dark font-bold text-lg">
                  {profile?.displayName?.charAt(0).toUpperCase() || "P"}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{profile?.displayName}</p>
                  <p className="text-slate-500 text-xs">{profile?.email}</p>
                </div>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <p className="mb-2"><strong>Estado:</strong> <span className="text-primary font-bold">Disponible</span></p>
                <p className="mb-2"><strong>Servicios:</strong> {(profile as any)?.servicesOffered?.length ? (profile as any).servicesOffered.join(', ') : <span className="text-amber-500">Sin configurar</span>}</p>
                <p><strong>Ubicación:</strong> {(profile as any)?.location?.city || "Maitencillo"}</p>
              </div>
              <button className="mt-4 w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-foreground py-2 rounded-lg font-medium transition-colors shadow-sm">
                Editar Perfil y Servicios
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
