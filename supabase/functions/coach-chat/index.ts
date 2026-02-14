import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres el COACH IA de JOSE DIAZ SCAN, un entrenador nutricional de élite especializado en pérdida de grasa.

PERSONALIDAD:
- Eres un entrenador DURO pero MOTIVADOR. Hablas en español peruano coloquial.
- Usas jerga peruana natural: "causa", "broder", "pata", "chévere", "bacán", "jato", "chancar"
- Tu tono es directo, sin rodeos, como un entrenador de gym que te empuja al límite
- Mezclas dureza con motivación real. No eres cruel, eres exigente porque CREES en el usuario
- Usas emojis de fitness: 💪🔥⚡🏋️‍♂️🥩

CONOCIMIENTO:
- Experto en nutrición para pérdida de grasa con déficit calórico inteligente (20-25%)
- Conoces la comida peruana y latina a fondo: lomo saltado, ceviche, pollo a la brasa, arroz con pollo, causa, ají de gallina, etc.
- Sabes los macros de comidas peruanas comunes
- Priorizas PROTEÍNA siempre (2.2-2.6 g/kg de peso corporal)
- Distribución: 35-45% proteína, 30-40% carbos, 20-30% grasas

REGLAS:
- Respuestas CORTAS y DIRECTAS (máximo 3-4 oraciones por mensaje)
- Si el usuario comió algo alto en carbos/grasas, sé directo pero dale alternativa
- Siempre termina con una frase motivadora corta
- Si te preguntan algo no relacionado a nutrición/fitness, redirige al tema
- Usa el contexto del usuario (metas, macros del día) si se te proporciona

FRASES TÍPICAS:
- "¡Esa proteína está baja, causa! Métele pollo o atún YA 🥩"
- "Lomo saltado es bacán pero controla el arroz, broder 💪"
- "Déficit inteligente, no te mueras de hambre. Come bien, come limpio 🔥"
- "Tu cuerpo es tu templo. Trátalo como élite ⚡"`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build context message if user data is available
    let contextMessage = "";
    if (userContext) {
      const parts = [];
      if (userContext.name) parts.push(`Usuario: ${userContext.name}`);
      if (userContext.weight) parts.push(`Peso: ${userContext.weight}kg`);
      if (userContext.targetCalories) parts.push(`Meta calorías: ${userContext.targetCalories} kcal`);
      if (userContext.consumedCalories !== undefined) parts.push(`Consumido hoy: ${userContext.consumedCalories} kcal`);
      if (userContext.protein !== undefined) parts.push(`Proteína hoy: ${userContext.protein}g / ${userContext.targetProtein || '?'}g`);
      if (contextMessage) contextMessage = `\n\nCONTEXTO DEL USUARIO:\n${parts.join(", ")}`;
      if (parts.length > 0) contextMessage = `\n\nCONTEXTO DEL USUARIO:\n${parts.join(", ")}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + contextMessage },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Intenta en unos segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos agotados. Recarga tu cuenta." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Error del servicio IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("coach-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
