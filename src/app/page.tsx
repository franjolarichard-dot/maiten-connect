import Image from "next/image";
import { useState, useEffect } from "react";
import { ProviderProfile } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { createServiceRequest } from "@/lib/db";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ intent: any, providers: ProviderProfile[] } | null>(null);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({ providers: 0, cities: 4 });
  
  const { user } = useAuth();
  const router = useRouter();
  const [requestStatus, setRequestStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const q = query(collection(db, "providers"), where("isAvailable", "==", true));
        const snapshot = await getDocs(q);
        setStats(prev => ({ ...prev, providers: snapshot.size }));
      } catch (e) {
        console.error("Error fetching stats:", e);
      }
    };
    fetchStats();
  }, []);

  const handleRequestService = async (provider: ProviderProfile) => {
    if (!user) {
      router.push("/login");
      return;
    }
    
    if (requestStatus[provider.uid] === "SENT") return;
    setRequestStatus(prev => ({...prev, [provider.uid]: "LOADING"}));
    
    try {
       await createServiceRequest({
         clientId: user.uid,
         providerId: provider.uid,
         serviceCategory: results?.intent?.category || "general",
         description: prompt
       });
       setRequestStatus(prev => ({...prev, [provider.uid]: "SENT"}));
    } catch(err) {
       console.error("Error al crear solicitud:", err);
       setRequestStatus(prev => ({...prev, [provider.uid]: "ERROR"}));
    }
  };

  const handleSearch = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    setResults(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, userLat: null, userLng: null })
      });

      if (!res.ok) throw new Error("Error al buscar. Verifica tu conexión e intenta de nuevo.");

      const data = await res.json();
      setResults(data);
      
      // Scroll to results
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex flex-col items-center justify-start p-6 sm:p-12 lg:p-24 relative overflow-hidden pt-32">
        {/* Background Orbs */}
        <div className="absolute top-[10%] left-[10%] w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-[5%] right-[10%] w-96 h-96 bg-secondary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[30%] w-96 h-96 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

        <div className="z-10 w-full max-w-5xl flex flex-col items-center text-center gap-6 transition-all duration-500">
          
          {/* Availability Badge */}
          <div className="glass px-6 py-2 rounded-full text-sm font-medium text-primary-dark dark:text-primary mb-2 shadow-sm flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
            {stats.providers > 0 ? `${stats.providers} Especialistas Activos en Maitencillo y alrededores` : "Conectando con expertos locales"}
          </div>
          
          {/* Main Headline */}
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-foreground to-slate-500 dark:from-foreground dark:to-slate-400 drop-shadow-sm leading-tight pb-2">
            El servicio que buscas, <br/><span className="text-primary selection:text-white">al instante.</span>
          </h1>
          
          {/* Sub headline */}
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl text-balance mt-2">
            Gasfíter, electricidad, limpieza y más. Cuéntanos qué necesitas y nuestra IA te conectará con el experto ideal en segundos.
          </p>

          {/* Input area */}
          <div className="w-full max-w-3xl mt-8 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/60 to-secondary/60 rounded-2xl blur opacity-25 transition duration-1000 group-hover:opacity-50"></div>
            <div className="relative flex flex-col sm:flex-row items-center glass-card p-2 rounded-2xl gap-2 w-full transition-shadow shadow-xl">
              <div className="flex-grow flex items-center w-full px-4">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <input 
                  type="text" 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                  placeholder="Ej: Mi cocina huele a gas o busco un arquitecto..." 
                  className="w-full bg-transparent border-none outline-none px-4 py-4 text-lg text-foreground placeholder-slate-400 focus:ring-0"
                />
              </div>
              <button 
                onClick={handleSearch}
                disabled={loading}
                className="w-full sm:w-auto bg-primary hover:bg-primary-dark disabled:bg-slate-400 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Buscando...
                  </>
                ) : "Encontrar Experto"}
              </button>
            </div>
          </div>
          
          {error && <p className="text-red-500 mt-2 font-medium bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">{error}</p>}

          {/* Featured Categories (Subtle) */}
          <div className="flex flex-wrap justify-center gap-3 mt-8 opacity-60 hover:opacity-100 transition-opacity">
            {["Gasfíter", "Electricista", "Limpieza", "Arquitectura", "Fletes"].map(cat => (
              <button key={cat} onClick={() => { setPrompt(`Busco ${cat.toLowerCase()}`); }} className="text-xs font-bold px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                {cat}
              </button>
            ))}
          </div>

          {/* Results Area */}
          {results && (
            <div id="results-section" className="w-full max-w-4xl mt-12 text-left animate-in fade-in slide-in-from-bottom-8 duration-500">
              <div className="mb-6 flex flex-col sm:flex-row items-center sm:items-baseline justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-foreground">Resultados para: <span className="text-primary capitalize">{results.intent?.category || "General"}</span></h3>
                    <p className="text-slate-500 mt-1">Interpretación de IA: {results.intent?.summary}</p>
                </div>
                <span className="px-4 py-1 glass rounded-full text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {results.providers.length} Especialistas Encontrados
                </span>
              </div>

              {results.providers.length === 0 ? (
                <div className="glass-card p-12 text-center flex flex-col items-center">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <h4 className="text-xl font-bold text-foreground mb-2">No encontramos especialistas registrados (Aún 😉)</h4>
                  <p className="text-slate-500 max-w-md">Actualmente no tenemos proveedores activos en la categoría <strong className="capitalize">{results.intent?.category}</strong>. Esto es normal en la fase de prueba. ¡Intenta con otra búsqueda!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {results.providers.map((p, i) => (
                    <div key={p.uid || i} className="glass-card p-6 flex flex-col hover:border-primary/50 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-blue-500 text-white flex items-center justify-center text-xl font-bold shadow-md">
                            {p.displayName?.charAt(0).toUpperCase() || "E"}
                          </div>
                          <div>
                            <h4 className="font-bold text-lg text-foreground leading-tight">{p.displayName}</h4>
                            <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                              Verificado · {p.location?.city || "Maitencillo"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-sm font-bold text-slate-700 dark:text-slate-300">
                          <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                          {p.rating || "Nuevo"}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-6">
                        {p.servicesOffered?.map(s => (
                          <span key={s} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-400 capitalize">
                            {s}
                          </span>
                        ))}
                      </div>

                      <div className="mt-auto">
                        <button 
                          onClick={() => handleRequestService(p)}
                          disabled={requestStatus[p.uid] === "LOADING" || requestStatus[p.uid] === "SENT"}
                          className="w-full bg-slate-900 dark:bg-slate-100 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 text-white dark:text-slate-900 font-semibold py-3 rounded-xl hover:bg-primary dark:hover:bg-primary disabled:hover:bg-slate-300 transition-colors shadow-md disabled:shadow-none disabled:cursor-not-allowed cursor-pointer">
                          {requestStatus[p.uid] === "LOADING" ? "Enviando Solicitud..." : 
                           requestStatus[p.uid] === "SENT" ? "¡Solicitud Enviada!" : 
                           "Solicitar Servicio"}
                        </button>
                        {requestStatus[p.uid] === "SENT" && (
                          <p className="text-xs text-center mt-2 text-slate-500 font-medium animate-in fade-in">
                            Ve a tu panel para ver la respuesta del especialista.
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* How it works section */}
          <section className="w-full max-w-5xl mt-32 mb-20">
            <h2 className="text-3xl font-bold text-foreground mb-12">¿Cómo funciona MaitenConnect?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: "1", title: "Cuéntanos tu problema", desc: "Usa el buscador para explicar qué necesitas en lenguaje natural. Nuestra IA hace el resto." },
                { step: "2", title: "Conecta con expertos", desc: "Recibe opciones de profesionales verificados cerca de tu ubicación." },
                { step: "3", title: "Califica el servicio", desc: "Una vez terminado el trabajo, califica tu experiencia para ayudar a la comunidad." }
              ].map((item, i) => (
                <div key={i} className="glass-card p-8 relative overflow-hidden group">
                  <div className="absolute top-[-20px] right-[-20px] text-8xl font-black text-slate-100 dark:text-slate-800/30 group-hover:scale-110 transition-transform duration-500">
                    {item.step}
                  </div>
                  <h4 className="text-xl font-bold text-foreground mb-3 relative z-10">{item.title}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed relative z-10">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
             <div className="text-2xl font-black tracking-tighter text-primary flex items-center gap-2 mb-4">
               MaitenConnect
             </div>
             <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
               La plataforma líder en conexión de servicios para el litoral norte. Conectamos talento local con necesidades reales mediante inteligencia artificial.
             </p>
          </div>
          <div>
            <h5 className="font-bold text-foreground mb-4">Plataforma</h5>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><button onClick={() => router.push("/login")} className="hover:text-primary transition-colors cursor-pointer">Acceder</button></li>
              <li><button onClick={() => router.push("/admin")} className="hover:text-primary transition-colors cursor-pointer">Panel de Admin</button></li>
              <li><a href="#" className="hover:text-primary transition-colors">Preguntas Frecuentes</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-foreground mb-4">Contacto</h5>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>Maitencillo, Puchuncaví</li>
              <li>soporte@maitenconnect.cl</li>
              <li>+56 9 XXXX XXXX</li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
            <p>© 2025 MaitenConnect. Todos los derechos reservados.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-slate-600 transition-colors">Privacidad</a>
              <a href="#" className="hover:text-slate-600 transition-colors">Términos</a>
            </div>
        </div>
      </footer>
    </div>
  );
}
