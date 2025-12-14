import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get("SYNCPAYMENTS_CLIENT_ID");
  const clientSecret = Deno.env.get("SYNCPAYMENTS_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("SyncPayments credentials not configured");
  }

  console.log("Authenticating with SyncPayments...");

  const authResponse = await fetch("https://api.syncpayments.com.br/api/partner/v1/auth-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!authResponse.ok) {
    const errorText = await authResponse.text();
    console.error("Auth error:", errorText);
    throw new Error(`Authentication failed: ${authResponse.status}`);
  }

  const authData = await authResponse.json();
  console.log("Authentication successful, token expires at:", authData.expires_at);
  
  return authData.access_token;
}

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
      console.error("Raffle error:", raffleError);
      return new Response(
        JSON.stringify({ error: "Raffle not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile for customer info
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("user_id", raffle.user_id)
      .single();

    // Get access token from SyncPayments
    const accessToken = await getAccessToken();

    // Calculate expiration date (2 days from now)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 2);
    const expiresInDays = expirationDate.toISOString().split('T')[0];

    // Create payment request
    const paymentBody = {
      ip: "127.0.0.1",
      pix: {
        expiresInDays: expiresInDays,
      },
      items: [
        {
          title: description || `Taxa de publicação - ${raffle.name}`,
          quantity: 1,
          tangible: false,
          unitPrice: amount,
        },
      ],
      amount: amount,
      customer: {
        cpf: "00000000000",
        name: profile?.name || "Cliente",
        email: profile?.email || "cliente@email.com",
        phone: "00000000000",
        externaRef: raffle_id,
        address: {
          city: "São Paulo",
          state: "SP",
          street: "Rua Principal",
          country: "BR",
          zipCode: "00000-000",
          complement: "",
          neighborhood: "Centro",
          streetNumber: "1",
        },
      },
      metadata: {
        provider: "RifaMania",
        raffle_id: raffle_id,
        raffle_name: raffle.name,
      },
      traceable: true,
      postbackUrl: `${supabaseUrl}/functions/v1/payment-webhook`,
    };

    console.log("Creating payment with SyncPayments...");

    const paymentResponse = await fetch("https://api.syncpayments.com.br/v1/gateway/api", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentBody),
    });

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      console.error("Payment creation error:", errorText);
      throw new Error(`Payment creation failed: ${paymentResponse.status}`);
    }

    const paymentData = await paymentResponse.json();
    console.log("Payment created successfully:", paymentData.idTransaction);

    // Generate QR code image from base64
    const qrCodeBase64 = paymentData.paymentCodeBase64 
      ? `data:image/png;base64,${paymentData.paymentCodeBase64}`
      : null;

    return new Response(
      JSON.stringify({
        success: true,
        payment: {
          id: paymentData.idTransaction,
          status: paymentData.status_transaction,
          amount: amount,
          pix_code: paymentData.paymentCode,
          qr_code: qrCodeBase64,
          description: description || `Taxa de publicação - ${raffle.name}`,
          expires_at: expirationDate.toISOString(),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error creating payment:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
