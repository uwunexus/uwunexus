import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.stripsecretekey as string, {
  apiVersion: "2024-06-20" as any,
});

export async function POST(req: Request) {
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event;

  try {
    // If STRIPE_WEBHOOK_SECRET is not set (e.g. local dev without CLI), 
    // we bypass signature verification but this is unsafe for production.
    if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
      event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      event = JSON.parse(payload);
    }
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const order_id = session.client_reference_id;
    const payment_id = session.payment_intent as string;

    if (order_id) {
      try {
        // Ping internal PHP API to update database securely
        await fetch("http://localhost:8000/update_stripe_order.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.stripsecretekey}` // simple internal auth
          },
          body: JSON.stringify({
            order_id,
            status: "success",
            payment_id
          })
        });
      } catch (err) {
        console.error("Failed to update PHP backend:", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
