"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Ticket, MapPin, Calendar, Clock, X, AlertCircle } from "lucide-react";

// Initialize Stripe. Replace with standard NEXT_PUBLIC_ publishable key logic if we had one.
// The user put it in .env.local as strippublishablekey.
// Next.js needs NEXT_PUBLIC_ for client side, so we fetch it from an API or just pass it here.
// But wait, we can't easily access non-NEXT_PUBLIC_ env vars here.
// Let's create a wrapper or just use the session ID to redirect without loadStripe.
// Actually, Stripe recommends: `window.location.href = session.url`! That's much simpler.

interface TicketedEvent {
  id: number;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  venue: string;
  price: number;
  total_tickets: number;
  available_tickets: number;
  image_url: string;
  status: string;
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}
function formatTime(t: string) {
  const [h, m] = t.split(":");
  const date = new Date(); date.setHours(+h, +m);
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default function TicketsPage() {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<TicketedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Checkout Modal State
  const [selectedEvent, setSelectedEvent] = useState<TicketedEvent | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(searchParams.get("canceled") ? "Payment was canceled." : "");

  // Pre-fill user data if logged in
  useEffect(() => {
    fetch("http://localhost:8000/get_ticketed_events.php")
      .then(r => r.json())
      .then(d => {
        if (d.success) setEvents(d.events);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    setError("");
    setProcessing(true);

    try {
      // 1. Create Order in PHP Backend
      const parseCookie = (name: string) => document.cookie.split("; ").find(r => r.startsWith(name + "="))?.split("=")[1];
      const userId = parseCookie("uwu_user_id");

      const phpRes = await fetch("http://localhost:8000/create_stripe_order.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_event_id: selectedEvent.id,
          user_id: userId || null,
          amount: selectedEvent.price,
          currency: "LKR",
          customer_name: `${form.firstName} ${form.lastName}`,
          customer_email: form.email,
          customer_phone: form.phone
        })
      });

      const phpData = await phpRes.json();
      if (!phpData.success) throw new Error(phpData.message || "Failed to create order");

      // 2. Create Stripe Checkout Session
      const stripeRes = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: phpData.order_id,
          title: selectedEvent.title,
          price: selectedEvent.price,
          customer_email: form.email
        })
      });

      const stripeData = await stripeRes.json();
      if (stripeData.error) throw new Error(stripeData.error);

      // 3. Redirect to Stripe Checkout URL
      window.location.href = stripeData.url;

    } catch (err: any) {
      setError(err.message || "An error occurred during checkout initialization.");
      setProcessing(false);
    }
  };

  const closeCheckout = () => {
    setSelectedEvent(null);
    setError("");
  };

  return (
    <div className="container py-8 relative min-h-screen">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Event Tickets</h1>
        <p className="text-muted max-w-2xl mx-auto">
          Securely purchase your tickets online for premium campus events via Stripe.
        </p>
      </div>

      {error && !selectedEvent && (
        <div className="card mb-8 p-4 text-center" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertCircle className="mx-auto mb-2" size={24} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20 text-muted">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="card text-center py-20 text-muted max-w-2xl mx-auto">
          <Ticket size={48} className="mx-auto mb-4 opacity-30" />
          <h2 className="text-xl font-semibold mb-2 text-foreground">No Upcoming Events</h2>
          <p>There are currently no active ticketed events available. Please check back later!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => (
            <div key={event.id} className="card p-0 overflow-hidden flex flex-col" style={{ padding: 0 }}>
              {/* Image */}
              <div style={{ height: '200px', width: '100%', position: 'relative', backgroundColor: 'var(--background)' }}>
                {event.image_url ? (
                  <Image src={event.image_url} alt={event.title} fill sizes="(max-width: 768px) 100vw, 33vw" style={{ objectFit: "cover" }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)" }} />
                )}
              </div>
              
              <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold leading-tight pr-4">{event.title}</h2>
                  <span className="badge badge-primary text-lg font-bold" style={{ backgroundColor: 'var(--primary)', color: 'white', flexShrink: 0 }}>
                    LKR {event.price}
                  </span>
                </div>

                <div className="flex flex-col gap-3 text-muted text-sm mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>{formatDate(event.event_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>{formatTime(event.event_time)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    <span>{event.venue}</span>
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="flex justify-between items-center mb-4 text-sm font-semibold">
                    <span className="text-muted">Tickets left:</span>
                    <span className={event.available_tickets < 50 ? "text-warning" : "text-success"}>
                      {event.available_tickets} / {event.total_tickets}
                    </span>
                  </div>
                  <button 
                    onClick={() => { setSelectedEvent(event); setProcessing(false); setError(""); }} 
                    disabled={event.available_tickets <= 0}
                    className="btn btn-primary w-full" style={{ width: '100%', justifyContent: 'center', opacity: event.available_tickets <= 0 ? 0.5 : 1 }}>
                    <Ticket size={18} />
                    {event.available_tickets <= 0 ? "Sold Out" : "Book Now"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Checkout Modal */}
      {selectedEvent && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={closeCheckout}>
          <div className="card" style={{ maxWidth: "500px", width: "100%" }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Checkout details</h2>
              <button onClick={closeCheckout} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}><X size={22} /></button>
            </div>

            <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: "var(--secondary)" }}>
              <h3 className="font-bold mb-1">{selectedEvent.title}</h3>
              <div className="flex justify-between text-sm">
                <span className="text-muted">1 × Ticket</span>
                <span className="font-bold">LKR {selectedEvent.price}</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg text-sm flex gap-2 items-center" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleCheckout}>
              <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div className="form-group">
                  <label className="form-label text-sm">First Name *</label>
                  <input type="text" className="form-input" required value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label text-sm">Last Name *</label>
                  <input type="text" className="form-input" required value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
                </div>
              </div>

              <div className="form-group mb-4">
                <label className="form-label text-sm">Email Address *</label>
                <input type="email" className="form-input" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>

              <div className="form-group mb-6">
                <label className="form-label text-sm">Phone Number *</label>
                <input type="tel" className="form-input" placeholder="e.g. 0771234567" required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>

              <button type="submit" disabled={processing} className="btn btn-primary w-full justify-center text-lg" style={{ padding: "0.75rem", opacity: processing ? 0.7 : 1 }}>
                {processing ? "Connecting to Stripe..." : `Pay LKR ${selectedEvent.price}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
