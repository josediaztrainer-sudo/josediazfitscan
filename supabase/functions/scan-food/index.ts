import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres un nutricionista experto en comida peruana y latinoamericana con acceso a bases de datos USDA, Open Food Facts y conocimiento profundo de cocina peruana.

INSTRUCCIONES:
1. Analiza la foto de comida proporcionada
2. Identifica TODOS los alimentos visibles en el plato/imagen
3. Estima porciones realistas en gramos basándote en el tamaño visual
4. Calcula calorías y macronutrientes para cada alimento

CONOCIMIENTO DE COMIDA PERUANA:
- Lomo saltado: carne ~150g, papas fritas ~100g, arroz ~150g, tomate ~50g, cebolla ~40g
- Ceviche: pescado ~200g, cebolla ~50g, camote ~80g, choclo ~60g, cancha ~30g
- Arroz con pollo: arroz ~200g, pollo ~150g, arvejas ~30g, zanahoria ~20g
- Pollo a la brasa: 1/4 pollo ~250g, papas fritas ~150g, ensalada ~80g
- Causa rellena: papa amarilla ~200g, pollo/atún ~80g, palta ~40g, mayonesa ~20g
- Ají de gallina: pollo ~150g, crema ~100g, arroz ~180g, papa ~80g
- Tallarines saltados: fideos ~200g, carne ~100g, verduras ~80g
- Papa a la huancaína: papa ~200g, salsa ~80g
- Chicharrón: cerdo frito ~150g, camote ~100g, sarsa ~50g

FORMATO DE RESPUESTA (JSON estricto, sin markdown):
{
  "foods": [
    {
      "name": "nombre del alimento en español",
      "grams": 150,
      "calories": 250,
      "protein": 20,
      "carbs": 15,
      "fat": 12
    }
  ],
  "totals": {
    "calories": 500,
    "protein": 40,
    "carbs": 30,
    "fat": 24
  }
}

REGLAS:
- Sé preciso con las porciones peruanas (son generosas)
- Incluye salsas, aderezos, guarniciones
- Si ves arroz, siempre estima al menos 150-200g (porción peruana)
- Si no puedes identificar algo, haz tu mejor estimación
- SOLO devuelve el JSON, sin texto adicional ni markdown`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Se requiere una imagen" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    console.log("Analyzing food image...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Analiza esta foto de comida. Identifica todos los alimentos, estima porciones en gramos y calcula calorías y macros. Responde SOLO con JSON válido." },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Intenta en unos segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos agotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Error del servicio IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("AI response received, parsing...");

    // Extract JSON from the response (handle potential markdown wrapping)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    } else {
      // Try to find raw JSON
      const braceStart = content.indexOf("{");
      const braceEnd = content.lastIndexOf("}");
      if (braceStart !== -1 && braceEnd !== -1) {
        jsonStr = content.substring(braceStart, braceEnd + 1);
      }
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response as JSON:", content);
      return new Response(
        JSON.stringify({ error: "No se pudo interpretar la imagen. Intenta con otra foto." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate structure
    if (!parsed.foods || !Array.isArray(parsed.foods)) {
      return new Response(
        JSON.stringify({ error: "Respuesta IA inválida. Intenta de nuevo." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Recalculate totals to ensure consistency
    const totals = parsed.foods.reduce(
      (acc: any, f: any) => ({
        calories: acc.calories + (f.calories || 0),
        protein: acc.protein + (f.protein || 0),
        carbs: acc.carbs + (f.carbs || 0),
        fat: acc.fat + (f.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return new Response(
      JSON.stringify({ foods: parsed.foods, totals }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("scan-food error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
