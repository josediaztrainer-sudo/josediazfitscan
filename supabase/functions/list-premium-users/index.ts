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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate caller is admin
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Acceso denegado - solo administradores" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, is_premium, trial_ends_at, created_at")
      .order("created_at", { ascending: false });

    if (profilesError) throw profilesError;

    // Get all auth users to map emails
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw authError;

    const emailMap = new Map<string, string>();
    for (const u of authData.users) {
      if (u.email) emailMap.set(u.id, u.email);
    }

    const now = new Date();
    const users = (profiles || []).map((p) => {
      const trialEnd = p.trial_ends_at ? new Date(p.trial_ends_at) : null;
      let status = "free";
      if (p.is_premium && trialEnd && trialEnd > now) {
        status = "premium";
      } else if (p.is_premium && trialEnd && trialEnd <= now) {
        status = "expired";
      } else if (!p.is_premium && trialEnd && trialEnd > now) {
        status = "trial";
      } else if (!p.is_premium && trialEnd && trialEnd <= now) {
        status = "expired";
      }

      return {
        user_id: p.user_id,
        email: emailMap.get(p.user_id) || "—",
        is_premium: p.is_premium,
        trial_ends_at: p.trial_ends_at,
        status,
        created_at: p.created_at,
      };
    });

    return new Response(JSON.stringify({ users }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("list-premium-users error:", e);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
