"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Clock, X, Upload, Phone, CheckCircle, Image as ImageIcon, PlusCircle } from "lucide-react";
import Image from "next/image";
import { uploadToCloudinary } from "../lib/cloudinary";

interface Report {
  id: number;
  title: string;
  description: string;
  location: string;
  time_date: string;
  type: string;
  status: string;
  contact_number: string;
  contact_email: string;
  user_id: number;
  reporter_name: string;
  reporter_email: string;
  images: string[];
}

const formatReportDateTime = (dateTimeStr: string) => {
  if (!dateTimeStr) return "";
  if (dateTimeStr.includes("T")) {
    try {
      const date = new Date(dateTimeStr);
      if (isNaN(date.getTime())) return dateTimeStr;
      
      const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
      const month = monthNames[date.getMonth()];
      const day = date.getDate();
      
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? "pm" : "am";
      hours = hours % 12;
      hours = hours ? hours : 12;
      const minutesStr = minutes < 10 ? "0" + minutes : minutes;
      
      return `${month} ${day} , ${hours}.${minutesStr}${ampm}`;
    } catch (e) {
      return dateTimeStr;
    }
  }
  return dateTimeStr;
};

export default function LostAndFoundPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [filter, setFilter] = useState<"All" | "Lost" | "Found" | "Mine">("All");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [myId, setMyId] = useState("");
  const [contactReport, setContactReport] = useState<Report | null>(null);
  const [detailReport, setDetailReport] = useState<Report | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [alertMessage, setAlertMessage] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{ message: string, onConfirm: () => void } | null>(null);

  // Split date/time states (Option B: Remove Year)
  const [selectedMonth, setSelectedMonth] = useState("jan");
  const [selectedDay, setSelectedDay] = useState("1");
  const [selectedTime, setSelectedTime] = useState("12:00");

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    time_date: "",
    type: "Lost",
    contact_number: "",
    contact_email: ""
  });
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    const parseCookie = (name: string) => document.cookie.split("; ").find(r => r.startsWith(name + "="))?.split("=")[1];
    setMyId(parseCookie("uwu_user_id") || "");
    fetchReports();

    // Initialize with current date and time
    const now = new Date();
    const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    setSelectedMonth(monthNames[now.getMonth()]);
    setSelectedDay(now.getDate().toString());
    const hr = now.getHours().toString().padStart(2, '0');
    const min = now.getMinutes().toString().padStart(2, '0');
    setSelectedTime(`${hr}:${min}`);
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/get_lost_found.php`);
      const data = await res.json();
      if (data.success) {
        setReports(data.items);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myId) {
      setAlertMessage("You must be logged in to create a report.");
      return;
    }

    // Validate that the selected date/time is not in the future
    const now = new Date();
    const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const monthIndex = monthNames.indexOf(selectedMonth);
    const day = parseInt(selectedDay, 10);
    
    let year = now.getFullYear();
    // If selected month is greater than current month, it must be from last year
    if (monthIndex > now.getMonth()) {
      year -= 1;
    }
    
    const [hoursStr, minutesStr] = selectedTime.split(":");
    const selectedDateObj = new Date(year, monthIndex, day, parseInt(hoursStr || "0", 10), parseInt(minutesStr || "0", 10));
    
    if (selectedDateObj > now) {
      setAlertMessage("Future dates and times are not allowed for Lost & Found items.");
      return;
    }

    setFormLoading(true);

    try {
      const imageUrls = await Promise.all(
        files.map(file => uploadToCloudinary(file, "uwunexus/lostandfound"))
      );

      // Format selectedTime into AM/PM with dot syntax (e.g. 10.30pm)
      let timeStr = "";
      if (selectedTime) {
        const [hoursStr, minutesStr] = selectedTime.split(":");
        let hours = parseInt(hoursStr, 10);
        const minutes = parseInt(minutesStr, 10);
        const ampm = hours >= 12 ? "pm" : "am";
        hours = hours % 12;
        hours = hours ? hours : 12;
        const minStr = minutes < 10 ? "0" + minutes : minutes;
        timeStr = `${hours}.${minStr}${ampm}`;
      }
      const combinedDateTime = `${selectedMonth} ${selectedDay} , ${timeStr}`;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/create_lost_found.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          time_date: combinedDateTime,
          user_id: +myId,
          images: imageUrls
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setAlertMessage("Report created successfully!");
        setShowModal(false);
        setForm({ title: "", description: "", location: "", time_date: "", type: "Lost", contact_number: "", contact_email: "" });
        setFiles([]);
        
        // Reset date/time to current values
        const now = new Date();
        const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
        setSelectedMonth(monthNames[now.getMonth()]);
        setSelectedDay(now.getDate().toString());
        const hr = now.getHours().toString().padStart(2, '0');
        const min = now.getMinutes().toString().padStart(2, '0');
        setSelectedTime(`${hr}:${min}`);

        fetchReports();
      } else {
        setAlertMessage(data.message);
      }
    } catch (err: any) {
      setAlertMessage(err.message || "An error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  const handleMarkResolved = async (id: number) => {
    setConfirmDialog({
      message: "Are you sure you want to mark this as Found/Resolved?",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/update_lost_found.php`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, user_id: +myId, status: 'resolved' })
          });
          const data = await res.json();
          if (data.success) {
            setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'resolved' } : r));
          } else {
            setAlertMessage(data.message);
          }
        } catch (e) {
          setAlertMessage("Error updating status.");
        }
      }
    });
  };

  const filteredReports = reports.filter(r => {
    if (filter === "Lost") return r.type === "Lost";
    if (filter === "Found") return r.type === "Found";
    if (filter === "Mine") return r.user_id === +myId;
    return true;
  });

  return (
    <div className="container" style={{ maxWidth: '1210px', marginTop: '1.5rem', minHeight: '100vh', paddingBottom: '4rem' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4" style={{ marginTop: '1.5rem' }}>
        <div>
          <h1 className="page-title" style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, color: '#000000', letterSpacing: '0.02em', marginBottom: '0.25rem' }}>
            Lost & Found Items
          </h1>
          <p style={{ fontFamily: 'var(--font-inclusive-sans), sans-serif', fontSize: '1.15rem', color: '#64748b', fontWeight: 500 }}>
            Community portal to report and recover misplaced items.
          </p>
        </div>
        <button 
          style={{ 
            backgroundColor: '#000c66', 
            color: '#ffffff', 
            border: 'none', 
            borderRadius: '9999px', 
            padding: '0.75rem 1.5rem', 
            fontFamily: 'var(--font-syne), sans-serif', 
            fontWeight: 700, 
            fontSize: '1rem', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 14px rgba(0, 12, 102, 0.2)',
            transition: 'all 0.2s'
          }} 
          onClick={() => setShowModal(true)}
        >
          <PlusCircle size={18} />
          <span>Report Item</span>
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap mb-8" style={{ marginTop: '2rem' }}>
        <button 
          onClick={() => setFilter("All")}
          style={{
            height: '38px',
            padding: '0 1.25rem',
            borderRadius: '9999px',
            backgroundColor: filter === "All" ? "#000c66" : "#ffffff",
            color: filter === "All" ? "#ffffff" : "#000c66",
            border: `1.5px solid ${filter === "All" ? "#000c66" : "#e2e8f0"}`,
            fontSize: '0.9rem',
            fontWeight: 700,
            fontFamily: 'var(--font-syne), sans-serif',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          All Reports
        </button>
        <button 
          onClick={() => setFilter("Lost")}
          style={{
            height: '38px',
            padding: '0 1.25rem',
            borderRadius: '9999px',
            backgroundColor: filter === "Lost" ? "#000c66" : "#ffffff",
            color: filter === "Lost" ? "#ffffff" : "#000c66",
            border: `1.5px solid ${filter === "Lost" ? "#000c66" : "#e2e8f0"}`,
            fontSize: '0.9rem',
            fontWeight: 700,
            fontFamily: 'var(--font-syne), sans-serif',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          Lost Items
        </button>
        <button 
          onClick={() => setFilter("Found")}
          style={{
            height: '38px',
            padding: '0 1.25rem',
            borderRadius: '9999px',
            backgroundColor: filter === "Found" ? "#000c66" : "#ffffff",
            color: filter === "Found" ? "#ffffff" : "#000c66",
            border: `1.5px solid ${filter === "Found" ? "#000c66" : "#e2e8f0"}`,
            fontSize: '0.9rem',
            fontWeight: 700,
            fontFamily: 'var(--font-syne), sans-serif',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          Found Items
        </button>
        {myId && (
          <button 
            onClick={() => setFilter("Mine")}
            style={{
              height: '38px',
              padding: '0 1.25rem',
              borderRadius: '9999px',
              backgroundColor: filter === "Mine" ? "#000c66" : "#ffffff",
              color: filter === "Mine" ? "#ffffff" : "#000c66",
              border: `1.5px solid ${filter === "Mine" ? "#000c66" : "#e2e8f0"}`,
              fontSize: '0.9rem',
              fontWeight: 700,
              fontFamily: 'var(--font-syne), sans-serif',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            My Reports
          </button>
        )}
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "5rem 0", color: "#64748b", fontFamily: "var(--font-syne), sans-serif", fontWeight: 700 }}>Loading reports...</div>
      ) : filteredReports.length === 0 ? (
        <div style={{ textAlign: "center", padding: "5rem 0", color: "#64748b", maxWidth: "600px", margin: "0 auto", fontFamily: "var(--font-syne), sans-serif" }}>
          <Search size={48} style={{ margin: "0 auto 1rem auto", opacity: 0.3 }} />
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#000000", marginBottom: "0.5rem" }}>No Reports Found</h2>
          <p style={{ fontWeight: 500 }}>No listings match your criteria. You can create a report if you lost or found an item.</p>
        </div>
      ) : (
        <div className="grid gap-8" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          {filteredReports.map((report) => {
            const isMine = report.user_id === +myId;
            const isResolved = report.status === 'resolved';

            return (
              <div key={report.id} className="event-card" onClick={() => { setDetailReport(report); setActiveImageIndex(0); }} style={{ opacity: isResolved ? 0.6 : 1, cursor: "pointer" }}>
                {/* Image visual wrapper with aspect ratio matching mockup */}
                <div className="event-card-image-wrapper">
                  {report.images && report.images.length > 0 ? (
                    <img src={report.images[0]} alt={report.title} className="event-card-img" />
                  ) : (
                    <div className="event-card-no-img" style={{ background: "linear-gradient(135deg, #000c6622, #000c6611)" }}>
                      <ImageIcon size={40} style={{ color: "#000c66", opacity: 0.4 }} />
                    </div>
                  )}
                  {isResolved && (
                    <div className="absolute inset-0 flex justify-center items-center z-10" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                      <div style={{ backgroundColor: "#10b981", color: "white", padding: "0.4rem 1.25rem", borderRadius: "9999px", fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>RESOLVED</div>
                    </div>
                  )}
                </div>

                {/* Content block stack */}
                <div className="event-card-content">
                  {/* Title & Type Badge Row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <h3 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "1.25rem", fontWeight: 700, color: "#000000", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                      {report.title}
                    </h3>
                    <span style={{ 
                      backgroundColor: report.type === "Lost" ? "#a61c1c" : "#1b8a5a", 
                      color: "#ffffff", 
                      borderRadius: "9999px",
                      padding: "0.25rem 0.9rem",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      fontFamily: "var(--font-syne), sans-serif"
                    }}>
                      {report.type}
                    </span>
                  </div>

                  {/* Description Box Container */}
                  <div style={{ 
                    backgroundColor: "#d6d9de", 
                    borderRadius: "1rem", 
                    padding: "0.75rem 1rem", 
                    marginTop: "0.75rem", 
                    marginBottom: "1.25rem",
                    fontFamily: "var(--font-syne), sans-serif",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    color: "#000000",
                    textAlign: "left",
                    minHeight: "55px",
                    display: "flex",
                    alignItems: "center"
                  }}>
                    {report.description}
                  </div>

                  {/* Metadata List */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginBottom: "1.5rem", fontFamily: "var(--font-syne), sans-serif", fontSize: "1.05rem", color: "#000000", fontWeight: 700 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <MapPin size={18} style={{ color: "#000000", flexShrink: 0 }} />
                      <span>{report.location}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <Clock size={18} style={{ color: "#000000", flexShrink: 0 }} />
                      <span>{formatReportDateTime(report.time_date)}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span>{report.reporter_name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#000000", flexShrink: 0 }}>call</span>
                      <span>{report.contact_number}</span>
                    </div>
                  </div>

                  {/* Actions Buttons */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%", marginTop: "auto" }}>
                    {!isResolved && (
                      <button 
                        className="event-card-btn"
                        style={{ 
                          backgroundColor: "#0d0e4aff", 
                          color: "#ffffff", 
                          borderRadius: "9999px", 
                          padding: "0.65rem 1.5rem", 
                          fontFamily: "var(--font-syne), sans-serif", 
                          fontWeight: 700, 
                          fontSize: "0.95rem", 
                          display: "inline-flex", 
                          alignItems: "center", 
                          justifyContent: "center", 
                          gap: "0.5rem", 
                          border: "none",
                          cursor: "pointer",
                          transition: "opacity 0.2s",
                          whiteSpace: "nowrap",
                          width: "100%"
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "inherit", display: "inline-block" }}>visibility</span>
                        <span>View Details</span>
                      </button>
                    )}

                    {isMine && !isResolved && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleMarkResolved(report.id); }}
                        style={{ 
                          backgroundColor: "#115e3b", 
                          color: "#ffffff", 
                          borderRadius: "9999px", 
                          padding: "0.65rem 1.5rem", 
                          fontFamily: "var(--font-syne), sans-serif", 
                          fontWeight: 700, 
                          fontSize: "0.95rem", 
                          display: "inline-flex", 
                          alignItems: "center", 
                          justifyContent: "center", 
                          gap: "0.5rem", 
                          border: "none",
                          cursor: "pointer",
                          transition: "opacity 0.2s",
                          whiteSpace: "nowrap",
                          width: "100%"
                        }}
                      >
                        <CheckCircle size={16} />
                        <span>Mark as Found</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div 
          style={{ 
            position: "fixed", 
            inset: 0, 
            backgroundColor: "rgba(0,0,0,0.65)", 
            zIndex: 100, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            padding: "1.5rem",
            backdropFilter: "blur(5px)"
          }} 
          onClick={() => setShowModal(false)}
        >
          <div 
            style={{ 
              maxWidth: "600px", 
              width: "100%", 
              backgroundColor: "#ffffff", 
              borderRadius: "2.2rem", 
              padding: "2.5rem", 
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              maxHeight: "90vh",
              overflowY: "auto"
            }} 
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "1.75rem", fontWeight: 700, color: "#000000" }}>Report an Item</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#000000" }}><X size={22} /></button>
            </div>

            <form onSubmit={handleCreateReport} style={{ fontFamily: "var(--font-syne), sans-serif", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="responsive-form-grid">
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem", color: "#000000" }}>Report Type *</label>
                  <select 
                    value={form.type} 
                    onChange={e => setForm({...form, type: e.target.value})}
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
                  >
                    <option value="Lost">I Lost Something</option>
                    <option value="Found">I Found Something</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem", color: "#000000" }}>Item Title *</label>
                  <input 
                    type="text" 
                    required 
                    value={form.title} 
                    onChange={e => setForm({...form, title: e.target.value})} 
                    placeholder="e.g., Black Wallet" 
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
              
              <div className="responsive-form-grid">
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem", color: "#000000" }}>Location *</label>
                  <input 
                    type="text" 
                    required 
                    value={form.location} 
                    onChange={e => setForm({...form, location: e.target.value})} 
                    placeholder="e.g., Library 2nd Floor" 
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
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem", color: "#000000" }}>Time & Date *</label>
                  <div className="responsive-date-time-flex">
                    {/* Month Dropdown */}
                    <select
                      value={selectedMonth}
                      onChange={e => setSelectedMonth(e.target.value)}
                      style={{
                        flex: 1,
                        height: "45px",
                        backgroundColor: "#f1f3f5",
                        border: "1px solid rgba(0, 0, 0, 0.1)",
                        borderRadius: "0.75rem",
                        padding: "0 0.5rem",
                        outline: "none",
                        fontFamily: "var(--font-syne), sans-serif",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        color: "#000000"
                      }}
                    >
                      {["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].map(m => (
                        <option key={m} value={m}>{m.toUpperCase()}</option>
                      ))}
                    </select>

                    {/* Day Dropdown */}
                    <select
                      value={selectedDay}
                      onChange={e => setSelectedDay(e.target.value)}
                      style={{
                        flex: 1,
                        height: "45px",
                        backgroundColor: "#f1f3f5",
                        border: "1px solid rgba(0, 0, 0, 0.1)",
                        borderRadius: "0.75rem",
                        padding: "0 0.5rem",
                        outline: "none",
                        fontFamily: "var(--font-syne), sans-serif",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        color: "#000000"
                      }}
                    >
                      {Array.from({ length: 31 }, (_, i) => (i + 1).toString()).map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>

                    {/* Time Input */}
                    <input
                      type="time"
                      value={selectedTime}
                      onChange={e => setSelectedTime(e.target.value)}
                      style={{
                        flex: 1.2,
                        height: "45px",
                        backgroundColor: "#f1f3f5",
                        border: "1px solid rgba(0, 0, 0, 0.1)",
                        borderRadius: "0.75rem",
                        padding: "0 0.5rem",
                        outline: "none",
                        fontFamily: "var(--font-syne), sans-serif",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        color: "#000000"
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="responsive-form-grid">
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem", color: "#000000" }}>Contact Number *</label>
                  <input 
                    type="text" 
                    required 
                    maxLength={10}
                    pattern="[0-9]{10}"
                    title="Phone number must be exactly 10 digits"
                    value={form.contact_number} 
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setForm({...form, contact_number: val});
                    }} 
                    placeholder="e.g., 0712345678" 
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
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem", color: "#000000" }}>Contact Email</label>
                  <input 
                    type="email" 
                    value={form.contact_email} 
                    onChange={e => setForm({...form, contact_email: e.target.value})} 
                    placeholder="Optional" 
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
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem", color: "#000000" }}>Description *</label>
                <textarea 
                  rows={4} 
                  required 
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})} 
                  placeholder="Provide detailed description, identifying marks, etc."
                  style={{
                    backgroundColor: "#f1f3f5",
                    border: "1px solid rgba(0, 0, 0, 0.1)",
                    borderRadius: "0.75rem",
                    padding: "0.75rem 1rem",
                    width: "100%",
                    outline: "none",
                    fontFamily: "var(--font-syne), sans-serif",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "#000000",
                    resize: "none"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem", color: "#000000" }}>Images (Optional, Max 3)</label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center text-muted flex flex-col items-center justify-center cursor-pointer relative hover:border-primary transition-colors" style={{ backgroundColor: "#f1f3f5", borderRadius: "1rem", border: "2px dashed rgba(0,0,0,0.15)" }}>
                  <Upload size={24} className="mb-2" />
                  <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Click to select images</span>
                  <input 
                    type="file" 
                    accept="image/jpeg, image/png, image/webp" 
                    multiple 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    onChange={e => {
                      if (e.target.files) {
                        const newFiles = Array.from(e.target.files).slice(0, 3);
                        setFiles(newFiles);
                      }
                    }}
                  />
                </div>
                {files.length > 0 && (
                  <div style={{ fontSize: "0.85rem", color: "var(--success)", marginTop: "0.5rem", fontWeight: 700 }}>
                    {files.length} file(s) selected
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={formLoading} 
                style={{ 
                  width: "100%", 
                  backgroundColor: "#000c66", 
                  color: "#ffffff", 
                  border: "none", 
                  borderRadius: "9999px", 
                  padding: "0.8rem", 
                  fontSize: "1.1rem", 
                  fontWeight: 700, 
                  fontFamily: "var(--font-syne), sans-serif", 
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                  opacity: formLoading ? 0.7 : 1,
                  marginTop: "0.5rem"
                }}
              >
                {formLoading ? "Submitting..." : "Submit Report"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Report Detail Modal */}
      {detailReport && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.65)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", backdropFilter: "blur(5px)" }}
          onClick={() => setDetailReport(null)}
        >
          <div className="event-detail-modal-container" onClick={e => e.stopPropagation()}>
            {/* Left Column - Image & Thumbnails */}
            <div className="event-detail-modal-img-col" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ flex: 1, position: "relative", borderRadius: "1.5rem", overflow: "hidden", backgroundColor: "#f8fafc" }}>
                {detailReport.images && detailReport.images.length > 0 ? (
                  <img src={detailReport.images[activeImageIndex]} alt={detailReport.title} style={{ width: "100%", height: "100%", objectFit: "contain", position: "absolute", inset: 0 }} />
                ) : (
                  <div style={{ height: "100%", background: "linear-gradient(135deg, #000c6622, #000c6611)", display: "flex", alignItems: "center", justifyContent: "center", position: "absolute", inset: 0 }}>
                    <ImageIcon size={80} style={{ color: "#000c66", opacity: 0.4 }} />
                  </div>
                )}
              </div>
              
              {/* Thumbnail Gallery */}
              {detailReport.images && detailReport.images.length > 1 && (
                <div style={{ display: "flex", gap: "0.75rem", height: "80px" }}>
                  {detailReport.images.map((img, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      style={{ 
                        flex: 1, 
                        borderRadius: "0.75rem", 
                        overflow: "hidden", 
                        cursor: "pointer",
                        border: activeImageIndex === idx ? "3px solid #000c66" : "3px solid transparent",
                        opacity: activeImageIndex === idx ? 1 : 0.6,
                        transition: "all 0.2s"
                      }}
                    >
                      <img src={img} alt={`${detailReport.title} - ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Details */}
            <div className="event-detail-modal-info-col">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "0.5rem" }}>
                <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "2.2rem", fontWeight: 800, color: "#000000", lineHeight: 1.2, margin: 0 }}>
                  {detailReport.title}
                </h2>
                <span style={{ 
                  backgroundColor: detailReport.type === "Lost" ? "#a61c1c" : "#1b8a5a", 
                  color: "#ffffff", 
                  borderRadius: "9999px",
                  padding: "0.4rem 1.2rem",
                  fontSize: "1rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-syne), sans-serif",
                  flexShrink: 0
                }}>
                  {detailReport.type}
                </span>
              </div>
              
              <div style={{ 
                backgroundColor: "#d6d9de", 
                borderRadius: "1rem", 
                padding: "1.25rem", 
                marginTop: "1.5rem", 
                marginBottom: "1.5rem",
                fontFamily: "var(--font-syne), sans-serif",
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "#000000",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap"
              }}>
                {detailReport.description}
              </div>
              
              <div style={{ backgroundColor: "#e6e9ec", borderRadius: "1.5rem", padding: "1.25rem 1.5rem", border: "1px solid rgba(0,0,0,0.03)", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontFamily: "var(--font-syne), sans-serif", fontSize: "1rem", fontWeight: 700, color: "#000000" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}><MapPin size={18} style={{ color: "#000000", flexShrink: 0, marginTop: "2px" }} /><span>Location: {detailReport.location}</span></div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}><Clock size={18} style={{ color: "#000000", flexShrink: 0, marginTop: "2px" }} /><span>Time: {formatReportDateTime(detailReport.time_date)}</span></div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "2px" }}>
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>Reporter: {detailReport.reporter_name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}><span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#000000", flexShrink: 0, marginTop: "2px" }}>call</span><span>Phone: {detailReport.contact_number}</span></div>
                  {detailReport.contact_email && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}><span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#000000", flexShrink: 0, marginTop: "2px" }}>mail</span><span>Email: {detailReport.contact_email}</span></div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "auto" }}>
                <button onClick={() => setDetailReport(null)} style={{ backgroundColor: "#ffffff", color: "#0d0e4aff", border: "1.5px solid #0d0e4aff", borderRadius: "9999px", padding: "0.6rem 2rem", fontSize: "1rem", fontWeight: 700, fontFamily: "var(--font-syne), sans-serif", cursor: "pointer", transition: "all 0.2s" }}>
                  Close
                </button>
                {myId !== detailReport.user_id?.toString() && detailReport.status !== 'resolved' && (
                  <button 
                    onClick={() => { 
                      setContactReport(detailReport); 
                      setDetailReport(null); 
                    }} 
                    style={{ backgroundColor: "#0d0e4aff", color: "#ffffff", border: "none", borderRadius: "9999px", padding: "0.6rem 2.5rem", fontSize: "1rem", fontWeight: 700, fontFamily: "var(--font-syne), sans-serif", cursor: "pointer", transition: "background-color 0.2s", display: "flex", alignItems: "center", gap: "0.5rem" }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "inherit", display: "inline-block" }}>call</span>
                    Contact Reporter
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Via Modal */}
      {contactReport && (
        <div 
          style={{ 
            position: "fixed", 
            inset: 0, 
            backgroundColor: "rgba(0,0,0,0.65)", 
            zIndex: 110, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            padding: "1.5rem",
            backdropFilter: "blur(5px)"
          }} 
          onClick={() => setContactReport(null)}
        >
          <div 
            style={{ 
              maxWidth: "400px", 
              width: "100%", 
              backgroundColor: "#ffffff", 
              borderRadius: "2.2rem", 
              padding: "3rem 2.5rem", 
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              position: "relative",
              textAlign: "center"
            }} 
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setContactReport(null)} 
              style={{ 
                position: "absolute",
                top: "1.5rem",
                right: "1.5rem",
                background: "#ffffff", 
                border: "1.5px solid #e2e8f0", 
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer", 
                color: "#000000",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.08)"
              }}
            >
              <X size={18} />
            </button>

            {/* Header */}
            <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "2.2rem", fontWeight: 700, color: "#000000", marginBottom: "2rem" }}>
              Contact Via
            </h2>

            {/* Options Grid */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* WhatsApp Button */}
              <button
                onClick={() => {
                  const phone = contactReport.contact_number;
                  let clean = phone.replace(/\D/g, "");
                  if (clean.startsWith("0")) {
                    clean = "94" + clean.slice(1);
                  }
                  window.open(`https://wa.me/${clean}`, "_blank");
                }}
                style={{
                  width: "100%",
                  height: "55px",
                  borderRadius: "9999px",
                  border: "1.5px solid #000000",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "1rem",
                  cursor: "pointer",
                  transition: "background-color 0.2s"
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.764.46 3.42 1.268 4.876L2 22l5.284-1.388c1.392.76 2.972 1.196 4.72 1.196 5.524 0 10.004-4.48 10.004-10.004C22.008 6.48 17.528 2 12.004 2z" fill="#25D366"/>
                  <path d="M17.508 14.304c-.304-.152-1.8-.888-2.076-.988-.276-.1-.476-.152-.676.152-.2.304-.776.988-.952 1.188-.176.2-.352.224-.656.072-1.14-.572-1.9-1.02-2.652-2.312-.2-.344.2-.32.572-1.064.092-.184.048-.344-.024-.496-.072-.152-.676-1.632-.928-2.236-.244-.588-.492-.508-.676-.516-.176-.008-.376-.008-.576-.008s-.524.076-.8.376c-.276.3-1.052 1.028-1.052 2.508s1.076 2.904 1.224 3.104c.148.2 2.116 3.232 5.128 4.532.716.308 1.276.492 1.712.632.72.228 1.376.196 1.896.116.58-.088 1.8-.736 2.052-1.44.252-.704.252-1.308.176-1.44-.076-.132-.276-.232-.58-.384z" fill="#FFF"/>
                </svg>
                <span style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "1.3rem", fontWeight: 700, color: "#000000" }}>
                  Whatsapp
                </span>
              </button>

              {/* Email Button */}
              <button
                onClick={() => {
                  window.location.href = `mailto:${contactReport.contact_email || contactReport.reporter_email}`;
                }}
                style={{
                  width: "100%",
                  height: "55px",
                  borderRadius: "9999px",
                  border: "1.5px solid #000000",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "1rem",
                  cursor: "pointer",
                  transition: "background-color 0.2s"
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#4285F4" d="M20 18h2V6c0-1.1-.9-2-2-2h-3v14h3z" />
                  <path fill="#34A853" d="M4 18h2V4H4c-1.1 0-2 0.9-2 2v12h2z" />
                  <path fill="#EA4335" d="M12 13.5l8-6.5V4l-8 6.5L4 4v3l8 6.5z" />
                  <path fill="#FBBC05" d="M17 4h-3v5l3-2.5V4zM7 4h3v5L7 6.5V4z" />
                </svg>
                <span style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "1.3rem", fontWeight: 700, color: "#000000" }}>
                  Email
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {alertMessage && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", backdropFilter: "blur(5px)" }}>
          <div className="card" style={{ maxWidth: "400px", width: "100%", textAlign: "center", padding: "2rem" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem" }}>Notice</h3>
            <p style={{ marginBottom: "1.5rem", color: "var(--muted)" }}>{alertMessage}</p>
            <button onClick={() => setAlertMessage("")} className="btn btn-primary w-full justify-center">OK</button>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal */}
      {confirmDialog && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", backdropFilter: "blur(5px)" }}>
          <div className="card" style={{ maxWidth: "400px", width: "100%", padding: "2rem" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem" }}>Confirm Action</h3>
            <p style={{ marginBottom: "1.5rem", color: "var(--muted)" }}>{confirmDialog.message}</p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmDialog(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={confirmDialog.onConfirm} className="btn btn-primary" style={{ backgroundColor: "var(--danger)", color: "white", border: "none" }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
