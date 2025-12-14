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
    const { raffle_id } = await req.json();

    if (!raffle_id) {
      return new Response(
        JSON.stringify({ error: "raffle_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if payment was actually confirmed
    const { data: transaction, error: txError } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("raffle_id", raffle_id)
      .eq("payment_type", "publication_fee")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (txError) {
      console.error("Error checking transaction:", txError);
      return new Response(
        JSON.stringify({ error: "Failed to check payment status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If no transaction exists or payment not confirmed
    if (!transaction) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No payment found",
          status: "no_payment"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (transaction.status === "confirmed") {
      // Payment already confirmed, publish the raffle
      const { data, error } = await supabase
        .from("raffles")
        .update({ status: "published" })
        .eq("id", raffle_id)
        .select()
        .single();

      if (error) {
        console.error("Error updating raffle:", error);
        return new Response(
          JSON.stringify({ error: "Failed to publish raffle" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: "confirmed",
          raffle: data,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Payment still pending or failed
    return new Response(
      JSON.stringify({
        success: false,
        status: transaction.status,
        message: transaction.status === "pending" 
          ? "Pagamento ainda não confirmado. Aguarde alguns instantes."
          : "Pagamento não foi aprovado.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error confirming payment:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
