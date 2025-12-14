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
    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // SyncPayments sends: idTransaction, status_transaction, metadata
    const transactionId = body.idTransaction || body.id || body.transaction_id;
    const status = body.status_transaction || body.status;
    const metadata = body.metadata || {};

    if (!transactionId) {
      console.error("No transaction ID in webhook");
      return new Response(
        JSON.stringify({ error: "No transaction ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing transaction ${transactionId} with status: ${status}`);

    // Find the transaction in our database
    const { data: transaction, error: txError } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("transaction_id", transactionId)
      .maybeSingle();

    if (txError) {
      console.error("Error finding transaction:", txError);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!transaction) {
      console.log("Transaction not found in database, may be from different source");
      return new Response(
        JSON.stringify({ message: "Transaction not found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map SyncPayments status to our status
    let newStatus = "pending";
    const upperStatus = (status || "").toUpperCase();
    
    if (upperStatus === "APPROVED" || upperStatus === "PAID" || upperStatus === "CONFIRMED") {
      newStatus = "confirmed";
    } else if (upperStatus === "REJECTED" || upperStatus === "FAILED" || upperStatus === "CANCELLED") {
      newStatus = "failed";
    } else if (upperStatus === "PENDING" || upperStatus === "WAITING") {
      newStatus = "pending";
    }

    console.log(`Updating transaction ${transactionId} to status: ${newStatus}`);

    // Update transaction status
    const { error: updateTxError } = await supabase
      .from("payment_transactions")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", transaction.id);

    if (updateTxError) {
      console.error("Error updating transaction:", updateTxError);
    }

    // If payment confirmed and it's a publication fee, publish the raffle
    if (newStatus === "confirmed" && transaction.payment_type === "publication_fee") {
      console.log(`Publishing raffle ${transaction.raffle_id}`);
      
      const { error: raffleError } = await supabase
        .from("raffles")
        .update({ status: "published" })
        .eq("id", transaction.raffle_id);

      if (raffleError) {
        console.error("Error publishing raffle:", raffleError);
      } else {
        console.log(`Raffle ${transaction.raffle_id} published successfully!`);
      }
    }

    // If payment confirmed and it's a raffle purchase, update purchase status
    if (newStatus === "confirmed" && transaction.payment_type === "raffle_purchase") {
      console.log(`Confirming raffle purchase for raffle ${transaction.raffle_id}`);
      
      // Find the purchase by matching the transaction metadata
      const { data: purchases, error: purchasesError } = await supabase
        .from("raffle_purchases")
        .select("*")
        .eq("raffle_id", transaction.raffle_id)
        .eq("payment_status", "pending")
        .order("created_at", { ascending: false })
        .limit(1);

      if (purchasesError) {
        console.error("Error finding purchase:", purchasesError);
      } else if (purchases && purchases.length > 0) {
        const purchase = purchases[0];
        
        const { error: updatePurchaseError } = await supabase
          .from("raffle_purchases")
          .update({ payment_status: "confirmed", updated_at: new Date().toISOString() })
          .eq("id", purchase.id);

        if (updatePurchaseError) {
          console.error("Error updating purchase:", updatePurchaseError);
        } else {
          console.log(`Purchase ${purchase.id} confirmed! Numbers: ${purchase.numbers_purchased}`);
          
          // Update raffle stats
          const { error: raffleUpdateError } = await supabase
            .from("raffles")
            .update({ 
              numbers_sold: purchase.quantity,
              total_earned: purchase.total_amount,
            })
            .eq("id", transaction.raffle_id);

          if (raffleUpdateError) {
            console.error("Error updating raffle stats:", raffleUpdateError);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, status: newStatus }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
