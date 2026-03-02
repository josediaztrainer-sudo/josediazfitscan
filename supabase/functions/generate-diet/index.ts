import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { targetCalories, targetProtein, targetCarbs, targetFat, mealsPerDay, sex, weightKg, questionnaire } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const mealNames: Record<number, string[]> = {
      2: ["Almuerzo", "Cena"],
      3: ["Desayuno", "Almuerzo", "Cena"],
      4: ["Desayuno", "Almuerzo", "Cena", "Snack"],
      5: ["Desayuno", "Snack AM", "Almuerzo", "Snack PM", "Cena"],
    };

    const meals = mealNames[mealsPerDay] || mealNames[3];

    // Build health context from questionnaire
    let healthContext = "";
    if (questionnaire) {
      const q = questionnaire;

      // Lifestyle
      const lifestyleMap: Record<string, string> = {
        sedentary: "sedentario (trabajo de oficina)",
        light: "ligeramente activo",
        moderate: "moderadamente activo (ejercicio 3-4 veces/semana)",
        active: "muy activo (ejercicio diario)",
        athlete: "atleta/deportista de alto rendimiento",
      };
      healthContext += `\n- Ritmo de vida: ${lifestyleMap[q.lifestyle] || q.lifestyle}`;

      // Meal times
      if (q.mealTimes) {
        healthContext += `\n- Horarios y disponibilidad: ${q.mealTimes}`;
      }

      // Allergies
      if (q.allergies && !q.allergies.includes("none")) {
        const allergyLabels: Record<string, string> = {
          lactose: "lácteos/lactosa", gluten: "gluten", eggs: "huevos",
          nuts: "frutos secos/maní", shellfish: "mariscos", fish: "pescado", soy: "soya",
        };
        const allergyList = q.allergies.map((a: string) => allergyLabels[a] || a).join(", ");
        const extra = q.otherAllergy ? `, ${q.otherAllergy}` : "";
        healthContext += `\n- ALERGIAS/INTOLERANCIAS (CRÍTICO - EXCLUIR ESTOS ALIMENTOS): ${allergyList}${extra}`;
      }

      // Digestive issues
      if (q.digestiveIssues && !q.digestiveIssues.includes("none")) {
        const digestiveLabels: Record<string, string> = {
          ibs: "colon irritable", gastritis: "gastritis/reflujo", bloating: "hinchazón abdominal",
          crohn: "enfermedad de Crohn", celiac: "celiaquía", constipation: "estreñimiento crónico",
        };
        const digestiveList = q.digestiveIssues.map((d: string) => digestiveLabels[d] || d).join(", ");
        const extra = q.otherDigestive ? `, ${q.otherDigestive}` : "";
        healthContext += `\n- PATOLOGÍAS DIGESTIVAS (adaptar alimentos): ${digestiveList}${extra}`;
      }

      // Diseases
      if (q.diseases && !q.diseases.includes("none")) {
        const diseaseLabels: Record<string, string> = {
          insulin_resistance: "resistencia a la insulina",
          diabetes_2: "diabetes tipo 2",
          hypertension: "hipertensión arterial",
          hypothyroid: "hipotiroidismo",
          pcos: "SOP (síndrome de ovario poliquístico)",
          fatty_liver: "hígado graso",
          high_cholesterol: "colesterol/triglicéridos altos",
          anemia: "anemia",
        };
        const diseaseList = q.diseases.map((d: string) => diseaseLabels[d] || d).join(", ");
        const extra = q.otherDisease ? `, ${q.otherDisease}` : "";
        healthContext += `\n- CONDICIONES DE SALUD (plan terapéutico nutricional): ${diseaseList}${extra}`;
      }
    }

    const systemPrompt = `Eres Jose Diaz, nutricionista deportivo clínico con décadas de experiencia en nutrición deportiva y clínica.
Has ayudado a cientos de personas a recuperar su salud y forma física abordando casos complejos con alimentación terapéutica.

REGLAS CRÍTICAS:
- Cada comida debe tener EXACTAMENTE 3 opciones diferentes y variadas para evitar monotonía
- Cada opción debe listar alimentos con GRAMOS EXACTOS y macros por alimento
- Los totales de cada opción deben sumar EXACTAMENTE los macros asignados a esa comida (±5g tolerancia)
- Usa alimentos reales, accesibles y económicos de Perú y Latinoamérica
- Incluye preparaciones simples y prácticas adaptadas a los horarios del usuario
- Las porciones deben ser en gramos o medidas caseras (tazas, cucharadas, unidades)
- Prioriza proteínas magras: pollo, pescado, huevo, atún, carne magra
- Incluye carbohidratos complejos: arroz, avena, camote, papa, quinua
- Grasas saludables: palta, aceite de oliva, frutos secos, maní

REGLAS DE SALUD (si aplica):
- Si hay alergias: JAMÁS incluir esos alimentos ni derivados
- Si hay patologías digestivas: elegir alimentos suaves, evitar irritantes, adaptar preparaciones
  - Colon irritable: evitar FODMAP altos, lácteos, legumbres en exceso, alimentos flatulentos
  - Gastritis: evitar ácidos, picantes, fritos, café
  - Crohn: alimentos blandos, cocidos, sin fibra insoluble en brotes
- Si hay enfermedades metabólicas: adaptar distribución de macros
  - Resistencia a insulina/Diabetes: carbohidratos de bajo índice glucémico, distribuidos, con fibra
  - Hipertensión: bajo en sodio, rico en potasio y magnesio
  - Hipotiroidismo: evitar soya cruda, incluir selenio, zinc, yodo
  - Hígado graso: evitar azúcares simples, grasas saturadas, incluir antioxidantes
  - Colesterol alto: limitar grasas saturadas, incluir omega-3, fibra soluble
  - Anemia: alimentos ricos en hierro hemo con vitamina C
  - SOP: bajo índice glucémico, antiinflamatorio

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

    const userPrompt = `Genera un plan de alimentación 100% personalizado con estos requerimientos:

DATOS NUTRICIONALES:
- Calorías diarias: ${targetCalories} kcal
- Proteína diaria: ${targetProtein}g
- Carbohidratos diarios: ${targetCarbs}g
- Grasas diarias: ${targetFat}g
- Número de comidas: ${mealsPerDay}
- Comidas: ${meals.join(", ")}
- Sexo: ${sex === "male" ? "Masculino" : "Femenino"}
- Peso: ${weightKg}kg

PERFIL DEL PACIENTE:${healthContext || "\n- Sin condiciones especiales"}

INSTRUCCIONES:
- Distribuye los macros proporcionalmente entre las ${mealsPerDay} comidas
- Genera 3 opciones DIFERENTES y VARIADAS para cada comida (variedad es clave para adherencia)
- Adapta las preparaciones a los horarios y disponibilidad del paciente
- Si hay condiciones de salud, aplica protocolo nutricional terapéutico específico
- Responde SOLO con el JSON, sin texto adicional.`;

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
