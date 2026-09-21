"use client";
import Image from "next/image";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Ticket, MapPin, Calendar, Clock, X, AlertCircle, Minus, Plus, QrCode } from "lucide-react";

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

function formatDate(dateStr: string) {
  const dateObj = new Date(dateStr + "T00:00:00");
  return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(":");
  const date = new Date();
  date.setHours(parseInt(h), parseInt(m));

  let hours = date.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
}

export default function TicketsPage() {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<TicketedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // My Tickets State
  const [activeTab, setActiveTab] = useState<"buy" | "my-tickets">("buy");
  const [myPurchases, setMyPurchases] = useState<any[]>([]);
  const [myPurchasesLoading, setMyPurchasesLoading] = useState(false);

  // Checkout Modal State
  const [selectedEvent, setSelectedEvent] = useState<TicketedEvent | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(searchParams.get("canceled") ? "Payment was canceled." : "");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/get_ticketed_events.php`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setEvents(d.events);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === "my-tickets") {
      const parseCookie = (name: string) => document.cookie.split("; ").find(r => r.startsWith(name + "="))?.split("=")[1];
      const userId = parseCookie("uwu_user_id");
      if (!userId) return;

      setMyPurchasesLoading(true);
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/get_ticket_purchases.php?user_id=${userId}&my_tickets=true`)
        .then(r => r.json())
        .then(d => {
          if (d.success) setMyPurchases(d.purchases);
        })
        .catch(console.error)
        .finally(() => setMyPurchasesLoading(false));
    }
  }, [activeTab]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    setError("");

    if (!/^[0-9]{10}$/.test(form.phone)) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }

    setProcessing(true);

    try {
      const parseCookie = (name: string) => document.cookie.split("; ").find(r => r.startsWith(name + "="))?.split("=")[1];
      const userId = parseCookie("uwu_user_id");

      const phpRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/create_stripe_order.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_event_id: selectedEvent.id,
          user_id: userId || null,
          amount: selectedEvent.price * quantity,
          currency: "LKR",
          customer_name: `${form.firstName} ${form.lastName}`,
          customer_email: form.email,
          customer_phone: form.phone
        })
      });

      const phpData = await phpRes.json();
      if (!phpData.success) throw new Error(phpData.message || "Failed to create order");

      const stripeRes = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: phpData.order_id,
          title: selectedEvent.title,
          price: selectedEvent.price,
          quantity: quantity,
          customer_email: form.email
        })
      });

      const stripeData = await stripeRes.json();
      if (stripeData.error) throw new Error(stripeData.error);

      window.location.href = stripeData.url;

    } catch (err: any) {
      setError(err.message || "An error occurred during checkout initialization.");
      setProcessing(false);
    }
  };

  const closeCheckout = () => {
    setSelectedEvent(null);
    setError("");
    setQuantity(1);
  };

  return (
    <div className="container events-container" style={{ maxWidth: '1210px', marginTop: '1.5rem' }}>
      {/* Header */}
      <div className="tickets-page-header events-header mb-4 text-center" style={{ marginTop: '0' }}>
        <h1 className="tickets-page-title" style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '3rem', color: '#000000', letterSpacing: '0.02em', marginBottom: '0.5rem' }}>
          Event Tickets
        </h1>
        <p className="tickets-page-subtitle" style={{ fontFamily: 'var(--font-audiowide), sans-serif', fontSize: '1.25rem', color: '#0d0e4aff', fontWeight: 400, letterSpacing: '0.05em', textTransform: 'lowercase' }}>
          securely purchase your tickets online
        </p>
        <hr className="tickets-page-hr" style={{ border: 'none', borderTop: '1.5px solid #cbd5e1', marginTop: '1.5rem', marginBottom: '1.5rem', width: '100%' }} />
        
        {/* View Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <div className="flex bg-white rounded-full border border-slate-200 p-1" style={{ height: "48px" }}>
            <button
              onClick={() => setActiveTab("buy")}
              style={{
                padding: "0 1.5rem",
                borderRadius: "9999px",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                backgroundColor: activeTab === "buy" ? "#000c66" : "transparent",
                color: activeTab === "buy" ? "white" : "#64748b",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-syne), sans-serif",
                fontSize: "0.95rem",
                fontWeight: 700,
                transition: "all 0.2s"
              }}
            >
              <Ticket size={18} />
              <span style={{ fontSize: "0.95rem", fontWeight: 600, fontFamily: "var(--font-syne), sans-serif" }}>Buy Tickets</span>
            </button>
            <button
              onClick={() => setActiveTab("my-tickets")}
              style={{
                padding: "0 1.5rem",
                borderRadius: "9999px",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                backgroundColor: activeTab === "my-tickets" ? "#000c66" : "transparent",
                color: activeTab === "my-tickets" ? "white" : "#64748b",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-syne), sans-serif",
                fontSize: "0.95rem",
                fontWeight: 700,
                transition: "all 0.2s"
              }}
            >
              <QrCode size={18} />
              <span style={{ fontSize: "0.95rem", fontWeight: 600, fontFamily: "var(--font-syne), sans-serif" }}>My Tickets</span>
            </button>
          </div>
        </div>
      </div>

      {error && !selectedEvent && activeTab === "buy" && (
        <div style={{ marginBottom: "2rem", padding: "1rem", borderRadius: "1rem", backgroundColor: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <AlertCircle className="mb-2" size={24} />
          {error}
        </div>
      )}

      {/* Buy Tickets Tab */}
      {activeTab === "buy" && (
        <>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "5rem 0", color: "#64748b", fontFamily: "var(--font-syne), sans-serif", fontWeight: 700 }}>Loading events...</div>
          ) : events.length === 0 ? (
            <div className="no-events-container" style={{ textAlign: "center", padding: "5rem 0", color: "#64748b", maxWidth: "600px", margin: "0 auto", fontFamily: "var(--font-syne), sans-serif" }}>
              <Ticket size={64} style={{ margin: "0 auto 1.5rem", opacity: 0.3 }} />
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#000c66", marginBottom: "0.5rem" }}>No Ticketed Events</h2>
              <p style={{ fontFamily: "var(--font-roboto), sans-serif" }}>There are currently no events selling tickets online. Please check back later!</p>
            </div>
          ) : (
        <div className="grid gap-8 tickets-events-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))" }}>
          {events.map((event) => {
            return (
              <div key={event.id} className="event-card" style={{ cursor: "pointer" }} onClick={() => { setSelectedEvent(event); setProcessing(false); setError(""); }}>
                {/* Image wrapper matching the visual layout */}
                <div className="event-card-image-wrapper">
                  {event.image_url ? (
                    <Image src={event.image_url} alt={event.title} className="event-card-img" fill style={{ objectFit: 'cover' }} unoptimized />
                  ) : (
                    <div className="event-card-no-img" style={{ background: "linear-gradient(135deg, #000c6622, #000c6611)" }}>
                      <Ticket size={40} style={{ color: "#000c66", opacity: 0.4 }} />
                    </div>
                  )}
                </div>

                {/* Content Stack */}
                <div className="event-card-content">
                  <h3 className="event-card-title">{event.title}</h3>

                  <div className="event-card-info-stack">
                    <div className="event-card-info-row">
                      <Calendar size={20} style={{ color: '#000000', flexShrink: 0, marginTop: "2px" }} />
                      <span>{formatDate(event.event_date)}</span>
                    </div>
                    <div className="event-card-info-row">
                      <Clock size={20} style={{ color: '#000000', flexShrink: 0, marginTop: "2px" }} />
                      <span>{formatTime(event.event_time)}</span>
                    </div>
                    <div className="event-card-info-row">
                      <MapPin size={20} style={{ color: '#000000', flexShrink: 0, marginTop: "2px" }} />
                      <span>{event.venue}</span>
                    </div>
                  </div>

                  {/* Tickets Left Row */}
                  <div className="event-card-tickets-left-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", fontFamily: "var(--font-syne), sans-serif", fontSize: "1rem", color: "#000000", fontWeight: 500 }}>
                    <span style={{ opacity: 0.8 }}>Tickets left:</span>
                    <span style={{ fontWeight: 800 }}>
                      {event.available_tickets} / {event.total_tickets}
                    </span>
                  </div>

                  {/* Book Now Button */}
                  <button
                    onClick={() => { setSelectedEvent(event); setProcessing(false); setError(""); }}
                    disabled={event.available_tickets <= 0}
                    className="event-card-btn"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      opacity: event.available_tickets <= 0 ? 0.5 : 1
                    }}
                  >
                    <Ticket size={18} />
                    <span>{event.available_tickets <= 0 ? "Sold Out" : "Book Now"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
          )}
        </>
      )}

      {/* My Tickets Tab */}
      {activeTab === "my-tickets" && (
        <div style={{ marginBottom: '4rem' }}>
          {myPurchasesLoading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "5rem 0", color: "#64748b", fontFamily: "var(--font-syne), sans-serif", fontWeight: 700 }}>Loading your tickets...</div>
          ) : myPurchases.length === 0 ? (
            <div className="no-events-container" style={{ textAlign: "center", padding: "5rem 0", color: "#64748b", maxWidth: "600px", margin: "0 auto", fontFamily: "var(--font-syne), sans-serif", backgroundColor: "#ffffff", borderRadius: "1.5rem", border: "1.5px solid #e2e8f0" }}>
              <Ticket size={64} style={{ margin: "0 auto 1.5rem", opacity: 0.3 }} />
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#000c66", marginBottom: "0.5rem" }}>No Tickets Found</h2>
              <p style={{ fontFamily: "var(--font-roboto), sans-serif" }}>You haven't purchased any tickets yet. Switch to the Buy Tickets tab to explore events!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
              {myPurchases.map((purchase) => (
                <div key={purchase.id} style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '1.5rem',
                  border: '1.5px solid rgba(0, 12, 102, 0.1)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}>
                  {/* Dashed line to separate ticket stub from main part */}
                  <div style={{
                    position: 'absolute',
                    right: '110px',
                    top: 0,
                    bottom: 0,
                    borderLeft: '2px dashed rgba(0,0,0,0.1)',
                    zIndex: 10
                  }}></div>
                  
                  {/* Top image area */}
                  <div style={{ height: '120px', position: 'relative', backgroundColor: '#f1f5f9' }}>
                    {purchase.image_url ? (
                      <Image src={purchase.image_url} alt={purchase.event_title} fill style={{ objectFit: 'cover' }} unoptimized />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #000c6622, #000c6611)' }}>
                        <Ticket size={48} style={{ color: '#000c66', opacity: 0.3 }} />
                      </div>
                    )}
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      left: '1rem',
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#00875a',
                      fontFamily: 'var(--font-syne), sans-serif',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      PAID
                    </div>
                  </div>
                  
                  {/* Bottom info area */}
                  <div style={{ display: 'flex', padding: '1.5rem', gap: '1rem' }}>
                    <div style={{ flex: 1, paddingRight: '1rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#000c66', fontFamily: 'var(--font-syne), sans-serif', marginBottom: '1rem', lineHeight: 1.3 }}>
                        {purchase.event_title}
                      </h3>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontFamily: 'var(--font-roboto), sans-serif', fontSize: '0.85rem', color: '#334155' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Calendar size={14} style={{ color: '#64748b' }} />
                          <span>{purchase.event_date ? formatDate(purchase.event_date) : 'Date TBA'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Clock size={14} style={{ color: '#64748b' }} />
                          <span>{purchase.event_time ? formatTime(purchase.event_time) : 'Time TBA'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <MapPin size={14} style={{ color: '#64748b' }} />
                          <span>{purchase.location || 'Location TBA'}</span>
                        </div>
                      </div>
                      
                      <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Order ID</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#000c66', fontFamily: 'monospace' }}>#{purchase.order_id.substring(0, 8)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Name</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#000c66' }}>{purchase.customer_name}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* QR Code section */}
                    <div style={{ width: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '80px', height: '80px', padding: '0.25rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(purchase.order_id)}`}
                          alt="Ticket QR Code" 
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                        />
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8', textAlign: 'center', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        Scan at entry
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Area */}
                  <div style={{ padding: '0 1.5rem 1.5rem', marginTop: 'auto' }}>
                    <a 
                      href={`/tickets/print/${purchase.order_id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn"
                      style={{ 
                        width: '100%', 
                        display: 'flex', 
                        justifyContent: 'center', 
                        backgroundColor: '#f1f5f9', 
                        color: '#000c66', 
                        border: '1px solid #e2e8f0',
                        fontSize: '0.9rem'
                      }}
                    >
                      Download Ticket
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Checkout Modal */}
      {selectedEvent && (
        <div 
          style={{ 
            position: "fixed", 
            inset: 0, 
            backgroundColor: "rgba(0,0,0,0.65)", 
            zIndex: 9999, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            padding: "1.5rem", 
            backdropFilter: "blur(5px)" 
          }} 
          onClick={closeCheckout}
        >
          <div className="checkout-modal-container" onClick={e => e.stopPropagation()}>
            {/* Close Button */}
            <button className="checkout-close-btn" onClick={closeCheckout}>
              <X size={18} />
            </button>

            {/* Left Column - Poster Image */}
            <div className="checkout-modal-img-col">
              {selectedEvent.image_url ? (
                <Image
                  src={selectedEvent.image_url}
                  alt={selectedEvent.title}
                  fill
                  style={{ objectFit: "cover" }}
                  unoptimized
                />
              ) : (
                <div style={{ height: "100%", background: "linear-gradient(135deg, #000c6622, #000c6611)", display: "flex", alignItems: "center", justifyContent: "center", position: "absolute", inset: 0 }}>
                  <Ticket size={80} style={{ color: "#000c66", opacity: 0.4 }} />
                </div>
              )}
            </div>

            {/* Right Column - Checkout Form */}
            <div className="checkout-modal-info-col">
              <h2 className="checkout-modal-title" style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "2.2rem", fontWeight: 800, color: "#000000", marginBottom: "1.75rem", lineHeight: 1.2 }}>
                Checkout details
              </h2>

              {/* Item Summary Row */}
              <div style={{ marginBottom: "1.5rem" }}>
                <div className="checkout-summary-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontFamily: "var(--font-syne), sans-serif", fontSize: "1.25rem", fontWeight: 800, color: "#000000", paddingBottom: "0.5rem" }}>
                  <span>{selectedEvent.title}</span>
                  <span>LKR.{selectedEvent.price}</span>
                </div>
                <hr style={{ border: "none", borderTop: "1.5px solid #000000", margin: 0 }} />
              </div>

              {error && (
                <div style={{ marginBottom: "1.25rem", padding: "0.75rem 1rem", borderRadius: "0.8rem", fontSize: "0.9rem", display: "flex", gap: "0.5rem", alignItems: "center", backgroundColor: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <form onSubmit={handleCheckout} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="responsive-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontFamily: "var(--font-syne), sans-serif", fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.5rem", color: "#000000" }}>First Name</label>
                    <input 
                      type="text" 
                      required 
                      value={form.firstName} 
                      onChange={e => setForm({ ...form, firstName: e.target.value })}
                      style={{
                        height: "45px",
                        backgroundColor: "#f1f3f5",
                        border: "1px solid rgba(0, 0, 0, 0.1)",
                        borderRadius: "0.75rem",
                        padding: "0 1rem",
                        width: "100%",
                        outline: "none",
                        fontFamily: "var(--font-syne), sans-serif",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        color: "#000000"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontFamily: "var(--font-syne), sans-serif", fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.5rem", color: "#000000" }}>Last Name</label>
                    <input 
                      type="text" 
                      required 
                      value={form.lastName} 
                      onChange={e => setForm({ ...form, lastName: e.target.value })}
                      style={{
                        height: "45px",
                        backgroundColor: "#f1f3f5",
                        border: "1px solid rgba(0, 0, 0, 0.1)",
                        borderRadius: "0.75rem",
                        padding: "0 1rem",
                        width: "100%",
                        outline: "none",
                        fontFamily: "var(--font-syne), sans-serif",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        color: "#000000"
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-syne), sans-serif", fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.5rem", color: "#000000" }}>Email Address</label>
                  <input 
                    type="email" 
                    required 
                    value={form.email} 
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    style={{
                      height: "45px",
                      backgroundColor: "#f1f3f5",
                      border: "1px solid rgba(0, 0, 0, 0.1)",
                      borderRadius: "0.75rem",
                      padding: "0 1rem",
                      width: "100%",
                      outline: "none",
                      fontFamily: "var(--font-syne), sans-serif",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      color: "#000000"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-syne), sans-serif", fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.5rem", color: "#000000" }}>Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="e.g. 0771234567"
                    required
                    maxLength={10}
                    pattern="[0-9]{10}"
                    title="Phone number must be exactly 10 digits"
                    value={form.phone} 
                    onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                    style={{
                      height: "45px",
                      backgroundColor: "#f1f3f5",
                      border: "1px solid rgba(0, 0, 0, 0.1)",
                      borderRadius: "0.75rem",
                      padding: "0 1rem",
                      width: "100%",
                      outline: "none",
                      fontFamily: "var(--font-syne), sans-serif",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      color: "#000000"
                    }}
                  />
                </div>

                {/* Qty & Total Selector Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem", marginBottom: "0.5rem" }}>
                  {/* Qty counter */}
                  <div>
                    <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "0.85rem", fontWeight: 700, color: "#000000", marginBottom: "0.35rem" }}>Qty</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <button
                        type="button"
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "50%",
                          backgroundColor: "#000000",
                          color: "#ffffff",
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "1.2rem", fontWeight: 500, color: "#000000", minWidth: "20px", textAlign: "center" }}>
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(q => Math.min(selectedEvent.available_tickets, q + 1))}
                        disabled={quantity >= selectedEvent.available_tickets}
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "50%",
                          backgroundColor: "#000000",
                          color: "#ffffff",
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: quantity >= selectedEvent.available_tickets ? "not-allowed" : "pointer",
                          opacity: quantity >= selectedEvent.available_tickets ? 0.3 : 1
                        }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Total price display */}
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "0.85rem", fontWeight: 700, color: "#000000", marginBottom: "0.35rem" }}>Total</div>
                    <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "1.3rem", fontWeight: 700, color: "#000000" }}>
                      LKR.{selectedEvent.price * quantity}
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={processing}
                  style={{ 
                    width: "100%", 
                    backgroundColor: "#000c66", 
                    color: "#ffffff", 
                    border: "none", 
                    borderRadius: "9999px", 
                    padding: "1rem", 
                    fontSize: "1.25rem", 
                    fontWeight: 800, 
                    fontFamily: "var(--font-syne), sans-serif", 
                    cursor: "pointer",
                    transition: "opacity 0.2s",
                    opacity: processing ? 0.7 : 1,
                    marginTop: "0.5rem"
                  }}
                >
                  {processing ? "Connecting to Stripe..." : "PAY NOW"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
