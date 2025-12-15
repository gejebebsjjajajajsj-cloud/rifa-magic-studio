import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getSyncPaymentsToken(clientId: string, clientSecret: string): Promise<string> {
  console.log("Authenticating with SyncPayments...");
  const authResponse = await fetch("https://api.syncpayments.com.br/api/partner/v1/auth-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
  });

  if (!authResponse.ok) {
    const errorText = await authResponse.text();
    console.error("SyncPayments auth error:", errorText);
    throw new Error(`SyncPayments authentication failed: ${authResponse.status}`);
  }

  const authData = await authResponse.json();
  return authData.access_token;
}

async function createSyncPayment(accessToken: string, amount: number, description: string, purchaseId: string, supabaseUrl: string, buyerName: string, buyerEmail: string) {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 2);
  const expirationDateStr = expirationDate.toISOString().slice(0, 10); // YYYY-MM-DD

  // SyncPayments requires amount in cents (integer)
  const amountInCents = Math.round(amount * 100);

  const paymentBody = {
    ip: "127.0.0.1",
    // SyncPayments espera um número de dias, não uma data string
    pix: { expiresInDays: 2 },
    items: [
      {
        title: description,
        quantity: 1,
        tangible: false,
        unitPrice: amountInCents,
      },
    ],
    amount: amountInCents,
    customer: {
      cpf: "00000000000",
      name: buyerName || "Cliente",
      email: buyerEmail || "cliente@email.com",
      phone: "00000000000",
      externalRef: purchaseId,
      address: {
        city: "São Paulo",
        state: "SP",
        street: "Rua Principal",
        country: "BR",
        zipCode: "00000000",
        complement: "",
        neighborhood: "Centro",
        streetNumber: "1",
      },
    },
    metadata: {
      provider: "RifaMania",
      sell_url: supabaseUrl,
      order_url: `${supabaseUrl}/functions/v1/payment-webhook`,
      user_email: buyerEmail || "cliente@exemplo.com",
      user_identitication_number: "00000000000",
    },
    traceable: true,
    postbackUrl: `${supabaseUrl}/functions/v1/payment-webhook`,
  };

  console.log("SyncPayments request body:", JSON.stringify(paymentBody));
  console.log("Creating SyncPayments payment...");
  const response = await fetch("https://api.syncpayments.com.br/v1/gateway/api", {
    method: "POST",
    headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(paymentBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("SyncPayments payment error:", errorText);
    throw new Error(`SyncPayments payment creation failed: ${response.status}`);
  }

  return await response.json();
}

async function createMercadoPagoPayment(accessToken: string, amount: number, description: string, purchaseId: string) {
  console.log("Creating Mercado Pago PIX payment...");
  
  const paymentBody = {
    transaction_amount: amount,
    description: description,
    payment_method_id: "pix",
    payer: {
      email: "cliente@email.com",
      first_name: "Cliente",
      last_name: "Rifa",
      identification: { type: "CPF", number: "00000000000" },
    },
    external_reference: purchaseId,
  };

  const response = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": purchaseId,
    },
    body: JSON.stringify(paymentBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Mercado Pago payment error:", errorText);
    throw new Error(`Mercado Pago payment creation failed: ${response.status}`);
  }

  return await response.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { purchase_id } = await req.json();

    if (!purchase_id) {
      return new Response(
        JSON.stringify({ error: "purchase_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get purchase details
    const { data: purchase, error: purchaseError } = await supabase
      .from("raffle_purchases")
      .select("*, raffles(*)")
      .eq("id", purchase_id)
      .single();

    if (purchaseError || !purchase) {
      console.error("Purchase not found:", purchaseError);
      return new Response(
        JSON.stringify({ error: "Purchase not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const raffle = purchase.raffles;
    if (!raffle) {
      return new Response(
        JSON.stringify({ error: "Raffle not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get raffle owner's payment credentials
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("syncpayments_client_id, syncpayments_client_secret, mercado_pago_access_token")
      .eq("user_id", raffle.user_id)
      .single();

    const hasSyncPayments = ownerProfile?.syncpayments_client_id && ownerProfile?.syncpayments_client_secret;
    const hasMercadoPago = !!ownerProfile?.mercado_pago_access_token;

    if (!hasSyncPayments && !hasMercadoPago) {
      return new Response(
        JSON.stringify({ error: "Nenhum meio de pagamento configurado pelo organizador" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const amount = Number(purchase.total_amount);
    const description = `Rifa: ${raffle.name} - ${purchase.quantity} números`;
    let paymentResult: any;
    let gateway = "";

    // Try SyncPayments first, then Mercado Pago
    if (hasSyncPayments) {
      try {
        gateway = "syncpayments";
        const accessToken = await getSyncPaymentsToken(
          ownerProfile.syncpayments_client_id,
          ownerProfile.syncpayments_client_secret
        );
        paymentResult = await createSyncPayment(
          accessToken,
          amount,
          description,
          purchase_id,
          supabaseUrl,
          purchase.buyer_name,
          purchase.buyer_email
        );

        console.log("Raw SyncPayments response:", JSON.stringify(paymentResult));

        // Algumas contas retornam os dados aninhados em `data`
        const syncData = (paymentResult as any).data || paymentResult;

        const idTransaction =
          (syncData as any).idTransaction ||
          (syncData as any).idtransaction;
        const paymentCode = (syncData as any).paymentCode;
        const paymentCodeBase64 = (syncData as any).paymentCodeBase64;

        if (!idTransaction || !paymentCode) {
          console.error("SyncPayments response missing payment fields", syncData);
          throw new Error("Resposta inválida do provedor de pagamento");
        }
        
        // Save transaction
        await supabase.from("payment_transactions").insert({
          raffle_id: raffle.id,
          transaction_id: idTransaction,
          amount: amount,
          status: "pending",
          payment_type: "raffle_purchase",
          pix_code: paymentCode,
        });

        return new Response(
          JSON.stringify({
            success: true,
            gateway: "syncpayments",
            payment: {
              id: idTransaction,
              pix_code: paymentCode,
              qr_code: paymentCodeBase64
                ? `data:image/png;base64,${paymentCodeBase64}`
                : null,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error) {
        console.error("SyncPayments failed, trying Mercado Pago:", error);
        if (!hasMercadoPago) throw error;
      }
    }

    if (hasMercadoPago) {
      gateway = "mercadopago";
      paymentResult = await createMercadoPagoPayment(
        ownerProfile.mercado_pago_access_token,
        amount,
        description,
        purchase_id
      );

      console.log("Raw Mercado Pago response:", JSON.stringify(paymentResult));

      const transactionData = paymentResult.point_of_interaction?.transaction_data;
      const pixCode = transactionData?.qr_code || "";
      const qrCodeBase64 = transactionData?.qr_code_base64 || "";

      console.log("Mercado Pago PIX code:", pixCode ? "present" : "missing");
      console.log("Mercado Pago QR base64:", qrCodeBase64 ? "present" : "missing");

      // Save transaction
      await supabase.from("payment_transactions").insert({
        raffle_id: raffle.id,
        transaction_id: String(paymentResult.id),
        amount: amount,
        status: "pending",
        payment_type: "raffle_purchase",
        pix_code: pixCode,
      });

      return new Response(
        JSON.stringify({
          success: true,
          gateway: "mercadopago",
          payment: {
            id: String(paymentResult.id),
            pix_code: pixCode,
            qr_code: qrCodeBase64 ? `data:image/png;base64,${qrCodeBase64}` : null,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("No payment gateway available");
  } catch (error: unknown) {
    console.error("Error creating raffle payment:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
