"use client";

import { useEffect, useState, use, useRef } from "react";
import { Ticket, Calendar, Clock, MapPin, Loader2, AlertCircle, Download } from "lucide-react";
import * as htmlToImage from "html-to-image";
import { jsPDF } from "jspdf";

export default function PrintTicketPage({ params }: { params: Promise<{ order_id: string }> }) {
  const { order_id } = use(params);
  const [purchase, setPurchase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!order_id) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/get_single_purchase.php?order_id=${order_id}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setPurchase(d.purchase);
        } else {
          setError(d.message || "Ticket not found");
        }
      })
      .catch(err => {
        setError("Error loading ticket");
      })
      .finally(() => setLoading(false));
  }, [order_id]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
  };
  
  const formatTime = (timeStr: string) => {
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const handleDownload = async () => {
    if (!ticketRef.current) return;
    setDownloading(true);
    try {
      // Create a high-quality data URL using html-to-image (supports complex fonts natively, handles CORS better)
      const scale = 3; 
      const node = ticketRef.current;
      
      const dataUrl = await htmlToImage.toPng(node, {
        width: node.clientWidth * scale,
        height: node.clientHeight * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${node.clientWidth}px`,
          height: `${node.clientHeight}px`
        },
        pixelRatio: 1,
        skipFonts: false
      });

      // PDF Dimensions in mm
      // A Ticket size: e.g., 200mm x 70mm
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [210, 75] 
      });

      pdf.addImage(dataUrl, "PNG", 0, 0, 210, 75);
      pdf.save(`Ticket_${purchase.order_id}.pdf`);
      
    } catch (err) {
      console.error("Failed to download ticket", err);
      alert("Failed to download ticket. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem', color: '#000c66' }}>
        <Loader2 className="animate-spin" size={48} />
        <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700 }}>Preparing Ticket...</h2>
      </div>
    );
  }

  if (error || !purchase) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem', color: '#d32f2f' }}>
        <AlertCircle size={48} />
        <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700 }}>{error}</h2>
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: '#f8fafc', 
      minHeight: '100vh', 
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#64748b', marginBottom: '1rem' }}>Download your entry ticket as a PDF document.</p>
        <button 
          onClick={handleDownload}
          disabled={downloading}
          style={{ 
            backgroundColor: '#000c66', 
            color: 'white', 
            padding: '0.75rem 1.5rem', 
            borderRadius: '9999px', 
            fontWeight: 600,
            cursor: downloading ? 'not-allowed' : 'pointer',
            border: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            opacity: downloading ? 0.7 : 1,
            transition: 'opacity 0.2s'
          }}
        >
          {downloading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
          {downloading ? "Generating PDF..." : "Download PDF Ticket"}
        </button>
      </div>

      {/* Ticket Container to be captured */}
      <div style={{ overflowX: 'auto', width: '100%', display: 'flex', justifyContent: 'center', paddingBottom: '2rem' }}>
        <div 
          ref={ticketRef}
          style={{ 
          width: '1000px', 
          height: '357px', // Matches the 210x75 ratio
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'row',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          position: 'relative',
          border: '1px solid #e2e8f0'
        }}>
          
          {/* Left: Image Box */}
          <div style={{ width: '300px', height: '100%', position: 'relative', backgroundColor: '#f1f5f9' }}>
            {purchase.image_url ? (
              <img 
                src={purchase.image_url} 
                alt={purchase.event_title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                crossOrigin="anonymous" 
              />
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Ticket size={64} style={{ opacity: 0.2, color: '#000c66' }} />
              </div>
            )}
            <div style={{ 
              position: 'absolute', 
              top: '1.5rem', 
              left: '1.5rem', 
              backgroundColor: 'rgba(0, 12, 102, 0.95)', 
              color: 'white', 
              padding: '0.5rem 1rem', 
              borderRadius: '0.5rem', 
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              fontFamily: 'var(--font-syne), sans-serif',
              fontWeight: 700,
              fontSize: '1.2rem',
              letterSpacing: '0.05em'
            }}>
              ENTRY TICKET
            </div>
            
            {/* Cutout details on the left */}
            <div style={{ 
              position: 'absolute', 
              bottom: '0', 
              width: '100%', 
              background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
              padding: '2rem 1.5rem 1rem 1.5rem',
              color: 'white'
            }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Paid</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{purchase.currency} {parseFloat(purchase.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          {/* Middle: Details Box */}
          <div style={{ width: '450px', padding: '2.5rem', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '1.8rem', fontWeight: 800, color: '#000c66', marginBottom: '1.5rem', lineHeight: 1.2 }}>
              {purchase.event_title}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ backgroundColor: '#f1f5f9', padding: '0.6rem', borderRadius: '0.5rem', color: '#000c66' }}>
                  <Calendar size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>Date</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>{purchase.event_date ? formatDate(purchase.event_date) : 'TBA'}</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ backgroundColor: '#f1f5f9', padding: '0.6rem', borderRadius: '0.5rem', color: '#000c66' }}>
                  <Clock size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>Time</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>{purchase.event_time ? formatTime(purchase.event_time) : 'TBA'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ backgroundColor: '#f1f5f9', padding: '0.6rem', borderRadius: '0.5rem', color: '#000c66' }}>
                  <MapPin size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>Location</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>{purchase.location || 'TBA'}</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', gap: '2rem', borderTop: '2px solid #f1f5f9', paddingTop: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Purchaser</div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>{purchase.customer_name}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Ticket QTY</div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>{purchase.quantity || 1}</div>
              </div>
            </div>
          </div>

          {/* Right: QR Code Stub */}
          <div style={{ 
            width: '250px', 
            borderLeft: '3px dashed #cbd5e1', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '2rem',
            position: 'relative',
            backgroundColor: '#f8fafc'
          }}>
            {/* Cutout semicircles for realistic ticket look */}
            <div style={{ position: 'absolute', left: '-12px', top: '-12px', width: '24px', height: '24px', backgroundColor: '#f8fafc', borderRadius: '50%', borderBottomRightRadius: 0, borderBottomLeftRadius: 0, borderTopRightRadius: 0, border: '1px solid #e2e8f0', borderTop: 'none', borderLeft: 'none' }}></div>
            <div style={{ position: 'absolute', left: '-12px', bottom: '-12px', width: '24px', height: '24px', backgroundColor: '#f8fafc', borderRadius: '50%', borderTopRightRadius: 0, borderTopLeftRadius: 0, borderBottomRightRadius: 0, border: '1px solid #e2e8f0', borderBottom: 'none', borderLeft: 'none' }}></div>

            <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Order Number</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#000c66', fontFamily: 'monospace' }}>#{purchase.order_id.substring(0, 8)}</div>
            </div>
            
            <div style={{ padding: '0.5rem', backgroundColor: '#ffffff', border: '2px solid #e2e8f0', borderRadius: '0.75rem', marginBottom: '1rem' }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(purchase.order_id)}`} 
                alt="QR Code" 
                style={{ width: '150px', height: '150px', display: 'block' }}
                crossOrigin="anonymous"
              />
            </div>
            
            <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Scan at Entrance
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
