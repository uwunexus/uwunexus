import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.stripsecretekey || "dummy_key", {
    apiVersion: "2024-06-20" as any,
  });

  // Derive base URL from the incoming request — always correct on any domain
  const host = req.headers.get("host") || "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  try {
    const body = await req.json();
    const { order_id, title, price, quantity = 1, customer_email } = body;

    if (!order_id || !title || !price) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Stripe requires price in cents
    const unitAmount = Math.round(price * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: customer_email || undefined,
      client_reference_id: order_id, // We use this to identify the order in the webhook
      line_items: [
        {
          price_data: {
            currency: "lkr",
            product_data: {
              name: title,
            },
            unit_amount: unitAmount,
          },
          quantity: quantity,
        },
      ],
      success_url: `${baseUrl}/tickets/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order_id}`,
      cancel_url: `${baseUrl}/tickets?canceled=true`,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error("Stripe Session Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
