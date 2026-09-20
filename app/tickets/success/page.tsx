import Image from "next/image";
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
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api/backend'}/update_stripe_order.php`, {
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
            <h1 className="text-3xl font-bold mb-2 text-[#000c66]">Payment Successful!</h1>
            <p className="text-muted mb-6">
              Your ticket order ({order_id}) has been confirmed. A receipt will be sent to your email.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '1rem', border: '1.5px dashed #cbd5e1' }}>
              <div style={{ width: '150px', height: '150px', backgroundColor: '#ffffff', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(order_id as string)}`} 
                  alt="Ticket QR Code" 
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Entry Ticket</p>
            </div>

            <div className="flex flex-col gap-3">
              <a 
                href={`/tickets/print/${order_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary w-full justify-center text-center"
              >
                Download Ticket
              </a>
              <Link href="/tickets" className="btn btn-secondary w-full justify-center">
                View My Tickets
              </Link>
            </div>
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
