import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_email, months } = await req.json();

    if (!user_email || !months) {
      return new Response(JSON.stringify({ error: "user_email y months son requeridos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify admin via Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find user by email
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw authError;

    const targetUser = authData.users.find((u) => u.email === user_email);
    if (!targetUser) {
      return new Response(JSON.stringify({ error: `Usuario con email ${user_email} no encontrado` }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate new trial_ends_at (extend from now or from current end date)
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("trial_ends_at, is_premium")
      .eq("user_id", targetUser.id)
      .maybeSingle();

    const now = new Date();
    let baseDate = now;
    
    // If user has active time remaining, extend from that date
    if (profile?.trial_ends_at) {
      const currentEnd = new Date(profile.trial_ends_at);
      if (currentEnd > now) baseDate = currentEnd;
    }

    const newEnd = new Date(baseDate);
    newEnd.setMonth(newEnd.getMonth() + Number(months));

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        is_premium: true,
        trial_ends_at: newEnd.toISOString(),
      })
      .eq("user_id", targetUser.id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Premium activado para ${user_email} hasta ${newEnd.toLocaleDateString("es-PE")}`,
        premium_until: newEnd.toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("activate-premium error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
