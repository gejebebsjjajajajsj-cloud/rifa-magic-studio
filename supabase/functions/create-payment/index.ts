import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { raffle_id, amount, description } = await req.json();

    if (!raffle_id || !amount) {
      return new Response(
        JSON.stringify({ error: "raffle_id and amount are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the raffle to find the user
    const { data: raffle, error: raffleError } = await supabase
      .from("raffles")
      .select("user_id, name")
      .eq("id", raffle_id)
      .single();

    if (raffleError || !raffle) {
      return new Response(
        JSON.stringify({ error: "Raffle not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's Mercado Pago token from profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("mercado_pago_access_token")
      .eq("user_id", raffle.user_id)
      .single();

    // For platform fee, we use a platform token (in production, this would be the platform's MP account)
    // For now, we'll generate a mock Pix code since this is the publication fee
    // In production, you'd use the platform's Mercado Pago credentials here
    
    const pixCode = `00020126580014br.gov.bcb.pix0136${crypto.randomUUID()}5204000053039865802BR5925RIFAMANIA LTDA6009SAO PAULO62070503***6304`;
    
    // Generate a fake QR code URL (in production, use Mercado Pago API)
    const qrCodeBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    return new Response(
      JSON.stringify({
        success: true,
        payment: {
          id: crypto.randomUUID(),
          status: "pending",
          amount: amount,
          pix_code: pixCode,
          qr_code: qrCodeBase64,
          description: description || `Taxa de publicação - ${raffle.name}`,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating payment:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
