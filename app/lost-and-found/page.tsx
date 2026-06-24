"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Clock, PlusCircle, X, Upload, MessageCircle, Image as ImageIcon, CheckCircle } from "lucide-react";
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

export default function LostAndFoundPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [filter, setFilter] = useState<"All" | "Lost" | "Found" | "Mine">("All");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [myId, setMyId] = useState("");

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
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch("http://localhost:8000/get_lost_found.php");
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
    if (!myId) return alert("You must be logged in to create a report.");
    setFormLoading(true);

    try {
      const imageUrls = await Promise.all(
        files.map(file => uploadToCloudinary(file, "uwunexus/lostandfound"))
      );

      const res = await fetch("http://localhost:8000/create_lost_found.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          user_id: +myId,
          images: imageUrls
        })
      });
      
      const data = await res.json();
      if (data.success) {
        alert("Report created successfully!");
        setShowModal(false);
        setForm({ title: "", description: "", location: "", time_date: "", type: "Lost", contact_number: "", contact_email: "" });
        setFiles([]);
        fetchReports();
      } else {
        alert(data.message);
      }
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  const handleMarkResolved = async (id: number) => {
    if (!confirm("Are you sure you want to mark this as Found/Resolved?")) return;
    try {
      const res = await fetch("http://localhost:8000/update_lost_found.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, user_id: +myId, status: 'resolved' })
      });
      const data = await res.json();
      if (data.success) {
        setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'resolved' } : r));
      } else {
        alert(data.message);
      }
    } catch (e) {
      alert("Error updating status.");
    }
  };

  const filteredReports = reports.filter(r => {
    if (filter === "Lost") return r.type === "Lost";
    if (filter === "Found") return r.type === "Found";
    if (filter === "Mine") return r.user_id === +myId;
    return true;
  });

  return (
    <div className="container py-8 relative min-h-screen">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Search size={36} className="text-warning" />
            Lost & Found
          </h1>
          <p className="text-muted">Community portal to report and recover misplaced items.</p>
        </div>
        <button className="btn btn-primary" style={{ backgroundColor: 'var(--warning)', color: '#000' }} onClick={() => setShowModal(true)}>
          <PlusCircle size={18} /> Report Item
        </button>
      </div>

      <div className="flex gap-4 mb-8 flex-wrap">
        <button className="btn" style={{ borderBottom: filter === "All" ? '2px solid var(--warning)' : '2px solid transparent', color: filter === "All" ? 'var(--warning)' : 'var(--muted)' }} onClick={() => setFilter("All")}>All Reports</button>
        <button className="btn" style={{ borderBottom: filter === "Lost" ? '2px solid var(--danger)' : '2px solid transparent', color: filter === "Lost" ? 'var(--danger)' : 'var(--muted)' }} onClick={() => setFilter("Lost")}>Lost Items</button>
        <button className="btn" style={{ borderBottom: filter === "Found" ? '2px solid var(--success)' : '2px solid transparent', color: filter === "Found" ? 'var(--success)' : 'var(--muted)' }} onClick={() => setFilter("Found")}>Found Items</button>
        {myId && (
          <button className="btn" style={{ borderBottom: filter === "Mine" ? '2px solid var(--primary)' : '2px solid transparent', color: filter === "Mine" ? 'var(--primary)' : 'var(--muted)' }} onClick={() => setFilter("Mine")}>My Reports</button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted">Loading reports...</div>
      ) : filteredReports.length === 0 ? (
        <div className="card text-center py-20 text-muted max-w-2xl mx-auto">
          <Search size={48} className="mx-auto mb-4 opacity-30" />
          <h2 className="text-xl font-semibold mb-2 text-foreground">No Reports Found</h2>
          <p>No listings match your criteria. You can create a report if you lost or found an item.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md-grid-cols-2 lg-grid-cols-3 gap-6">
          {filteredReports.map((report) => {
            const color = report.type === "Lost" ? "var(--danger)" : "var(--success)";
            const isMine = report.user_id === +myId;
            const isResolved = report.status === 'resolved';

            return (
              <div key={report.id} className="card p-0 overflow-hidden flex flex-col relative" style={{ padding: 0, borderTop: `4px solid ${color}`, opacity: isResolved ? 0.6 : 1 }}>
                
                {/* Images */}
                <div className="aspect-4-3 image-container-blurred" style={{ backgroundImage: report.images && report.images.length > 0 ? `url(${report.images[0]})` : 'none' }}>
                  {report.images && report.images.length > 0 ? (
                    <Image src={report.images[0]} alt={report.title} fill className="next-image" sizes="(max-width: 768px) 100vw, 33vw" />
                  ) : (
                    <div className="flex justify-center items-center h-full opacity-50 text-muted relative z-10">
                      <ImageIcon size={48} />
                    </div>
                  )}
                  {isResolved && (
                    <div className="absolute inset-0 flex justify-center items-center z-10" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                      <div className="badge text-lg font-bold shadow-lg" style={{ backgroundColor: "var(--success)", color: "white" }}>RESOLVED</div>
                    </div>
                  )}
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-xl">{report.title}</h3>
                    <span className="badge" style={{ backgroundColor: `${color}33`, color: color }}>
                      {report.type}
                    </span>
                  </div>
                  
                  <p className="text-sm mb-4">{report.description}</p>
                  
                  <div className="flex flex-col gap-2 text-muted text-sm mb-6">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span>{report.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span>{report.time_date}</span>
                    </div>
                    <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                      <div>Reporter: <strong className="text-foreground">{report.reporter_name}</strong></div>
                      <div>Phone: <strong className="text-foreground">{report.contact_number}</strong></div>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-2">
                    {!isResolved && (
                      <a href={`mailto:${report.contact_email || report.reporter_email}`} className="btn w-full flex justify-center" style={{ border: '1px solid var(--border)' }}>
                        <MessageCircle size={16} /> Contact Reporter
                      </a>
                    )}
                    {isMine && !isResolved && (
                      <button className="btn w-full flex justify-center" style={{ backgroundColor: 'var(--success)', color: 'white' }} onClick={() => handleMarkResolved(report.id)}>
                        <CheckCircle size={16} /> Mark as Found/Resolved
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
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={() => setShowModal(false)}>
          <div className="card max-h-[90vh] overflow-y-auto" style={{ maxWidth: "600px", width: "100%" }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Report an Item</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}><X size={22} /></button>
            </div>

            <form onSubmit={handleCreateReport}>
              <div className="grid gap-4 mb-4 grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Report Type *</label>
                  <select className="form-input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="Lost">I Lost Something</option>
                    <option value="Found">I Found Something</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Item Title *</label>
                  <input type="text" className="form-input" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g., Black Wallet" />
                </div>
              </div>
              
              <div className="grid gap-4 mb-4 grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Location *</label>
                  <input type="text" className="form-input" required value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="e.g., Library 2nd Floor" />
                </div>
                <div className="form-group">
                  <label className="form-label">Time & Date *</label>
                  <input type="text" className="form-input" required value={form.time_date} onChange={e => setForm({...form, time_date: e.target.value})} placeholder="e.g., Oct 12, 10:30 AM" />
                </div>
              </div>

              <div className="grid gap-4 mb-4 grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Contact Number *</label>
                  <input type="text" className="form-input" required value={form.contact_number} onChange={e => setForm({...form, contact_number: e.target.value})} placeholder="e.g., 0712345678" />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Email</label>
                  <input type="email" className="form-input" value={form.contact_email} onChange={e => setForm({...form, contact_email: e.target.value})} placeholder="Optional" />
                </div>
              </div>

              <div className="form-group mb-4">
                <label className="form-label">Description *</label>
                <textarea className="form-input" rows={3} required value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Provide detailed description, identifying marks, etc."></textarea>
              </div>

              <div className="form-group mb-6">
                <label className="form-label">Images (Optional, Max 3)</label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center text-muted flex flex-col items-center justify-center cursor-pointer relative hover:border-primary transition-colors" style={{ backgroundColor: "var(--background)" }}>
                  <Upload size={24} className="mb-2" />
                  <span>Click to select images</span>
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
                  <div className="text-sm text-success mt-2 font-medium">
                    {files.length} file(s) selected
                  </div>
                )}
              </div>

              <button type="submit" disabled={formLoading} className="btn w-full justify-center" style={{ backgroundColor: 'var(--warning)', color: '#000' }}>
                {formLoading ? "Submitting..." : "Submit Report"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
