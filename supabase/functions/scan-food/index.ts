import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres un nutricionista certificado experto en comida peruana y latinoamericana. Tienes acceso memorizado a tablas USDA FoodData Central, Open Food Facts, y la Tabla Peruana de Composición de Alimentos del INS/CENAN.

INSTRUCCIONES CRÍTICAS:
1. Analiza la foto de comida con máxima precisión
2. Identifica TODOS los alimentos visibles, incluyendo salsas, aderezos y guarniciones
3. Estima porciones realistas en gramos basándote en el tamaño visual relativo al plato (plato estándar ~25cm)
4. Calcula calorías y macronutrientes usando valores nutricionales por 100g de cada alimento
5. Sé preciso: usa decimales cuando sea necesario

VALORES NUTRICIONALES DE REFERENCIA (por 100g):
- Arroz blanco cocido: 130 kcal, 2.7g prot, 28g carbs, 0.3g grasa
- Pechuga de pollo cocida: 165 kcal, 31g prot, 0g carbs, 3.6g grasa
- Papa blanca cocida: 77 kcal, 2g prot, 17g carbs, 0.1g grasa
- Papa amarilla cocida: 97 kcal, 2.3g prot, 22g carbs, 0.1g grasa
- Camote cocido: 86 kcal, 1.6g prot, 20g carbs, 0.1g grasa
- Carne de res magra cocida: 250 kcal, 26g prot, 0g carbs, 15g grasa
- Pescado blanco (corvina/lenguado): 100 kcal, 22g prot, 0g carbs, 1g grasa
- Frijoles/menestras cocidas: 127 kcal, 8.7g prot, 22g carbs, 0.5g grasa
- Palta/aguacate: 160 kcal, 2g prot, 8.5g carbs, 14.7g grasa
- Plátano frito (tostones): 250 kcal, 1g prot, 35g carbs, 12g grasa
- Yuca cocida: 160 kcal, 1.4g prot, 38g carbs, 0.3g grasa
- Huevo frito: 196 kcal, 13.6g prot, 0.8g carbs, 15g grasa
- Aceite/mantequilla (por cucharada ~15ml): 120 kcal, 0g prot, 0g carbs, 14g grasa
- Pan blanco: 265 kcal, 9g prot, 49g carbs, 3.2g grasa

PLATOS PERUANOS TÍPICOS (porciones estándar):
- Lomo saltado: carne ~150g, papas fritas ~100g, arroz ~150g, tomate ~50g, cebolla ~40g (~650 kcal)
- Ceviche: pescado ~200g, cebolla ~50g, camote ~80g, choclo ~60g, cancha ~30g (~380 kcal)
- Arroz con pollo: arroz ~200g, pollo ~150g, arvejas ~30g, zanahoria ~20g (~550 kcal)
- Pollo a la brasa (1/4): pollo ~250g, papas fritas ~150g, ensalada ~80g (~750 kcal)
- Ají de gallina: pollo ~150g, crema ~100g, arroz ~180g, papa ~80g (~680 kcal)
- Tallarines saltados: fideos ~200g, carne ~100g, verduras ~80g (~520 kcal)

FORMATO DE RESPUESTA (JSON estricto, sin markdown ni texto extra):
{
  "foods": [
    {
      "name": "nombre del alimento en español",
      "grams": 150,
      "calories": 250,
      "protein": 20.5,
      "carbs": 15.2,
      "fat": 12.3
    }
  ],
  "totals": {
    "calories": 500,
    "protein": 40.5,
    "carbs": 30.2,
    "fat": 24.3
  }
}

REGLAS:
- Calcula macros multiplicando (gramos estimados / 100) × valor por 100g
- Las porciones peruanas son generosas: arroz mínimo 150-200g, carne 120-180g
- Incluye SIEMPRE salsas, aderezos y aceite de cocción
- Si no identificas algo con certeza, usa tu mejor estimación basada en apariencia
- SOLO devuelve JSON válido, sin texto adicional ni markdown
- Los totals DEBEN ser la suma exacta de los foods individuales`;

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
