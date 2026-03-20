"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ServiceRequest } from "@/lib/types";
import StarRating from "@/components/StarRating";
import { submitReview } from "@/lib/reviews";

export default function ClientDashboard() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "CLIENT")) {
      router.push("/");
    }
  }, [user, profile, loading, router]);

  useEffect(() => {
    if (user?.uid) {
      const q = query(collection(db, "requests"), where("clientId", "==", user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
         const reqs: ServiceRequest[] = [];
         snapshot.forEach((doc) => {
           reqs.push({ id: doc.id, ...doc.data() } as ServiceRequest);
         });
         setRequests(reqs.sort((a, b) => {
           const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
           const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
           return timeB - timeA;
        }));
      });
      return () => unsubscribe();
    }
  }, [user?.uid]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <main className="flex-grow p-6 sm:p-12 max-w-7xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-8 text-foreground">Mi Panel de Cliente</h1>
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold mb-6 text-foreground">Avisos y Solicitudes</h2>
        
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            <p className="text-slate-500 max-w-md">Aún no tienes solicitudes de servicio. Vuelve al inicio y usa nuestra IA para encontrar un experto rápidamente.</p>
            <button onClick={() => router.push('/')} className="mt-6 bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-semibold transition-colors shadow-sm">
              Buscar un Servicio
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map(req => (
               <div key={req.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                 
                 {/* Status indicator */}
                 {req.status === "PENDING" && (
                   <span className="absolute top-4 right-4 text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-full animate-pulse">Esperando Respuesta...</span>
                 )}
                 {req.status === "ACCEPTED" && (
                   <span className="absolute top-4 right-4 text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">MATCH ¡Aceptado!</span>
                 )}
                 
                 <div className="mb-4 pr-24">
                   <p className="text-xs font-bold text-primary uppercase">{req.serviceCategory}</p>
                   <h3 className="text-lg font-semibold text-foreground mt-1">"{req.description}"</h3>
                 </div>
                 
                 {req.status === "ACCEPTED" ? (
                   <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
                     <p className="text-sm text-slate-600 dark:text-slate-300 block">El especialista aceptó tu trabajo.</p>
                     <a href="https://wa.me/56912345678" target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-2 rounded-lg font-bold hover:bg-[#1DA851] transition-colors">
                       <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.298.045-.677.086-1.921-.432-1.498-.622-2.527-2.146-2.603-2.247-.076-.102-.622-.827-.622-1.579 0-.751.391-1.12.529-1.267.138-.146.299-.183.399-.183.1 0 .199.004.288.008.106.005.233-.038.358.261.128.307.436 1.066.474 1.144.038.077.064.167.013.267-.051.101-.077.164-.153.255-.078.093-.163.203-.23.28-.076.088-.155.185-.065.34.09.155.4 0 .66.903.26.241.517.382.684.484.167.102.261.085.358.053.053-.016.153-.082.34-.34.364-.492.368-.903.255-.1.085-.367-.123-.55-.268z"></path></svg>
                       Contactar Experto
                     </a>
                     <StarRating onSubmit={async (rating, comment) => {
                       await submitReview({
                         requestId: req.id!,
                         clientId: user!.uid,
                         providerId: req.providerId,
                         rating,
                         comment,
                       });
                     }} />
                   </div>
                 ) : req.status === "COMPLETED" ? (
                   <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg text-sm text-emerald-700 dark:text-emerald-300 font-medium text-center">
                     ✅ Trabajo completado y calificado
                   </div>
                 ) : (
                   <div className="mt-4 bg-slate-50 dark:bg-slate-900 rounded-lg p-3 text-sm text-slate-500 flex items-start gap-2">
                     <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                     Notificamos al especialista, y estamos esperando su respuesta. Si acepta, se abrirá el contacto.
                   </div>
                 )}
               </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
