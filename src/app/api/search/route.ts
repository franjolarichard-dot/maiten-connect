import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { ProviderProfile } from '@/lib/types';

// Soportar local (Ollama) o veloz nube (Gemini vía OpenAI-compatible endpoint)
const isOllama = process.env.USE_OLLAMA === "true";
const isGemini = process.env.USE_GEMINI === "true";

// Cliente OpenAI (usado para Ollama o OpenAI real)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "ollama-dummy",
  baseURL: isOllama ? "http://127.0.0.1:11434/v1" : undefined,
});

// Fórmula de Haversine para calcular distancias en km
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

// Función helper: buscar proveedores que coincidan con las palabras clave
function findMatchingProviders(
  docs: { id: string; data: ProviderProfile }[],
  keywords: string[],
  userLat?: number,
  userLng?: number
) {
  const matched: any[] = [];

  for (const { data } of docs) {
    // Filtro de disponibilidad
    if (data.isAvailable === false) continue;

    const services = data.servicesOffered?.map(s => s.toLowerCase().trim()) || [];

    // ¿Algún keyword coincide con algún servicio?
    const isMatch = keywords.some(kw =>
      services.some(s => s.includes(kw) || kw.includes(s))
    );

    if (isMatch) {
      if (userLat && userLng && data.location?.lat && data.location?.lng) {
        const dist = getDistanceFromLatLonInKm(userLat, userLng, data.location.lat, data.location.lng);
        if (dist <= (data.activeRadiusKm || 30)) {
          matched.push({ ...data, distanceKm: dist.toFixed(1) });
        }
      } else {
        matched.push(data);
      }
    }
  }

  return matched;
}

export async function POST(req: Request) {
  try {
    const { prompt, userLat, userLng } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // === PASO 1: Cargar TODOS los proveedores de Firestore ===
    const providersRef = collection(db, 'providers');
    const querySnapshot = await getDocs(providersRef);

    const allDocs: { id: string; data: ProviderProfile }[] = [];
    querySnapshot.forEach((docSnap) => {
      allDocs.push({ id: docSnap.id, data: docSnap.data() as ProviderProfile });
    });

    const promptLower = prompt.toLowerCase().trim();

    // === PASO 2: Intentar clasificar con IA ===
    let parsedIntent: any = { category: '', summary: '' };
    let aiWorked = false;

    try {
      let aiClient = openai;
      let modelName = isOllama ? (process.env.OLLAMA_MODEL || "llama3.2") : "gpt-4o-mini";

      if (isGemini && process.env.GEMINI_API_KEY) {
        aiClient = new OpenAI({
          apiKey: process.env.GEMINI_API_KEY,
          baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
        });
        modelName = "gemini-2.0-flash";
      }

      if (isGemini || isOllama || process.env.OPENAI_API_KEY) {
        const systemPrompt = "Eres el asistente de MaitenConnect, plataforma de servicios en Chile. Clasifica la necesidad del usuario. Devuelve JSON con 'category' (palabra clave: gasfiter, piscinas, limpieza, electricista, agua, fletes, arquitectura, constructora, pintor, jardinero) y 'summary' (resumen corto).";

        const completion = await aiClient.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          model: modelName,
          response_format: { type: "json_object" }
        });

        parsedIntent = JSON.parse(completion.choices[0].message.content || "{}");
        aiWorked = true;
      }
    } catch (aiError: any) {
      console.warn("IA no disponible, usando búsqueda por keywords:", aiError.message);
      // La IA falló, pero seguimos con búsqueda por keywords
    }

    // === PASO 3: Buscar proveedores con Matching Multicapa ===
    const category = parsedIntent.category?.toLowerCase() || '';
    const summary = parsedIntent.summary?.toLowerCase() || '';

    // Construir lista de keywords de búsqueda
    const keywords = new Set<string>();
    // Siempre incluir el prompt del usuario como keyword
    keywords.add(promptLower);
    // Incluir cada palabra del prompt como keyword individual
    promptLower.split(/\s+/).forEach(w => { if (w.length > 2) keywords.add(w); });
    // Si la IA funcionó, incluir la categoría y palabras del summary
    if (category) keywords.add(category);
    if (summary) {
      summary.split(/\s+/).forEach(w => { if (w.length > 2) keywords.add(w); });
    }

    const matchedProviders = findMatchingProviders(
      allDocs,
      Array.from(keywords),
      userLat,
      userLng
    );

    return NextResponse.json({
      intent: parsedIntent,
      providers: matchedProviders,
      meta: {
        aiWorked,
        keywords: Array.from(keywords),
        totalProviders: allDocs.length,
        matchedCount: matchedProviders.length,
      }
    });

  } catch (error: any) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
