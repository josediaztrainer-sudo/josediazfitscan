import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { targetCalories, targetProtein, targetCarbs, targetFat, mealsPerDay, sex, weightKg } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const mealNames: Record<number, string[]> = {
      2: ["Almuerzo", "Cena"],
      3: ["Desayuno", "Almuerzo", "Cena"],
      4: ["Desayuno", "Almuerzo", "Cena", "Snack"],
      5: ["Desayuno", "Snack AM", "Almuerzo", "Snack PM", "Cena"],
    };

    const meals = mealNames[mealsPerDay] || mealNames[3];

    const systemPrompt = `Eres un nutricionista deportivo experto en dietas latinoamericanas. 
Genera planes de alimentación EXACTOS y REALISTAS usando alimentos comunes en Perú y Latinoamérica.

REGLAS CRÍTICAS:
- Cada comida debe tener EXACTAMENTE 3 opciones diferentes
- Cada opción debe listar alimentos con GRAMOS EXACTOS y macros por alimento
- Los totales de cada opción deben sumar EXACTAMENTE los macros asignados a esa comida (±5g tolerancia)
- Usa alimentos reales, accesibles y económicos
- Incluye preparaciones simples y prácticas
- Las porciones deben ser en gramos o medidas caseras (tazas, cucharadas, unidades)
- Prioriza proteínas magras: pollo, pescado, huevo, atún, carne magra
- Incluye carbohidratos complejos: arroz, avena, camote, papa, quinua
- Grasas saludables: palta, aceite de oliva, frutos secos, maní

FORMATO DE RESPUESTA (JSON estricto):
Responde SOLO con un JSON válido, sin markdown ni texto adicional.
{
  "meals": [
    {
      "name": "Nombre de la comida",
      "targetCalories": number,
      "targetProtein": number,
      "targetCarbs": number,
      "targetFat": number,
      "options": [
        {
          "name": "Opción descriptiva",
          "foods": [
            {
              "name": "Alimento",
              "amount": "150g",
              "calories": number,
              "protein": number,
              "carbs": number,
              "fat": number
            }
          ],
          "totalCalories": number,
          "totalProtein": number,
          "totalCarbs": number,
          "totalFat": number
        }
      ]
    }
  ]
}`;

    const userPrompt = `Genera un plan de alimentación personalizado con estos requerimientos:

- Calorías diarias: ${targetCalories} kcal
- Proteína diaria: ${targetProtein}g
- Carbohidratos diarios: ${targetCarbs}g
- Grasas diarias: ${targetFat}g
- Número de comidas: ${mealsPerDay}
- Comidas: ${meals.join(", ")}
- Sexo: ${sex === "male" ? "Masculino" : "Femenino"}
- Peso: ${weightKg}kg

Distribuye los macros proporcionalmente entre las ${mealsPerDay} comidas.
Genera 3 opciones diferentes para cada comida, variadas y deliciosas.
Responde SOLO con el JSON, sin texto adicional.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes, intenta en unos minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos agotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    
    // Clean markdown fences if present
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    const dietPlan = JSON.parse(content);

    return new Response(JSON.stringify(dietPlan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-diet error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error generando dieta" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
