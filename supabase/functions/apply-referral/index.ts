import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new Error("Not authenticated");

    const { referral_code } = await req.json();
    if (!referral_code) throw new Error("No referral code provided");

    // Find the referrer by code
    const { data: referrer, error: refErr } = await supabaseAdmin
      .from("profiles")
      .select("user_id, trial_ends_at")
      .eq("referral_code", referral_code.toUpperCase())
      .maybeSingle();

    if (refErr || !referrer) {
      return new Response(JSON.stringify({ error: "Código de referido no válido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Can't refer yourself
    if (referrer.user_id === user.id) {
      return new Response(JSON.stringify({ error: "No puedes usar tu propio código" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if this user was already referred
    const { data: existing } = await supabaseAdmin
      .from("referrals")
      .select("id")
      .eq("referred_id", user.id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: "Ya usaste un código de referido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert referral record
    const { error: insertErr } = await supabaseAdmin
      .from("referrals")
      .insert({ referrer_id: referrer.user_id, referred_id: user.id });

    if (insertErr) throw insertErr;

    // Add 7 days to referrer's trial_ends_at
    const currentEnd = referrer.trial_ends_at ? new Date(referrer.trial_ends_at) : new Date();
    const newEnd = new Date(Math.max(currentEnd.getTime(), Date.now()));
    newEnd.setDate(newEnd.getDate() + 7);

    await supabaseAdmin
      .from("profiles")
      .update({ trial_ends_at: newEnd.toISOString() })
      .eq("user_id", referrer.user_id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
