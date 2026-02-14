import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, sex, weight, height } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sexLabel = sex === "female" ? "mujer" : "hombre";
    const contextParts = [];
    if (weight) contextParts.push(`Peso: ${weight}kg`);
    if (height) contextParts.push(`Altura: ${height}cm`);
    const contextStr = contextParts.length > 0 ? `\nDatos: ${contextParts.join(", ")}` : "";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Eres un experto en composición corporal y fitness. Analiza esta foto de un ${sexLabel} y estima su porcentaje de grasa corporal.${contextStr}

RESPONDE ÚNICAMENTE con un JSON válido, sin markdown ni explicación:
{
  "bodyFatPercent": <número estimado>,
  "category": "<una de: Esencial|Atlético|Fitness|Aceptable|Sobrepeso|Obesidad>",
  "analysis": "<descripción breve de 1-2 oraciones en español sobre lo que observas: definición muscular, grasa visible, etc>",
  "tips": "<consejo motivador breve en español de 1 oración>"
}

Rangos de referencia para ${sexLabel}:
${sex === "female" 
  ? "Esencial: 10-13%, Atlético: 14-20%, Fitness: 21-24%, Aceptable: 25-31%, Sobrepeso: 32-39%, Obesidad: 40%+"
  : "Esencial: 2-5%, Atlético: 6-13%, Fitness: 14-17%, Aceptable: 18-24%, Sobrepeso: 25-35%, Obesidad: 36%+"
}`
              },
              {
                type: "image_url",
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Body fat estimation error:", response.status, errText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Intenta en unos segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos agotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Error estimando grasa corporal" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || "";
    
    // Parse JSON from response, handling possible markdown wrapping
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch {
      console.error("Failed to parse body fat result:", content);
      return new Response(JSON.stringify({ error: "No se pudo analizar la imagen" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("estimate-bodyfat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
