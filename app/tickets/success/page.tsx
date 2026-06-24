import { redirect } from "next/navigation";
import Stripe from "stripe";
import Link from "next/link";
import { CheckCircle, AlertCircle } from "lucide-react";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const params = await searchParams;
  const session_id = params.session_id;
  const order_id = params.order_id;

  if (!session_id || !order_id) {
    redirect("/tickets");
  }

  let success = false;
  let message = "";

  try {
    const stripe = new Stripe(process.env.stripsecretekey as string, { apiVersion: "2024-06-20" as any });
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === "paid") {
      success = true;

      // Synchronous update fallback (in case webhook was missed locally)
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/update_stripe_order.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.stripsecretekey}`
        },
        body: JSON.stringify({
          order_id,
          status: "success",
          payment_id: session.payment_intent
        })
      });

    } else {
      message = "Payment was not successful.";
    }
  } catch (err: any) {
    message = "An error occurred verifying your payment.";
  }

  return (
    <div className="container py-20 flex justify-center items-center min-h-[60vh]">
      <div className="card text-center max-w-md w-full p-8">
        {success ? (
          <>
            <div className="mx-auto flex justify-center items-center mb-6" style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "rgba(34,197,94,0.1)", color: "var(--success)" }}>
              <CheckCircle size={40} />
            </div>
            <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
            <p className="text-muted mb-8">
              Your ticket order ({order_id}) has been confirmed. A receipt will be sent to your email.
            </p>
            <Link href="/tickets" className="btn btn-primary w-full justify-center">
              View More Events
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto flex justify-center items-center mb-6" style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "rgba(239,68,68,0.1)", color: "var(--danger)" }}>
              <AlertCircle size={40} />
            </div>
            <h1 className="text-3xl font-bold mb-4">Verification Failed</h1>
            <p className="text-muted mb-8">
              {message}
            </p>
            <Link href="/tickets" className="btn btn-secondary w-full justify-center">
              Return to Tickets
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
