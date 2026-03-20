import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { ProviderProfile } from '@/lib/types';

// Soportar local (Ollama) o veloz nube (Gemini vía API Nativa)
const isOllama = process.env.USE_OLLAMA === "true";
const isGemini = process.env.USE_GEMINI === "true";

// Cliente OpenAI (usado para Ollama o OpenAI real)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "ollama-dummy",
  baseURL: isOllama ? "http://127.0.0.1:11434/v1" : undefined,
});

// Fórmula de Haversine para calcular distancias en km
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radio de la tierra en km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; 
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export async function POST(req: Request) {
  try {
    const { prompt, userLat, userLng } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if(!isOllama && !isGemini && !process.env.OPENAI_API_KEY) {
         console.warn("ADVERTENCIA: Inteligencia artificial no configurada. Usando Match simulado.");
         return NextResponse.json({
            intent: { category: "gasfiter", summary: "Fuga de gas detectada" },
            providers: []
         });
    }

    // 1. Interpretar lenguaje natural con IA
    let parsedIntent: any = {};
    const systemPrompt = "Eres el asistente inteligente de MaitenConnect, una plataforma de servicios en Chile (Zapallar, Maitencillo, etc). Clasifica el problema del usuario de manera estricta. Devuelve un JSON válido con la propiedad 'category' (una sola palabra clave en minúscula como: gasfiter, piscinas, limpieza, electricista, flete) y la propiedad 'summary' (un resumen muy corto del problema).";

    if (isGemini) {
      if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing");
      const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           system_instruction: { parts: { text: systemPrompt } },
           contents: [{ parts: [{ text: prompt }] }],
           generationConfig: { responseMimeType: "application/json" }
        })
      });
      const data = await gRes.json();
      if (!gRes.ok) throw new Error(data.error?.message || "Gemini fetch failed");
      
      const txt = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      parsedIntent = JSON.parse(txt);

    } else {
      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        model: isOllama ? (process.env.OLLAMA_MODEL || "llama3.2") : "gpt-4o-mini",
        response_format: { type: "json_object" }
      });
      parsedIntent = JSON.parse(completion.choices[0].message.content || "{}");
    }

    const category = parsedIntent.category?.toLowerCase() || '';
    const summary = parsedIntent.summary?.toLowerCase() || '';
    const promptLower = prompt.toLowerCase();

    // 2. Buscar en Firestore a los proveedores correspondientes
    const providersRef = collection(db, 'providers');
    const q = query(providersRef, where('isAvailable', '==', true));
    
    const querySnapshot = await getDocs(q);
    
    let matchedProviders: any[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as ProviderProfile;
      const services = data.servicesOffered?.map(s => s.toLowerCase()) || [];
      
      // Lógica de Matching Multicapa
      const isCategoryMatch = category && services.some(s => s.includes(category) || category.includes(s));
      const isSummaryMatch = summary && services.some(s => summary.includes(s) || s.includes(summary));
      const isPromptKeywordMatch = services.some(s => promptLower.includes(s) || s.includes(promptLower));

      if (isCategoryMatch || isSummaryMatch || isPromptKeywordMatch) {
        // Si el cliente nos envió su ubicación, filtramos por < 30km
        if (userLat && userLng && data.location?.lat && data.location?.lng) {
          const dist = getDistanceFromLatLonInKm(userLat, userLng, data.location.lat, data.location.lng);
          if (dist <= (data.activeRadiusKm || 30)) {
             matchedProviders.push({...data, distanceKm: dist.toFixed(1)});
          }
        } else {
           matchedProviders.push(data);
        }
      }
    });

    return NextResponse.json({
      intent: parsedIntent,
      providers: matchedProviders,
    });

  } catch (error: any) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
