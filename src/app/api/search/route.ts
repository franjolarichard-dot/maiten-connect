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

    // Configurar cliente según el proveedor elegido
    let aiClient = openai;
    let modelName = isOllama ? (process.env.OLLAMA_MODEL || "llama3.2") : "gpt-4o-mini";

    if (isGemini && process.env.GEMINI_API_KEY) {
      aiClient = new OpenAI({
        apiKey: process.env.GEMINI_API_KEY,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
      });
      modelName = "gemini-1.5-flash"; // Nombre estable en el endpoint OpenAI-compatible
    } else if (!isOllama && !process.env.OPENAI_API_KEY) {
       // Fallback a simulación si nada está configurado
       return NextResponse.json({
          intent: { category: "gasfiter", summary: "Fuga de gas detectada" },
          providers: []
       });
    }

    // 1. Interpretar lenguaje natural con IA (Universal via OpenAI SDK)
    const systemPrompt = "Eres el asistente inteligente de MaitenConnect, una plataforma de servicios en Chile. Clasifica el problema del usuario. Devuelve un JSON con: 'category' (una sola palabra clave en minúscula: gasfiter, piscinas, limpieza, electricista, fletes, etc) y 'summary' (resumen corto).";
    
    const completion = await aiClient.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      model: modelName,
      response_format: { type: "json_object" }
    });

    const parsedIntent = JSON.parse(completion.choices[0].message.content || "{}");

    const category = parsedIntent.category?.toLowerCase() || '';
    const summary = parsedIntent.summary?.toLowerCase() || '';
    const promptLower = prompt.toLowerCase();

    // 2. Buscar en Firestore a los proveedores correspondientes
    const providersRef = collection(db, 'providers');
    // Consultamos todos y filtramos en memoria para evitar problemas con campos faltantes (como isAvailable)
    const querySnapshot = await getDocs(providersRef);
    
    let matchedProviders: any[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as ProviderProfile;
      
      // Filtro de disponibilidad (si no existe el campo, asumimos true por defecto)
      if (data.isAvailable === false) return;

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
