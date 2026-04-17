// Edge function: Genera una rutina personalizada usando anamnesis + análisis visual de 4 fotos del físico
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Eres el COACH JOSÉ DIAZ, experto humano peruano en nutrición deportiva clínica y entrenamiento personalizado, con 15+ años de experiencia.

Recibirás:
1. Una anamnesis detallada del cliente (lugar de entrenamiento, nivel, días disponibles, objetivos, restricciones físicas).
2. Cuatro fotografías del físico actual: FRENTE, ESPALDA, PERFIL DERECHO, PERFIL IZQUIERDO.

Tu trabajo:
- Analiza CADA foto con precisión clínica y describe brevemente lo que observas (postura, asimetrías, grupos musculares dominantes y rezagados, % de grasa estimado visualmente, distribución de masa).
- En base a las observaciones visuales + anamnesis, diseña una RUTINA SEMANAL específica y personalizada que ATAQUE las debilidades visibles y respete restricciones médicas.
- Sé EXTREMADAMENTE PRECISO y SEGURO: si hay lesión o condición médica, adapta o evita ejercicios que comprometan la zona.

FORMATO DE RESPUESTA OBLIGATORIO (Markdown):

## 🔍 ANÁLISIS VISUAL DEL FÍSICO

**Vista frontal:** [observaciones]
**Vista posterior:** [observaciones]
**Perfil derecho:** [observaciones]
**Perfil izquierdo:** [observaciones]

**🎯 Diagnóstico:** [zonas a priorizar y por qué]

---

## 💪 RUTINA PERSONALIZADA

**📍 Lugar:** [casa/gimnasio]
**📅 Frecuencia:** [X días/semana]
**📊 Nivel:** [principiante/intermedio/avanzado]
**🎯 Enfoque:** [zonas prioritarias]

### Día 1 — [nombre del día, ej: Push / Empuje]

| Ejercicio | Series | Reps | Descanso | Notas técnicas |
|-----------|--------|------|----------|----------------|
| ... | ... | ... | ... | ... |

(Repite tabla por cada día de entrenamiento)

### 🏃 Cardio / Acondicionamiento
[Prescripción específica si aplica]

### ⚠️ Precauciones según restricciones
[Lista clara de qué evitar y alternativas]

### 📈 Progresión semana a semana
[Cómo subir cargas, reps o intensidad cada semana para asegurar progreso continuo]

### 🔥 Tips finales del coach
[2-3 consejos motivacionales y técnicos clave]

Usa terminología peruana, tono motivador pero profesional. NUNCA digas que eres una IA.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY no configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      location, // "casa" | "gimnasio"
      level, // "principiante" | "intermedio" | "avanzado"
      daysPerWeek, // number
      objectives, // string
      restrictions, // string
      sessionMinutes, // number
      photos, // { front?: base64, back?: base64, right?: base64, left?: base64 }
      userMeta, // { sex, age, weight, height }
    } = body || {};

    if (!location || !level || !daysPerWeek) {
      return new Response(
        JSON.stringify({ error: "Faltan datos obligatorios (lugar, nivel, días)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anamnesisText = `## DATOS DEL CLIENTE
- **Sexo:** ${userMeta?.sex || "no indicado"}
- **Edad:** ${userMeta?.age || "no indicado"} años
- **Peso:** ${userMeta?.weight || "no indicado"} kg
- **Altura:** ${userMeta?.height || "no indicado"} cm

## ANAMNESIS DE ENTRENAMIENTO
- **Lugar:** ${location === "casa" ? "🏠 Casa (sin equipo de gimnasio)" : "🏋️ Gimnasio completo"}
- **Nivel:** ${level}
- **Días disponibles:** ${daysPerWeek} días/semana
- **Duración por sesión:** ${sessionMinutes || 60} minutos
- **Objetivos:** ${objectives || "No especificado"}
- **Restricciones físicas / lesiones / condiciones médicas:** ${restrictions || "Ninguna reportada"}

Por favor analiza las 4 fotografías adjuntas y diseña la rutina ideal.`;

    // Build multimodal content array
    const userContent: any[] = [{ type: "text", text: anamnesisText }];
    const photoLabels: Record<string, string> = {
      front: "FRENTE (vista frontal del torso)",
      back: "ESPALDA (vista posterior)",
      right: "PERFIL DERECHO",
      left: "PERFIL IZQUIERDO",
    };
    for (const key of ["front", "back", "right", "left"] as const) {
      const b64 = photos?.[key];
      if (b64) {
        userContent.push({ type: "text", text: `\n📸 Foto ${photoLabels[key]}:` });
        userContent.push({
          type: "image_url",
          image_url: { url: b64.startsWith("data:") ? b64 : `data:image/jpeg;base64,${b64}` },
        });
      }
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de uso alcanzado. Intenta en unos minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Recarga en Lovable Cloud." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Error del modelo AI", detail: errText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await aiResp.json();
    const routine = data?.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ routine }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-routine-from-photos error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
