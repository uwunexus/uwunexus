"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Shield, Users, Calendar, Search, RefreshCw, CheckCircle, XCircle, Trash2, PlusCircle, Clock, MapPin, X, Upload, ChevronDown, Ticket, Store, EyeOff, BookOpen, Edit, AlertTriangle } from "lucide-react";
import { uploadToCloudinary } from "../lib/cloudinary";

/* ─── Types ──────────────────────────────────────────────────── */
interface User {
  id: number; full_name: string; email: string;
  enrollment_number: string; batch: string; degree: string;
  role: string; created_at: string;
}
interface Event {
  id: number; title: string; description: string;
  event_date: string; event_time: string; location: string;
  organized_by: string; category: string; image_url: string | null;
  status: string; created_by: number; creator_name: string;
}
interface TicketedEvent {
  id: number; title: string; description: string;
  event_date: string; event_time: string; venue: string; price: number;
  total_tickets: number; available_tickets: number; image_url: string;
  status: string; created_by: number; created_at: string;
}
interface InfoHubItem {
  id: number;
  category: string;
  title: string;
  description: string;
  contact_info: string;
  action_link: string;
  action_text: string;
}

/* ─── Constants ─────────────────────────────────────────────── */
const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  superadmin: { bg: "rgba(139,92,246,0.2)", color: "#8b5cf6" },
  clubadmin:  { bg: "rgba(59,130,246,0.2)",  color: "#3b82f6" },
  staff:      { bg: "rgba(234,179,8,0.2)",   color: "#eab308" },
  student:    { bg: "rgba(34,197,94,0.2)",   color: "#22c55e" },
};
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  approved: { bg: "rgba(34,197,94,0.2)",  color: "#22c55e" },
  pending:  { bg: "rgba(234,179,8,0.2)",  color: "#eab308" },
  rejected: { bg: "rgba(239,68,68,0.2)",  color: "#ef4444" },
};
const CATEGORIES = ["Academic", "Cultural", "Sports", "Club Activity", "Career", "Other"];

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}
function formatTime(t: string) {
  const [h, m] = t.split(":");
  const date = new Date(); date.setHours(+h, +m);
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

/* ─── Main Component ────────────────────────────────────────── */
export default function AdminPage() {
  const [tab, setTab] = useState<"users" | "events" | "tickets" | "marketplace" | "lost-found" | "info-hub">("users");

  /* auth from cookie */
  const [myId, setMyId] = useState("");
  const [myRole, setMyRole] = useState("");
  useEffect(() => {
    const parse = (n: string) =>
      document.cookie.split("; ").find(r => r.startsWith(n + "="))?.split("=")[1] ?? "";
    const role = parse("uwu_role");
    setMyId(parse("uwu_user_id"));
    setMyRole(role);
    if (role === "clubadmin") setTab("events");
  }, []);

  /* Custom Confirmation Dialog State */
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: (() => void) | null;
    isDestructive: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    isDestructive: false
  });

  const triggerConfirm = (title: string, message: string, onConfirm: () => void, isDestructive = false) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
      isDestructive
    });
  };

  /* ── Users Tab ────────────────────────────────────────────── */
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!myId) return;
    setUsersLoading(true);
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users.php?requester_id=${myId}`);
      const d = await r.json();
      if (d.success) setUsers(d.users);
    } finally { setUsersLoading(false); }
  }, [myId]);

  useEffect(() => { if (myId) fetchUsers(); }, [myId, fetchUsers]);

  const updateUserRole = async (targetId: number, newRole: string) => {
    setUpdatingUserId(targetId);
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/update_role.php`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requester_id: +myId, target_id: targetId, new_role: newRole }),
    });
    setUsers(prev => prev.map(u => u.id === targetId ? { ...u, role: newRole } : u));
    setUpdatingUserId(null);
  };

  const deleteUser = async (targetId: number) => {
    triggerConfirm("Delete User", "Are you sure you want to permanently delete this user? This cannot be undone.", async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/delete_user.php`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requester_id: +myId, target_id: targetId }),
        });
        const data = await res.json();
        if (data.success) {
          setUsers(prev => prev.filter(u => u.id !== targetId));
        } else {
          alert(data.message);
        }
      } catch (e) {
        alert("Error deleting user.");
      }
    }, true);
  };

  const filteredUsers = users.filter(u => {
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const q = userSearch.toLowerCase();
    return matchRole && (!q || u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.enrollment_number.toLowerCase().includes(q));
  });

  /* ── Events Tab ───────────────────────────────────────────── */
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventStatusFilter, setEventStatusFilter] = useState("all");
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!myId) return;
    setEventsLoading(true);
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/get_events.php?requester_id=${myId}&status=all`);
      const d = await r.json();
      if (d.success) setEvents(d.events);
    } finally { setEventsLoading(false); }
  }, [myId]);

  useEffect(() => { if (myId && tab === "events") fetchEvents(); }, [myId, tab, fetchEvents]);

  const updateEventStatus = async (eventId: number, status: string) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/update_event_status.php`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requester_id: +myId, event_id: eventId, status }),
    });
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status } : e));
  };

  const deleteEvent = async (eventId: number) => {
    triggerConfirm("Delete Event", "Are you sure you want to permanently delete this event?", async () => {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/delete_event.php`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requester_id: +myId, event_id: eventId }),
      });
      setEvents(prev => prev.filter(e => e.id !== eventId));
    }, true);
  };

  const filteredEvents = events.filter(e =>
    eventStatusFilter === "all" || e.status === eventStatusFilter
  );

  const eventStats = {
    total: events.length,
    approved: events.filter(e => e.status === "approved").length,
    pending: events.filter(e => e.status === "pending").length,
    rejected: events.filter(e => e.status === "rejected").length,
  };

  const userStats = {
    total: users.length,
    students: users.filter(u => u.role === "student").length,
    staff: users.filter(u => u.role === "staff").length,
    admins: users.filter(u => ["superadmin", "clubadmin"].includes(u.role)).length,
  };

  /* ── Tickets Tab ──────────────────────────────────────────── */
  const [tickets, setTickets] = useState<TicketedEvent[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketStatusFilter, setTicketStatusFilter] = useState("all");
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketedEvent | null>(null);
  const [ticketSubTab, setTicketSubTab] = useState<"events" | "purchases">("events");
  const [purchases, setPurchases] = useState<any[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);

  const fetchTickets = useCallback(async () => {
    if (!myId) return;
    setTicketsLoading(true);
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/get_ticketed_events.php?all=true`);
      const d = await r.json();
      if (d.success) setTickets(d.events);
    } finally { setTicketsLoading(false); }
  }, [myId]);

  const fetchPurchases = useCallback(async () => {
    if (!myId) return;
    setPurchasesLoading(true);
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/get_ticket_purchases.php?user_id=${myId}`);
      const d = await r.json();
      if (d.success) setPurchases(d.purchases);
    } finally { setPurchasesLoading(false); }
  }, [myId]);

  useEffect(() => { if (myId && tab === "tickets" && ticketSubTab === "events") fetchTickets(); }, [myId, tab, ticketSubTab, fetchTickets]);
  useEffect(() => { if (myId && tab === "tickets" && ticketSubTab === "purchases") fetchPurchases(); }, [myId, tab, ticketSubTab, fetchPurchases]);

  const updateTicketStatus = async (ticketId: number, status: string) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/update_ticket_status.php`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: +myId, id: ticketId, status }),
    });
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t));
  };

  const deleteTicket = async (ticketId: number) => {
    triggerConfirm("Delete Ticketed Event", "Are you sure you want to permanently delete this ticketed event?", async () => {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/delete_ticket_event.php`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: +myId, id: ticketId }),
      });
      setTickets(prev => prev.filter(t => t.id !== ticketId));
    }, true);
  };

  const filteredTickets = tickets.filter(t => ticketStatusFilter === "all" || t.status === ticketStatusFilter);

  const ticketStats = {
    total: tickets.length,
    active: tickets.filter(t => t.status === "active").length,
    closed: tickets.filter(t => t.status === "closed").length,
  };

  /* ── Marketplace Tab ──────────────────────────────────────────── */
  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);

  const fetchMarketplace = useCallback(async () => {
    if (!myId) return;
    setMarketplaceLoading(true);
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/get_marketplace_items.php?admin=true`);
      const d = await r.json();
      if (d.success) setMarketplaceItems(d.items);
    } finally { setMarketplaceLoading(false); }
  }, [myId]);

  useEffect(() => { if (myId && tab === "marketplace") fetchMarketplace(); }, [myId, tab, fetchMarketplace]);

  const updateMarketplaceStatus = async (itemId: number, action: string) => {
    const title = action === "delete" ? "Delete Item" : `${action.charAt(0).toUpperCase() + action.slice(1)} Item`;
    const message = `Are you sure you want to ${action} this item?`;
    const isDestructive = action === "delete" || action === "reject";
    triggerConfirm(title, message, async () => {
      try {
        const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin_delete_marketplace_item.php`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item_id: itemId, user_id: +myId, action })
        });
        const d = await r.json();
        if (d.success) {
          if (action === "delete") {
            setMarketplaceItems(prev => prev.filter(i => i.id !== itemId));
          } else {
            const newStatus = action === "approve" ? "active" : action === "reject" ? "rejected" : "hidden";
            setMarketplaceItems(prev => prev.map(i => i.id === itemId ? { ...i, status: newStatus } : i));
          }
        } else {
          alert(d.message);
        }
      } catch (e) {
        alert("Error updating marketplace item.");
      }
    }, isDestructive);
  };

  /* ── Lost & Found Tab ──────────────────────────────────────────── */
  const [lostFoundItems, setLostFoundItems] = useState<any[]>([]);
  const [lostFoundLoading, setLostFoundLoading] = useState(false);

  const fetchLostFound = useCallback(async () => {
    if (!myId) return;
    setLostFoundLoading(true);
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/get_lost_found.php`);
      const d = await r.json();
      if (d.success) setLostFoundItems(d.items);
    } finally { setLostFoundLoading(false); }
  }, [myId]);

  useEffect(() => { if (myId && tab === "lost-found") fetchLostFound(); }, [myId, tab, fetchLostFound]);

  const deleteLostFoundItem = async (itemId: number) => {
    triggerConfirm("Delete Report", "Are you sure you want to permanently delete this report?", async () => {
      try {
        const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/delete_lost_found.php`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: itemId, user_id: +myId })
        });
        const d = await r.json();
        if (d.success) {
          setLostFoundItems(prev => prev.filter(i => i.id !== itemId));
        } else {
          alert(d.message);
        }
      } catch (e) {
        alert("Error deleting item.");
      }
    }, true);
  };

  /* ── Info Hub Tab ────────────────────────────────────────────── */
  const [infoHubItems, setInfoHubItems] = useState<any[]>([]);
  const [infoHubLoading, setInfoHubLoading] = useState(false);
  const [showInfoHubModal, setShowInfoHubModal] = useState(false);
  const [editingInfoHub, setEditingInfoHub] = useState<InfoHubItem | null>(null);

  const fetchInfoHub = useCallback(async () => {
    setInfoHubLoading(true);
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/get_info_hub.php`);
      const d = await r.json();
      if (d.success) setInfoHubItems(d.items);
    } finally { setInfoHubLoading(false); }
  }, []);

  useEffect(() => { if (myId && tab === "info-hub") fetchInfoHub(); }, [myId, tab, fetchInfoHub]);

  const deleteInfoHubItem = async (itemId: number) => {
    triggerConfirm("Delete Info Hub Item", "Are you sure you want to permanently delete this Info Hub item?", async () => {
      try {
        const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/delete_info_hub.php`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: itemId, user_id: +myId })
        });
        const d = await r.json();
        if (d.success) {
          setInfoHubItems(prev => prev.filter(i => i.id !== itemId));
        } else {
          alert(d.message);
        }
      } catch (e) {
        alert("Error deleting item.");
      }
    }, true);
  };

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="container relative min-h-screen" style={{ maxWidth: '1210px', marginTop: '1.5rem', paddingLeft: '0', paddingRight: '0', paddingBottom: '4rem' }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1.5rem" }}>
        <div>
          <h1 style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontSize: "3.2rem",
            fontWeight: 700,
            color: "#000000",
            letterSpacing: "-0.02em",
            marginBottom: "0.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem"
          }}>
            <Shield size={40} style={{ color: "#000000" }} />
            Admin Panel
          </h1>
          <p style={{
            fontFamily: "var(--font-roboto), sans-serif",
            fontSize: "1.05rem",
            color: "#64748b",
            margin: 0,
            lineHeight: "1.6"
          }}>
            Manage users , events , tickets , marketplace , lost & found , info hub
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginTop: "1rem" }}>
          {tab === "events" && ["superadmin", "clubadmin"].includes(myRole) && (
            <button 
              onClick={() => { setEditingEvent(null); setShowEventModal(true); }}
              style={{
                backgroundColor: "#000c66",
                color: "#ffffff",
                fontFamily: "var(--font-roboto), sans-serif",
                fontWeight: 600,
                borderRadius: "9999px",
                padding: "0.6rem 1.5rem",
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              <PlusCircle size={18} /> Create Event
            </button>
          )}
          {tab === "tickets" && ["superadmin", "clubadmin"].includes(myRole) && (
            <button 
              onClick={() => { setEditingTicket(null); setShowTicketModal(true); }}
              style={{
                backgroundColor: "#000c66",
                color: "#ffffff",
                fontFamily: "var(--font-roboto), sans-serif",
                fontWeight: 600,
                borderRadius: "9999px",
                padding: "0.6rem 1.5rem",
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              <PlusCircle size={18} /> Create Ticket
            </button>
          )}
          {tab === "info-hub" && ["superadmin"].includes(myRole) && (
            <button 
              onClick={() => { setEditingInfoHub(null); setShowInfoHubModal(true); }}
              style={{
                backgroundColor: "#000c66",
                color: "#ffffff",
                fontFamily: "var(--font-roboto), sans-serif",
                fontWeight: 600,
                borderRadius: "9999px",
                padding: "0.6rem 1.5rem",
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              <PlusCircle size={18} /> Add Info Hub Item
            </button>
          )}
        </div>
      </div>

      {/* Control Bar (Tabs Switcher & Refresh Button) */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1.5rem",
        flexWrap: "wrap",
        marginBottom: "2rem"
      }}>
        {/* Tab Switcher Capsule */}
        <div style={{
          display: "flex",
          alignItems: "center",
          height: "48px",
          backgroundColor: "#e6effd",
          borderRadius: "9999px",
          padding: "4px",
          gap: "4px",
          boxSizing: "border-box",
          border: "1.5px solid rgba(0, 12, 102, 0.2)"
        }}>
          {[
            { key: "users", label: "Users", icon: <Users size={16} />, adminOnly: true }, 
            { key: "events", label: "Events", icon: <Calendar size={16} /> },
            { key: "tickets", label: "Tickets", icon: <Ticket size={16} /> },
            { key: "marketplace", label: "Marketplace", icon: <Store size={16} />, adminOnly: true },
            { key: "lost-found", label: "Lost & Found", icon: <Search size={16} />, adminOnly: true },
            { key: "info-hub", label: "Info Hub", icon: <BookOpen size={16} />, adminOnly: true }
          ].filter(t => myRole === "superadmin" || !t.adminOnly).map(t => (
            <button 
              key={t.key} 
              onClick={() => setTab(t.key as any)}
              style={{
                border: "none",
                backgroundColor: tab === t.key ? "#000c66" : "transparent",
                color: tab === t.key ? "#ffffff" : "#000c66",
                borderRadius: "9999px",
                height: "100%",
                padding: "0 1.25rem",
                fontFamily: "var(--font-roboto), sans-serif",
                fontWeight: 500,
                fontSize: "0.9rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.2s"
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Refresh Button */}
        <button 
          onClick={tab === "users" ? fetchUsers : tab === "events" ? fetchEvents : fetchTickets}
          style={{
            height: "48px",
            backgroundColor: "#ffffff",
            border: "1.5px solid #d1d5db",
            borderRadius: "9999px",
            padding: "0 1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            cursor: "pointer",
            fontFamily: "var(--font-roboto), sans-serif",
            fontWeight: 500,
            color: "#505255",
            transition: "all 0.2s"
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = "#f3f4f6";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = "#ffffff";
          }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* ── USERS TAB ── */}
      {tab === "users" && (
        <>
          {/* Stats */}
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
            {[
              { label: "Total users", value: userStats.total },
              { label: "Students", value: userStats.students },
              { label: "Staff", value: userStats.staff },
              { label: "Admins", value: userStats.admins },
            ].map(s => (
              <div key={s.label} style={{
                flex: "1 1 calc((100% - 4.5rem) / 4)",
                minWidth: "180px",
                backgroundColor: "#edf4fe",
                borderRadius: "1.5rem",
                padding: "1.25rem 1.5rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                border: "1px solid rgba(0, 12, 102, 0.1)"
              }}>
                <div style={{
                  backgroundColor: "#000c66",
                  borderRadius: "9999px",
                  padding: "0.4rem 1.5rem",
                  color: "#ffffff",
                  fontFamily: "var(--font-syne), sans-serif",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  textAlign: "center",
                  marginBottom: "0.75rem",
                  whiteSpace: "nowrap"
                }}>
                  {s.label}
                </div>
                <div style={{
                  fontSize: "2.5rem",
                  fontWeight: 800,
                  color: "#000000",
                  fontFamily: "var(--font-syne), sans-serif",
                  lineHeight: "1.2"
                }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1.5rem",
            flexWrap: "wrap",
            marginBottom: "2rem"
          }}>
            <div style={{ position: "relative", width: "100%", maxWidth: "400px" }}>
              <Search 
                size={18} 
                style={{
                  position: "absolute",
                  left: "1.25rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                  pointerEvents: "none"
                }} 
              />
              <input 
                type="text" 
                placeholder="Search users..." 
                value={userSearch} 
                onChange={e => setUserSearch(e.target.value)} 
                style={{
                  width: "100%",
                  height: "48px",
                  borderRadius: "9999px",
                  border: "1.5px solid #d1d5db",
                  backgroundColor: "#ffffff",
                  padding: "0 1.5rem 0 3rem",
                  fontSize: "0.95rem",
                  fontFamily: "var(--font-roboto), sans-serif",
                  fontWeight: 400,
                  color: "#000000",
                  outline: "none"
                }}
              />
            </div>
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
              <select 
                value={roleFilter} 
                onChange={e => setRoleFilter(e.target.value)}
                style={{
                  height: "48px",
                  backgroundColor: "#e6effd",
                  color: "#000c66",
                  border: "1.5px solid rgba(0, 12, 102, 0.2)",
                  borderRadius: "9999px",
                  padding: "0 2.5rem 0 1.5rem",
                  fontFamily: "var(--font-roboto), sans-serif",
                  fontWeight: 500,
                  fontSize: "0.95rem",
                  appearance: "none",
                  WebkitAppearance: "none",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                <option value="all">All Roles</option>
                <option value="student">Student</option>
                <option value="staff">Staff</option>
                <option value="clubadmin">Club Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
              <ChevronDown size={16} style={{ color: "#000c66", position: "absolute", right: "1rem", pointerEvents: "none" }} />
            </div>
          </div>

          {/* Table */}
          <div style={{
            border: "1.5px solid rgba(0, 12, 102, 0.15)",
            borderRadius: "1.5rem",
            overflow: "hidden",
            backgroundColor: "#ffffff",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
          }}>
            {usersLoading ? <div className="p-12 text-center text-muted">Loading users...</div> :
              filteredUsers.length === 0 ? <div className="p-12 text-center text-muted">No users found.</div> : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ backgroundColor: "#edf4fe", borderBottom: "1.5px solid rgba(0, 12, 102, 0.15)" }}>
                      <tr>
                        {["No", "Full Name", "Email", "Enrollment No.", "Batch", "Degree", "Role", ...(myRole === "superadmin" ? ["Actions"] : [])].map(h => (
                          <th key={h} style={{
                            padding: "1rem 1.25rem",
                            textAlign: "left",
                            fontFamily: "var(--font-roboto), sans-serif",
                            fontWeight: 600,
                            fontSize: "0.95rem",
                            color: "#000c66",
                            whiteSpace: "nowrap"
                          }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user, i) => {
                        const rc = user.role === "superadmin" ? { bg: "#f3e8ff", text: "#7c3aed" } :
                                   user.role === "clubadmin" ? { bg: "#e0f2fe", text: "#0369a1" } :
                                   user.role === "staff" ? { bg: "#fef3c7", text: "#b45309" } :
                                   { bg: "#e8f5e9", text: "#00875a" }; // student
                        return (
                          <tr key={user.id} style={{ borderBottom: "1px solid rgba(0, 12, 102, 0.1)" }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(0, 12, 102, 0.02)")}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}>
                            <td style={{ padding: "1rem 1.25rem", color: "#64748b", fontFamily: "var(--font-roboto), sans-serif", fontSize: "0.95rem" }}>{i + 1}</td>
                            <td style={{ padding: "1rem 1.25rem", fontWeight: 600, color: "#000000", fontFamily: "var(--font-roboto), sans-serif", fontSize: "0.95rem" }}>{user.full_name}</td>
                            <td style={{ padding: "1rem 1.25rem", color: "#64748b", fontFamily: "var(--font-roboto), sans-serif", fontSize: "0.95rem" }}>{user.email}</td>
                            <td style={{ padding: "1rem 1.25rem", color: "#000000", fontFamily: "var(--font-roboto), sans-serif", fontSize: "0.95rem" }}>{user.enrollment_number}</td>
                            <td style={{ padding: "1rem 1.25rem", color: "#000000", fontFamily: "var(--font-roboto), sans-serif", fontSize: "0.95rem" }}>{user.batch}</td>
                            <td style={{ padding: "1rem 1.25rem", color: "#000000", fontFamily: "var(--font-roboto), sans-serif", fontSize: "0.95rem" }}>{user.degree}</td>
                            <td style={{ padding: "1rem 1.25rem" }}>
                              <span style={{ 
                                backgroundColor: rc.bg, 
                                color: rc.text, 
                                borderRadius: "9999px",
                                padding: "0.25rem 1rem",
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                textTransform: "capitalize",
                                display: "inline-block",
                                fontFamily: "var(--font-roboto), sans-serif"
                              }}>
                                {user.role === "superadmin" ? "SuperAdmin" : user.role === "clubadmin" ? "ClubAdmin" : user.role}
                              </span>
                            </td>
                            {myRole === "superadmin" && (
                              <td style={{ padding: "1rem 1.25rem" }}>
                                {user.id === +myId ? <span style={{ color: "#64748b", fontSize: "0.95rem", fontFamily: "var(--font-roboto), sans-serif" }}>You</span> : (
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                                      <select 
                                        style={{ 
                                          height: "36px",
                                          backgroundColor: "#e6effd",
                                          color: "#000c66",
                                          border: "1.5px solid rgba(0, 12, 102, 0.2)",
                                          borderRadius: "9999px",
                                          padding: "0 2rem 0 1rem",
                                          fontFamily: "var(--font-roboto), sans-serif",
                                          fontWeight: 500,
                                          fontSize: "0.9rem",
                                          cursor: "pointer",
                                          outline: "none",
                                          appearance: "none",
                                          WebkitAppearance: "none"
                                        }}
                                        value={user.role} 
                                        disabled={updatingUserId === user.id}
                                        onChange={e => updateUserRole(user.id, e.target.value)}
                                      >
                                        <option value="student">Student</option>
                                        <option value="staff">Staff</option>
                                        <option value="clubadmin">Club Admin</option>
                                        <option value="superadmin">Super Admin</option>
                                      </select>
                                      <ChevronDown size={14} style={{ color: "#000c66", position: "absolute", right: "0.75rem", pointerEvents: "none" }} />
                                    </div>
                                    <button 
                                      onClick={() => deleteUser(user.id)} 
                                      title="Delete User" 
                                      style={{ 
                                        backgroundColor: "#d32f2f", 
                                        color: "#ffffff", 
                                        border: "none", 
                                        borderRadius: "50%", 
                                        width: "36px", 
                                        height: "36px", 
                                        display: "inline-flex", 
                                        alignItems: "center", 
                                        justifyContent: "center",
                                        cursor: "pointer",
                                        transition: "transform 0.1s"
                                      }}
                                      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                                      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        </>
      )}

      {/* ── EVENTS TAB ── */}
      {tab === "events" && (
        <>
          {/* Stats */}
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
            {[
              { label: "Total Events", value: eventStats.total },
              { label: "Approved", value: eventStats.approved },
              { label: "Pending", value: eventStats.pending },
              { label: "Rejected", value: eventStats.rejected },
            ].map(s => (
              <div key={s.label} style={{
                flex: "1 1 calc((100% - 4.5rem) / 4)",
                minWidth: "180px",
                backgroundColor: "#edf4fe",
                borderRadius: "1.5rem",
                padding: "1.25rem 1.5rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                border: "1px solid rgba(0, 12, 102, 0.1)"
              }}>
                <div style={{
                  backgroundColor: "#000c66",
                  borderRadius: "9999px",
                  padding: "0.4rem 1.5rem",
                  color: "#ffffff",
                  fontFamily: "var(--font-syne), sans-serif",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  textAlign: "center",
                  marginBottom: "0.75rem",
                  whiteSpace: "nowrap"
                }}>
                  {s.label}
                </div>
                <div style={{
                  fontSize: "2.5rem",
                  fontWeight: 800,
                  color: "#000000",
                  fontFamily: "var(--font-syne), sans-serif",
                  lineHeight: "1.2"
                }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {/* Status filter */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
            {["all", "approved", "pending", "rejected"].map(s => (
              <button key={s} onClick={() => setEventStatusFilter(s)}
                style={{
                  padding: "0.4rem 1.25rem",
                  backgroundColor: eventStatusFilter === s ? "#000c66" : "transparent",
                  color: eventStatusFilter === s ? "#ffffff" : "#000c66",
                  border: eventStatusFilter === s ? "none" : "1.5px solid #000c66",
                  borderRadius: "9999px",
                  cursor: "pointer",
                  fontFamily: "var(--font-roboto), sans-serif",
                  fontWeight: 500,
                  textTransform: "capitalize",
                  fontSize: "0.9rem",
                  transition: "all 0.2s"
                }}>
                {s === "all" ? "All Events" : s}
              </button>
            ))}
          </div>

          {/* Events list */}
          {eventsLoading ? <div className="p-12 text-center text-muted">Loading events...</div> :
            filteredEvents.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "4rem 2rem",
                backgroundColor: "#ffffff",
                borderRadius: "1.5rem",
                border: "1.5px solid rgba(0, 12, 102, 0.15)",
                color: "#64748b"
              }}>
                <Calendar size={48} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
                <p>No events found.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {filteredEvents.map(event => {
                  const scColor = event.status === "approved" ? { bg: "#e8f5e9", text: "#00875a" } :
                                  event.status === "rejected" ? { bg: "#ffebee", text: "#d32f2f" } :
                                  { bg: "#fef3c7", text: "#b45309" }; // pending
                  return (
                    <div key={event.id} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1.5rem",
                      backgroundColor: "#ffffff",
                      borderRadius: "1.5rem",
                      padding: "1.25rem 1.5rem",
                      border: "1.5px solid rgba(0, 12, 102, 0.12)",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                      flexWrap: "wrap"
                    }}>
                      {/* Thumbnail */}
                      <div style={{ width: "120px", height: "80px", borderRadius: "1rem", overflow: "hidden", flexShrink: 0, backgroundColor: "#f3f4f6", position: "relative" }}>
                        {event.image_url ? (
                          <Image src={event.image_url} alt={event.title} fill sizes="120px" style={{ objectFit: "cover" }} />
                        ) : (
                          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Calendar size={32} style={{ color: "#94a3b8" }} />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: "1 1 200px" }}>
                        <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#000000", fontFamily: "var(--font-roboto), sans-serif", marginBottom: "0.25rem" }}>{event.title}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", fontSize: "0.85rem", color: "#64748b", fontFamily: "var(--font-roboto), sans-serif" }}>
                          <span className="flex items-center gap-1"><Calendar size={13} /> {formatDate(event.event_date)}</span>
                          <span className="flex items-center gap-1"><Clock size={13} /> {formatTime(event.event_time)}</span>
                          <span className="flex items-center gap-1"><MapPin size={13} /> {event.location}</span>
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "#64748b", fontFamily: "var(--font-roboto), sans-serif", marginTop: "4px" }}>
                          By: <strong style={{ color: "#000000" }}>{event.creator_name}</strong> · {event.category}
                        </div>
                      </div>

                      {/* Status badge */}
                      <span style={{ 
                        backgroundColor: scColor.bg, 
                        color: scColor.text, 
                        borderRadius: "9999px",
                        padding: "0.25rem 1rem",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        textTransform: "capitalize",
                        fontFamily: "var(--font-roboto), sans-serif"
                      }}>
                        {event.status}
                      </span>

                      {/* Actions (superadmin only) */}
                      {myRole === "superadmin" && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          {event.status !== "approved" && (
                            <button onClick={() => updateEventStatus(event.id, "approved")}
                              style={{
                                backgroundColor: "#edf4fe",
                                color: "#00875a",
                                border: "1.5px solid rgba(0, 135, 90, 0.2)",
                                borderRadius: "9999px",
                                padding: "0.4rem 1.25rem",
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                fontFamily: "var(--font-roboto), sans-serif",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.4rem"
                              }}>
                              <CheckCircle size={14} /> Approve
                            </button>
                          )}
                          {event.status !== "rejected" && (
                            <button onClick={() => updateEventStatus(event.id, "rejected")}
                              style={{
                                backgroundColor: "#ffebee",
                                color: "#d32f2f",
                                border: "1.5px solid rgba(211, 47, 47, 0.2)",
                                borderRadius: "9999px",
                                padding: "0.4rem 1.25rem",
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                fontFamily: "var(--font-roboto), sans-serif",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.4rem"
                              }}>
                              <XCircle size={14} /> Reject
                            </button>
                          )}
                          <button onClick={() => { setEditingEvent(event); setShowEventModal(true); }}
                            style={{
                              backgroundColor: "#e6effd",
                              color: "#000c66",
                              border: "1.5px solid rgba(0, 12, 102, 0.2)",
                              borderRadius: "9999px",
                              padding: "0.4rem 1.25rem",
                              fontSize: "0.85rem",
                              fontWeight: 600,
                              fontFamily: "var(--font-roboto), sans-serif",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.4rem"
                            }}>
                            <Edit size={14} /> Edit
                          </button>
                          <button onClick={() => deleteEvent(event.id)}
                            title="Delete Event"
                            style={{ 
                              backgroundColor: "#d32f2f", 
                              color: "#ffffff", 
                              border: "none", 
                              borderRadius: "50%", 
                              width: "36px", 
                              height: "36px", 
                              display: "inline-flex", 
                              alignItems: "center", 
                              justifyContent: "center",
                              cursor: "pointer",
                              transition: "transform 0.1s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
        </>
      )}

      {/* ── TICKETS TAB ── */}
      {tab === "tickets" && (
        <>
          {/* Sub Navigation */}
          {/* Sub Navigation Switcher */}
          <div style={{
            display: "flex",
            alignItems: "center",
            height: "40px",
            backgroundColor: "#e6effd",
            borderRadius: "9999px",
            padding: "4px",
            gap: "4px",
            boxSizing: "border-box",
            border: "1.5px solid rgba(0, 12, 102, 0.2)",
            alignSelf: "flex-start",
            marginBottom: "1.5rem"
          }}>
            <button 
              onClick={() => setTicketSubTab("events")}
              style={{
                border: "none",
                backgroundColor: ticketSubTab === "events" ? "#000c66" : "transparent",
                color: ticketSubTab === "events" ? "#ffffff" : "#000c66",
                borderRadius: "9999px",
                height: "100%",
                padding: "0 1.25rem",
                fontFamily: "var(--font-roboto), sans-serif",
                fontWeight: 500,
                fontSize: "0.85rem",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              Manage Events
            </button>
            <button 
              onClick={() => setTicketSubTab("purchases")}
              style={{
                border: "none",
                backgroundColor: ticketSubTab === "purchases" ? "#000c66" : "transparent",
                color: ticketSubTab === "purchases" ? "#ffffff" : "#000c66",
                borderRadius: "9999px",
                height: "100%",
                padding: "0 1.25rem",
                fontFamily: "var(--font-roboto), sans-serif",
                fontWeight: 500,
                fontSize: "0.85rem",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              Purchased Tickets
            </button>
          </div>

          {ticketSubTab === "events" && (
            <>
              {/* Stats */}
              <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
                {[
                  { label: "Total Event Tickets", value: ticketStats.total },
                  { label: "Active", value: ticketStats.active },
                  { label: "Closed", value: ticketStats.closed },
                ].map(s => (
                  <div key={s.label} style={{
                    flex: "1 1 calc((100% - 3rem) / 3)",
                    minWidth: "200px",
                    backgroundColor: "#edf4fe",
                    borderRadius: "1.5rem",
                    padding: "1.25rem 1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                    border: "1px solid rgba(0, 12, 102, 0.1)"
                  }}>
                    <div style={{
                      backgroundColor: "#000c66",
                      borderRadius: "9999px",
                      padding: "0.4rem 1.5rem",
                      color: "#ffffff",
                      fontFamily: "var(--font-syne), sans-serif",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      textAlign: "center",
                      marginBottom: "0.75rem",
                      whiteSpace: "nowrap"
                    }}>
                      {s.label}
                    </div>
                    <div style={{
                      fontSize: "2.5rem",
                      fontWeight: 800,
                      color: "#000000",
                      fontFamily: "var(--font-syne), sans-serif",
                      lineHeight: "1.2"
                    }}>
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Status filter */}
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                {["all", "active", "closed"].map(s => (
                  <button key={s} onClick={() => setTicketStatusFilter(s)}
                    style={{
                      padding: "0.4rem 1.25rem",
                      backgroundColor: ticketStatusFilter === s ? "#000c66" : "transparent",
                      color: ticketStatusFilter === s ? "#ffffff" : "#000c66",
                      border: ticketStatusFilter === s ? "none" : "1.5px solid #000c66",
                      borderRadius: "9999px",
                      cursor: "pointer",
                      fontFamily: "var(--font-roboto), sans-serif",
                      fontWeight: 500,
                      textTransform: "capitalize",
                      fontSize: "0.9rem",
                      transition: "all 0.2s"
                    }}>
                    {s === "all" ? "All Tickets" : s}
                  </button>
                ))}
              </div>

              {/* Tickets list */}
              {ticketsLoading ? <div className="p-12 text-center text-muted">Loading tickets...</div> :
                filteredTickets.length === 0 ? (
                  <div style={{
                    textAlign: "center",
                    padding: "4rem 2rem",
                    backgroundColor: "#ffffff",
                    borderRadius: "1.5rem",
                    border: "1.5px solid rgba(0, 12, 102, 0.15)",
                    color: "#64748b"
                  }}>
                    <Ticket size={48} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
                    <p>No ticketed events found.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {filteredTickets.map(ticket => {
                      return (
                        <div key={ticket.id} style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "1.5rem",
                          backgroundColor: "#ffffff",
                          borderRadius: "1.5rem",
                          padding: "1.25rem 1.5rem",
                          border: "1.5px solid rgba(0, 12, 102, 0.12)",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                          flexWrap: "wrap"
                        }}>
                          {/* Thumbnail */}
                          <div style={{ width: "120px", height: "80px", borderRadius: "1rem", overflow: "hidden", flexShrink: 0, backgroundColor: "#f3f4f6", position: "relative" }}>
                            {ticket.image_url ? (
                              <Image src={ticket.image_url} alt={ticket.title} fill sizes="120px" style={{ objectFit: "cover" }} />
                            ) : (
                              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Ticket size={32} style={{ color: "#94a3b8" }} />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div style={{ flex: "1 1 200px" }}>
                            <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#000000", fontFamily: "var(--font-roboto), sans-serif", marginBottom: "0.25rem" }}>{ticket.title}</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", fontSize: "0.85rem", color: "#64748b", fontFamily: "var(--font-roboto), sans-serif" }}>
                              <span className="flex items-center gap-1"><Calendar size={13} /> {formatDate(ticket.event_date)}</span>
                              <span className="flex items-center gap-1"><Clock size={13} /> {formatTime(ticket.event_time)}</span>
                              <span className="flex items-center gap-1"><MapPin size={13} /> {ticket.venue}</span>
                            </div>
                            <div style={{ fontSize: "0.85rem", color: "#64748b", fontFamily: "var(--font-roboto), sans-serif", marginTop: "4px" }}>
                              Price: <strong style={{ color: "#000c66" }}>LKR {Number(ticket.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> · {ticket.available_tickets} / {ticket.total_tickets} tickets left
                            </div>
                          </div>

                          {/* Status badge */}
                          <span style={{ 
                            backgroundColor: ticket.status === "active" ? "#e8f5e9" : "#e0e0e0", 
                            color: ticket.status === "active" ? "#00875a" : "#64748b", 
                            borderRadius: "9999px",
                            padding: "0.25rem 1rem",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            textTransform: "capitalize",
                            fontFamily: "var(--font-roboto), sans-serif"
                          }}>
                            {ticket.status}
                          </span>

                          {/* Actions (superadmin only) */}
                          {myRole === "superadmin" && (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                              {ticket.status === "active" ? (
                                <button onClick={() => updateTicketStatus(ticket.id, "closed")}
                                  style={{
                                    backgroundColor: "#ffebee",
                                    color: "#d32f2f",
                                    border: "1.5px solid rgba(211, 47, 47, 0.2)",
                                    borderRadius: "9999px",
                                    padding: "0.4rem 1.25rem",
                                    fontSize: "0.85rem",
                                    fontWeight: 600,
                                    fontFamily: "var(--font-roboto), sans-serif",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.4rem"
                                  }}>
                                  <XCircle size={14} /> Close Sales
                                </button>
                              ) : (
                                <button onClick={() => updateTicketStatus(ticket.id, "active")}
                                  style={{
                                    backgroundColor: "#edf4fe",
                                    color: "#00875a",
                                    border: "1.5px solid rgba(0, 135, 90, 0.2)",
                                    borderRadius: "9999px",
                                    padding: "0.4rem 1.25rem",
                                    fontSize: "0.85rem",
                                    fontWeight: 600,
                                    fontFamily: "var(--font-roboto), sans-serif",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.4rem"
                                  }}>
                                  <CheckCircle size={14} /> Reopen
                                </button>
                              )}
                              <button onClick={() => { setEditingTicket(ticket); setShowTicketModal(true); }}
                                style={{
                                  backgroundColor: "#e6effd",
                                  color: "#000c66",
                                  border: "1.5px solid rgba(0, 12, 102, 0.2)",
                                  borderRadius: "9999px",
                                  padding: "0.4rem 1.25rem",
                                  fontSize: "0.85rem",
                                  fontWeight: 600,
                                  fontFamily: "var(--font-roboto), sans-serif",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.4rem"
                                }}>
                                <Edit size={14} /> Edit
                              </button>
                              <button onClick={() => deleteTicket(ticket.id)}
                                title="Delete Ticket"
                                style={{ 
                                  backgroundColor: "#d32f2f", 
                                  color: "#ffffff", 
                                  border: "none", 
                                  borderRadius: "50%", 
                                  width: "36px", 
                                  height: "36px", 
                                  display: "inline-flex", 
                                  alignItems: "center", 
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  transition: "transform 0.1s"
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
            </>
          )}

          {ticketSubTab === "purchases" && (
            <div style={{
              border: "1.5px solid rgba(0, 12, 102, 0.15)",
              borderRadius: "1.5rem",
              overflow: "hidden",
              backgroundColor: "#ffffff",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
            }}>
              {purchasesLoading ? (
                <div style={{ padding: "3rem 1.5rem", textAlign: "center", color: "#64748b" }}>Loading purchases...</div>
              ) : purchases.length === 0 ? (
                <div style={{ padding: "3rem 1.5rem", textAlign: "center", color: "#64748b" }}>No purchases found.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                    <thead style={{ backgroundColor: "#edf4fe", borderBottom: "1.5px solid rgba(0, 12, 102, 0.15)" }}>
                      <tr>
                        {["Order ID", "Event", "Customer", "Contact", "Amount", "Status", "Date"].map(h => (
                          <th key={h} style={{
                            padding: "1rem 1.25rem",
                            fontFamily: "var(--font-roboto), sans-serif",
                            fontWeight: 600,
                            fontSize: "0.95rem",
                            color: "#000c66",
                            whiteSpace: "nowrap"
                          }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {purchases.map(p => (
                        <tr key={p.id} style={{ borderBottom: "1px solid rgba(0, 12, 102, 0.1)" }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(0, 12, 102, 0.02)")}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}>
                          <td style={{ padding: "1rem 1.25rem", fontWeight: 600, color: "#000000", fontFamily: "var(--font-roboto), sans-serif", fontSize: "0.95rem" }}>{p.order_id}</td>
                          <td style={{ padding: "1rem 1.25rem", color: "#000000", fontFamily: "var(--font-roboto), sans-serif", fontSize: "0.95rem" }}>{p.event_title}</td>
                          <td style={{ padding: "1rem 1.25rem", fontWeight: 500, color: "#000000", fontFamily: "var(--font-roboto), sans-serif", fontSize: "0.95rem" }}>{p.customer_name}</td>
                          <td style={{ padding: "1rem 1.25rem", color: "#64748b", fontFamily: "var(--font-roboto), sans-serif", fontSize: "0.95rem" }}>
                            <div>{p.customer_email}</div>
                            <div style={{ fontSize: "0.85rem", marginTop: "2px" }}>{p.customer_phone}</div>
                          </td>
                          <td style={{ padding: "1rem 1.25rem", fontWeight: 600, color: "#000000", fontFamily: "var(--font-roboto), sans-serif", fontSize: "0.95rem" }}>{p.currency} {parseFloat(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td style={{ padding: "1rem 1.25rem" }}>
                            <span style={{
                              backgroundColor: p.status === "success" ? "#e8f5e9" : p.status === "pending" ? "#fef3c7" : "#ffebee",
                              color: p.status === "success" ? "#00875a" : p.status === "pending" ? "#b45309" : "#d32f2f",
                              padding: "0.25rem 0.75rem", 
                              borderRadius: "9999px",
                              fontSize: "0.85rem",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              display: "inline-block",
                              fontFamily: "var(--font-roboto), sans-serif"
                            }}>
                              {p.status}
                            </span>
                          </td>
                          <td style={{ padding: "1rem 1.25rem", color: "#64748b", fontFamily: "var(--font-roboto), sans-serif", fontSize: "0.95rem" }}>{new Date(p.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── MARKETPLACE TAB ── */}
      {tab === "marketplace" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <Store size={28} style={{ color: "#000c66" }} />
            <h2 style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontSize: "1.8rem",
              fontWeight: 700,
              color: "#000c66",
              margin: 0
            }}>
              Marketplace Moderation
            </h2>
          </div>

          <div style={{
            border: "1.5px solid rgba(0, 12, 102, 0.15)",
            borderRadius: "1.5rem",
            overflow: "hidden",
            backgroundColor: "#ffffff",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
            marginBottom: "2.5rem"
          }}>
            {marketplaceLoading ? (
              <div className="p-8 text-center text-muted">Loading items...</div>
            ) : marketplaceItems.length === 0 ? (
              <div className="p-8 text-center text-muted">No items found.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead style={{ backgroundColor: "#edf4fe", borderBottom: "1.5px solid rgba(0, 12, 102, 0.15)" }}>
                    <tr>
                      {["Item", "Price", "Seller", "Status", "Actions"].map(h => (
                        <th key={h} style={{
                          padding: "1rem 1.25rem",
                          fontFamily: "var(--font-roboto), sans-serif",
                          fontWeight: 600,
                          fontSize: "0.95rem",
                          color: "#000c66",
                          whiteSpace: "nowrap"
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {marketplaceItems.map(item => {
                      const isHidden = item.status === "hidden";
                      const isActive = item.status === "active" || item.status === "approved";
                      const isPending = item.status === "pending";

                      const statusColor = isHidden ? { bg: "#94a3b8", text: "#ffffff", label: "Hidden" } :
                                          isActive ? { bg: "#4caf50", text: "#ffffff", label: "Active" } :
                                          { bg: "#f59e0b", text: "#ffffff", label: "Pending" };

                      return (
                        <tr key={item.id} style={{ borderBottom: "1px solid rgba(0, 12, 102, 0.1)" }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(0, 12, 102, 0.02)")}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}>
                          <td style={{ padding: "1rem 1.25rem" }}>
                            <div style={{ fontWeight: 600, color: "#000000", fontFamily: "var(--font-roboto), sans-serif", fontSize: "0.95rem" }}>{item.title}</div>
                            <div style={{ fontSize: "0.85rem", color: "#64748b", fontFamily: "var(--font-roboto), sans-serif", marginTop: "2px" }}>{item.category}</div>
                          </td>
                          <td style={{ padding: "1rem 1.25rem", fontWeight: 600, color: "#000000", fontFamily: "var(--font-roboto), sans-serif", fontSize: "0.95rem" }}>
                            Rs. {parseFloat(item.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: "1rem 1.25rem", fontFamily: "var(--font-roboto), sans-serif", fontSize: "0.95rem" }}>
                            <div style={{ fontWeight: 500, color: "#000000" }}>{item.seller_name}</div>
                            <div style={{ color: "#64748b", fontSize: "0.85rem" }}>{item.seller_email}</div>
                          </td>
                          <td style={{ padding: "1rem 1.25rem" }}>
                            <span style={{ 
                              backgroundColor: statusColor.bg, 
                              color: statusColor.text, 
                              borderRadius: "9999px",
                              padding: "0.25rem 1rem",
                              fontSize: "0.85rem",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              display: "inline-block",
                              fontFamily: "var(--font-roboto), sans-serif"
                            }}>
                              {statusColor.label}
                            </span>
                          </td>
                          <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                              {isPending && (
                                <>
                                  <button 
                                    onClick={() => updateMarketplaceStatus(item.id, "approve")}
                                    style={{
                                      backgroundColor: "#4caf50",
                                      color: "#ffffff",
                                      border: "none",
                                      borderRadius: "9999px",
                                      padding: "0.4rem 1.25rem",
                                      fontSize: "0.85rem",
                                      fontWeight: 600,
                                      fontFamily: "var(--font-roboto), sans-serif",
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "0.4rem"
                                    }}
                                  >
                                    <CheckCircle size={14} /> Approve
                                  </button>
                                  <button 
                                    onClick={() => updateMarketplaceStatus(item.id, "reject")}
                                    style={{
                                      backgroundColor: "#d32f2f",
                                      color: "#ffffff",
                                      border: "none",
                                      borderRadius: "9999px",
                                      padding: "0.4rem 1.25rem",
                                      fontSize: "0.85rem",
                                      fontWeight: 600,
                                      fontFamily: "var(--font-roboto), sans-serif",
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "0.4rem"
                                    }}
                                  >
                                    <XCircle size={14} /> Reject
                                  </button>
                                </>
                              )}
                              {isHidden && (
                                <button 
                                  onClick={() => updateMarketplaceStatus(item.id, "approve")}
                                  style={{
                                    backgroundColor: "#4caf50",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: "9999px",
                                    padding: "0.4rem 1.25rem",
                                    fontSize: "0.85rem",
                                    fontWeight: 600,
                                    fontFamily: "var(--font-roboto), sans-serif",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.4rem"
                                  }}
                                >
                                  {/* Eye icon for unhide */}
                                  <Users size={14} style={{ display: "none" }} />
                                  <span style={{ display: "inline-flex", alignItems: "center" }}>
                                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px" }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    Unhide
                                  </span>
                                </button>
                              )}
                              {isActive && (
                                <button 
                                  onClick={() => updateMarketplaceStatus(item.id, "hide")}
                                  style={{
                                    backgroundColor: "#b45309",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: "9999px",
                                    padding: "0.4rem 1.25rem",
                                    fontSize: "0.85rem",
                                    fontWeight: 600,
                                    fontFamily: "var(--font-roboto), sans-serif",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.4rem"
                                  }}
                                >
                                  <EyeOff size={14} /> Hide
                                </button>
                              )}
                              <button 
                                onClick={() => updateMarketplaceStatus(item.id, "delete")}
                                title="Delete Item"
                                style={{ 
                                  backgroundColor: "#d32f2f", 
                                  color: "#ffffff", 
                                  border: "none", 
                                  borderRadius: "50%", 
                                  width: "36px", 
                                  height: "36px", 
                                  display: "inline-flex", 
                                  alignItems: "center", 
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  transition: "transform 0.1s"
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── LOST & FOUND TAB ── */}
      {tab === "lost-found" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <Search size={28} style={{ color: "#000c66" }} />
            <h2 style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontSize: "1.8rem",
              fontWeight: 700,
              color: "#000c66",
              margin: 0
            }}>
              Lost & Found Reports
            </h2>
          </div>

          <div style={{
            border: "1.5px solid rgba(0, 12, 102, 0.15)",
            borderRadius: "1.5rem",
            overflow: "hidden",
            backgroundColor: "#ffffff",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
            marginBottom: "2.5rem"
          }}>
            {lostFoundLoading ? (
              <div className="p-8 text-center text-muted">Loading reports...</div>
            ) : lostFoundItems.length === 0 ? (
              <div className="p-8 text-center text-muted">No reports found.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead style={{ backgroundColor: "#edf4fe", borderBottom: "1.5px solid rgba(0, 12, 102, 0.15)" }}>
                    <tr>
                      {["Title", "Type", "Status", "Reporter", "Status"].map((h, idx) => (
                        <th key={idx} style={{
                          padding: "1rem 1.25rem",
                          fontFamily: "var(--font-roboto), sans-serif",
                          fontWeight: 600,
                          fontSize: "0.95rem",
                          color: "#000c66",
                          whiteSpace: "nowrap"
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lostFoundItems.map(item => {
                      const typeStyle = item.type === "Found" ? { bg: "#00875a", text: "#ffffff" } : { bg: "#8a1f1f", text: "#ffffff" };
                      const statusStyle = item.status === "active" ? { bg: "#00b8d9", text: "#ffffff", label: "Active" } : { bg: "#94a3b8", text: "#ffffff", label: "Inactive" };
                      return (
                        <tr key={item.id} style={{ borderBottom: "1px solid rgba(0, 12, 102, 0.1)" }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(0, 12, 102, 0.02)")}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}>
                          <td style={{ padding: "1rem 1.25rem" }}>
                            <div style={{ fontWeight: 600, color: "#000000", fontFamily: "var(--font-roboto), sans-serif", fontSize: "0.95rem" }}>{item.title}</div>
                            <div style={{ fontSize: "0.85rem", color: "#64748b", fontFamily: "var(--font-roboto), sans-serif", marginTop: "2px" }}>{item.time_date} at {item.location}</div>
                          </td>
                          <td style={{ padding: "1rem 1.25rem" }}>
                            <span style={{ 
                              backgroundColor: typeStyle.bg, 
                              color: typeStyle.text, 
                              borderRadius: "9999px",
                              padding: "0.25rem 1.25rem",
                              fontSize: "0.85rem",
                              fontWeight: 600,
                              textTransform: "capitalize",
                              display: "inline-block",
                              fontFamily: "var(--font-roboto), sans-serif"
                            }}>
                              {item.type}
                            </span>
                          </td>
                          <td style={{ padding: "1rem 1.25rem" }}>
                            <span style={{ 
                              backgroundColor: statusStyle.bg, 
                              color: statusStyle.text, 
                              borderRadius: "9999px",
                              padding: "0.25rem 1.25rem",
                              fontSize: "0.85rem",
                              fontWeight: 600,
                              textTransform: "capitalize",
                              display: "inline-block",
                              fontFamily: "var(--font-roboto), sans-serif"
                            }}>
                              {statusStyle.label}
                            </span>
                          </td>
                          <td style={{ padding: "1rem 1.25rem", fontFamily: "var(--font-roboto), sans-serif", fontSize: "0.95rem" }}>
                            <div style={{ fontWeight: 500, color: "#000000" }}>{item.reporter_name}</div>
                            <div style={{ color: "#64748b", fontSize: "0.85rem" }}>{item.reporter_email}</div>
                          </td>
                          <td style={{ padding: "1rem 1.25rem", textAlign: "left" }}>
                            <button 
                              onClick={() => deleteLostFoundItem(item.id)}
                              style={{
                                backgroundColor: "#d32f2f",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "9999px",
                                padding: "0.45rem 1.25rem",
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                fontFamily: "var(--font-roboto), sans-serif",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                transition: "transform 0.1s"
                              }}
                              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── INFO HUB TAB ── */}
      {tab === "info-hub" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <BookOpen size={28} style={{ color: "#000c66" }} />
            <h2 style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontSize: "1.8rem",
              fontWeight: 700,
              color: "#000c66",
              margin: 0
            }}>
              Info Hub Directory
            </h2>
          </div>

          <div style={{
            border: "1.5px solid rgba(0, 12, 102, 0.15)",
            borderRadius: "1.5rem",
            overflow: "hidden",
            backgroundColor: "#ffffff",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
            marginBottom: "2.5rem"
          }}>
            {infoHubLoading ? (
              <div className="p-8 text-center text-muted">Loading...</div>
            ) : infoHubItems.length === 0 ? (
              <div className="p-8 text-center text-muted">No items found.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead style={{ backgroundColor: "#edf4fe", borderBottom: "1.5px solid rgba(0, 12, 102, 0.15)" }}>
                    <tr>
                      {["Title", "Category", "Details", "Actions"].map(h => (
                        <th key={h} style={{
                          padding: "1rem 1.25rem",
                          fontFamily: "var(--font-roboto), sans-serif",
                          fontWeight: 600,
                          fontSize: "0.95rem",
                          color: "#000c66",
                          whiteSpace: "nowrap"
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {infoHubItems.map(item => {
                      const catStyle = item.category === "procedure" ? { bg: "#000c66", text: "#ffffff", label: "Procedure" } :
                                       item.category === "hotline" ? { bg: "#d32f2f", text: "#ffffff", label: "Hotline" } :
                                       { bg: "#f59e0b", text: "#ffffff", label: "Contact" };
                      return (
                        <tr key={item.id} style={{ borderBottom: "1px solid rgba(0, 12, 102, 0.1)" }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(0, 12, 102, 0.02)")}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}>
                          <td style={{ padding: "1rem 1.25rem", fontWeight: 600, color: "#000000", fontFamily: "var(--font-roboto), sans-serif", fontSize: "0.95rem" }}>{item.title}</td>
                          <td style={{ padding: "1rem 1.25rem" }}>
                            <span style={{ 
                              backgroundColor: catStyle.bg, 
                              color: catStyle.text, 
                              borderRadius: "9999px",
                              padding: "0.25rem 1.25rem",
                              fontSize: "0.85rem",
                              fontWeight: 600,
                              textTransform: "capitalize",
                              display: "inline-block",
                              fontFamily: "var(--font-roboto), sans-serif"
                            }}>
                              {catStyle.label}
                            </span>
                          </td>
                          <td style={{ padding: "1rem 1.25rem", fontFamily: "var(--font-roboto), sans-serif", fontSize: "0.95rem" }}>
                            <div style={{ color: "#000000", lineHeight: "1.4" }}>{item.description}</div>
                            {item.contact_info && <div style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "2px" }}>Contact: {item.contact_info}</div>}
                          </td>
                          <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                              <button 
                                onClick={() => { setEditingInfoHub(item); setShowInfoHubModal(true); }}
                                style={{
                                  backgroundColor: "#e6effd",
                                  color: "#000c66",
                                  border: "1.5px solid rgba(0, 12, 102, 0.2)",
                                  borderRadius: "9999px",
                                  padding: "0.4rem 1.25rem",
                                  fontSize: "0.85rem",
                                  fontWeight: 600,
                                  fontFamily: "var(--font-roboto), sans-serif",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.4rem"
                                }}
                              >
                                <Edit size={14} /> Edit
                              </button>
                              <button 
                                onClick={() => deleteInfoHubItem(item.id)}
                                title="Delete Item"
                                style={{ 
                                  backgroundColor: "#d32f2f", 
                                  color: "#ffffff", 
                                  border: "none", 
                                  borderRadius: "50%", 
                                  width: "36px", 
                                  height: "36px", 
                                  display: "inline-flex", 
                                  alignItems: "center", 
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  transition: "transform 0.1s"
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Event Form Modal ── */}
      {showEventModal && (
        <EventFormModal
          myId={myId}
          initialData={editingEvent}
          onClose={() => { setShowEventModal(false); setEditingEvent(null); }}
          onSaved={(ev) => {
            if (editingEvent) {
              setEvents(prev => prev.map(e => e.id === ev.id ? ev : e));
            } else {
              setEvents(prev => [ev, ...prev]);
            }
            setShowEventModal(false);
            setEditingEvent(null);
          }}
        />
      )}

      {/* ── Ticket Form Modal ── */}
      {showTicketModal && (
        <TicketFormModal
          myId={myId}
          initialData={editingTicket}
          onClose={() => { setShowTicketModal(false); setEditingTicket(null); }}
          onSaved={(ticket) => {
            if (editingTicket) {
              setTickets(prev => prev.map(t => t.id === ticket.id ? ticket : t));
            } else {
              setTickets(prev => [ticket, ...prev]);
            }
            setShowTicketModal(false);
            setEditingTicket(null);
          }}
        />
      )}

      {/* ── Info Hub Form Modal ── */}
      {showInfoHubModal && (
        <InfoHubFormModal
          myId={myId}
          initialData={editingInfoHub}
          onClose={() => { setShowInfoHubModal(false); setEditingInfoHub(null); }}
          onSaved={(item) => {
            if (editingInfoHub) {
              setInfoHubItems(prev => prev.map(i => i.id === item.id ? item : i));
            } else {
              setInfoHubItems(prev => [item, ...prev]);
            }
            setShowInfoHubModal(false);
            setEditingInfoHub(null);
          }}
        />
      )}

      {/* ── Custom Confirmation Modal ── */}
      {confirmDialog.isOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          zIndex: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem"
        }} onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}>
          <div style={{
            maxWidth: "400px",
            width: "100%",
            backgroundColor: "#ffffff",
            borderRadius: "1.5rem",
            padding: "2rem",
            border: "1.5px solid rgba(0, 12, 102, 0.15)",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
            textAlign: "center"
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: confirmDialog.isDestructive ? "rgba(211, 47, 47, 0.1)" : "rgba(0, 12, 102, 0.1)",
              color: confirmDialog.isDestructive ? "#d32f2f" : "#000c66",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem auto"
            }}>
              <AlertTriangle size={28} />
            </div>

            <h3 style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "#000c66",
              margin: "0 0 0.5rem 0"
            }}>
              {confirmDialog.title}
            </h3>

            <p style={{
              fontFamily: "var(--font-roboto), sans-serif",
              fontSize: "0.95rem",
              color: "#64748b",
              lineHeight: 1.5,
              margin: "0 0 1.75rem 0"
            }}>
              {confirmDialog.message}
            </p>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button 
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                style={{
                  flex: 1,
                  height: "42px",
                  backgroundColor: "#ffffff",
                  border: "1.5px solid #d1d5db",
                  borderRadius: "9999px",
                  fontFamily: "var(--font-roboto), sans-serif",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: "#505255",
                  cursor: "pointer",
                  transition: "background-color 0.2s"
                }}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (confirmDialog.onConfirm) confirmDialog.onConfirm();
                }}
                style={{
                  flex: 1,
                  height: "42px",
                  backgroundColor: confirmDialog.isDestructive ? "#d32f2f" : "#000c66",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "9999px",
                  fontFamily: "var(--font-roboto), sans-serif",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "opacity 0.2s"
                }}
                onMouseOver={e => e.currentTarget.style.opacity = "0.9"}
                onMouseOut={e => e.currentTarget.style.opacity = "1"}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Event Form Modal ──────────────────────────────────────── */
function EventFormModal({ myId, initialData, onClose, onSaved }: { myId: string; initialData?: Event | null; onClose: () => void; onSaved: (e: Event) => void; }) {
  const [form, setForm] = useState({ 
    title: initialData?.title || "", 
    description: initialData?.description || "", 
    event_date: initialData?.event_date || "", 
    event_time: initialData?.event_time || "", 
    location: initialData?.location || "", 
    organized_by: initialData?.organized_by || "", 
    category: initialData?.category || "Academic" 
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(initialData?.image_url || "");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSubmitting(true);
    try {
      let image_url = initialData?.image_url || "";
      if (imageFile) {
        setUploading(true);
        image_url = await uploadToCloudinary(imageFile, "uwunexus/events");
        setUploading(false);
      }
      const endpoint = initialData ? `${process.env.NEXT_PUBLIC_API_URL}/update_event.php` : `${process.env.NEXT_PUBLIC_API_URL}/create_event.php`;
      const payload = initialData ? { ...form, image_url, requester_id: +myId, id: initialData.id } : { ...form, image_url, requester_id: +myId };
      const res = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      
      if (initialData) {
        onSaved({ ...initialData, ...form, image_url } as Event);
      } else {
        onSaved({ ...form, id: data.id, image_url, status: data.status, created_by: +myId, creator_name: "You" } as any);
      }
    } catch (err: any) {
      setError(err.message || "Failed to save event.");
    } finally {
      setSubmitting(false); setUploading(false);
    }
  };

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={onClose}>
      <div style={{
        maxWidth: "600px",
        width: "100%",
        maxHeight: "92vh",
        overflowY: "auto",
        backgroundColor: "#ffffff",
        borderRadius: "1.5rem",
        padding: "2rem",
        border: "1.5px solid rgba(0, 12, 102, 0.15)",
        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)"
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontSize: "1.8rem",
            fontWeight: 700,
            color: "#000c66",
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            <PlusCircle size={28} style={{ color: "#000c66" }} /> 
            {initialData ? "Edit Event" : "Create New Event"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center", padding: 0 }}><X size={24} /></button>
        </div>

        {error && <div style={{ marginBottom: "1rem", padding: "1rem", borderRadius: "1rem", fontSize: "0.9rem", backgroundColor: "rgba(211, 47, 47, 0.1)", color: "#d32f2f", border: "1px solid rgba(211, 47, 47, 0.2)" }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Image upload */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontFamily: "var(--font-roboto), sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#505255" }}>Event Banner Image</label>
            <label style={{ display: "block", cursor: "pointer" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                height: "45px",
                borderRadius: "9999px",
                border: "1.5px solid #d1d5db",
                padding: "0 1.25rem",
                backgroundColor: "#ffffff",
                cursor: "pointer",
                boxSizing: "border-box"
              }}>
                <Upload size={18} style={{ color: "#94a3b8" }} />
                <span style={{ color: "#94a3b8", fontSize: "0.95rem", fontFamily: "var(--font-roboto), sans-serif" }}>{imageFile ? imageFile.name : (initialData?.image_url ? "Click to change image" : "Click to upload image (auto-compressed)")}</span>
              </div>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />
            </label>
            {imagePreview && (
              <div style={{ position: "relative", height: "160px", marginTop: "0.75rem", borderRadius: "1rem", overflow: "hidden", border: "1.5px solid rgba(0, 12, 102, 0.15)" }}>
                <img src={imagePreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(""); }}
                  style={{ position: "absolute", top: "0.5rem", right: "0.5rem", backgroundColor: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontFamily: "var(--font-roboto), sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#505255" }}>Event Title *</label>
            <input 
              type="text" 
              placeholder="e.g. Tech Symposium 2026" 
              required 
              value={form.title} 
              onChange={e => set("title", e.target.value)}
              style={{
                width: "100%",
                height: "45px",
                border: "1.5px solid #d1d5db",
                borderRadius: "9999px",
                padding: "0 1.25rem",
                fontSize: "0.95rem",
                fontFamily: "var(--font-roboto), sans-serif",
                backgroundColor: "#ffffff",
                outline: "none",
                color: "#000000"
              }}
            />
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontFamily: "var(--font-roboto), sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#505255" }}>Description</label>
            <textarea 
              placeholder="Brief description of the event..." 
              rows={3} 
              value={form.description} 
              onChange={e => set("description", e.target.value)}
              style={{
                width: "100%",
                border: "1.5px solid #d1d5db",
                borderRadius: "1rem",
                padding: "0.8rem 1.25rem",
                fontSize: "0.95rem",
                fontFamily: "var(--font-roboto), sans-serif",
                backgroundColor: "#ffffff",
                outline: "none",
                color: "#000000",
                resize: "vertical"
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontFamily: "var(--font-roboto), sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#505255" }}>Date *</label>
              <input 
                type="date" 
                required 
                value={form.event_date} 
                onChange={e => set("event_date", e.target.value)}
                style={{
                  width: "100%",
                  height: "45px",
                  border: "1.5px solid #d1d5db",
                  borderRadius: "9999px",
                  padding: "0 1.25rem",
                  fontSize: "0.95rem",
                  fontFamily: "var(--font-roboto), sans-serif",
                  backgroundColor: "#ffffff",
                  outline: "none",
                  color: "#000000"
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontFamily: "var(--font-roboto), sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#505255" }}>Time *</label>
              <input 
                type="time" 
                required 
                value={form.event_time} 
                onChange={e => set("event_time", e.target.value)}
                style={{
                  width: "100%",
                  height: "45px",
                  border: "1.5px solid #d1d5db",
                  borderRadius: "9999px",
                  padding: "0 1.25rem",
                  fontSize: "0.95rem",
                  fontFamily: "var(--font-roboto), sans-serif",
                  backgroundColor: "#ffffff",
                  outline: "none",
                  color: "#000000"
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontFamily: "var(--font-roboto), sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#505255" }}>Location *</label>
            <input 
              type="text" 
              placeholder="e.g. Main Auditorium" 
              required 
              value={form.location} 
              onChange={e => set("location", e.target.value)}
              style={{
                width: "100%",
                height: "45px",
                border: "1.5px solid #d1d5db",
                borderRadius: "9999px",
                padding: "0 1.25rem",
                fontSize: "0.95rem",
                fontFamily: "var(--font-roboto), sans-serif",
                backgroundColor: "#ffffff",
                outline: "none",
                color: "#000000"
              }}
            />
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontFamily: "var(--font-roboto), sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#505255" }}>Organized By *</label>
            <input 
              type="text" 
              placeholder="e.g. Computer Science Society" 
              required 
              value={form.organized_by} 
              onChange={e => set("organized_by", e.target.value)}
              style={{
                width: "100%",
                height: "45px",
                border: "1.5px solid #d1d5db",
                borderRadius: "9999px",
                padding: "0 1.25rem",
                fontSize: "0.95rem",
                fontFamily: "var(--font-roboto), sans-serif",
                backgroundColor: "#ffffff",
                outline: "none",
                color: "#000000"
              }}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontFamily: "var(--font-roboto), sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#505255" }}>Category *</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <select 
                value={form.category} 
                onChange={e => set("category", e.target.value)}
                style={{
                  width: "100%",
                  height: "45px",
                  border: "1.5px solid #d1d5db",
                  borderRadius: "9999px",
                  padding: "0 2.5rem 0 1rem",
                  fontSize: "0.95rem",
                  fontFamily: "var(--font-roboto), sans-serif",
                  appearance: "none",
                  WebkitAppearance: "none",
                  backgroundColor: "#ffffff",
                  outline: "none",
                  color: "#000000",
                  cursor: "pointer"
                }}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={18} style={{ color: "#000c66", position: "absolute", right: "1rem", pointerEvents: "none" }} />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={submitting || uploading} 
            style={{
              width: "100%",
              height: "48px",
              backgroundColor: "#000c66",
              color: "#ffffff",
              border: "none",
              borderRadius: "9999px",
              fontSize: "1rem",
              fontWeight: 600,
              fontFamily: "var(--font-roboto), sans-serif",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              transition: "opacity 0.2s",
              opacity: submitting || uploading ? 0.7 : 1
            }}
          >
            {uploading ? "Uploading image..." : submitting ? "Saving..." : (initialData ? "Save Changes" : "Create Event")}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Ticket Form Modal ──────────────────────────────────────── */
function TicketFormModal({ myId, initialData, onClose, onSaved }: { myId: string; initialData?: TicketedEvent | null; onClose: () => void; onSaved: (t: TicketedEvent) => void; }) {
  const [form, setForm] = useState({ 
    title: initialData?.title || "", 
    description: initialData?.description || "", 
    event_date: initialData?.event_date || "", 
    event_time: initialData?.event_time || "", 
    venue: initialData?.venue || "", 
    price: initialData?.price?.toString() || "0", 
    total_tickets: initialData?.total_tickets?.toString() || "100" 
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(initialData?.image_url || "");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile && !initialData?.image_url) { setError("Please upload an image banner"); return; }
    setError(""); setSubmitting(true);
    try {
      let image_url = initialData?.image_url || "";
      if (imageFile) {
        setUploading(true);
        image_url = await uploadToCloudinary(imageFile, "uwunexus/tickets");
        setUploading(false);
      }

      const endpoint = initialData ? `${process.env.NEXT_PUBLIC_API_URL}/update_ticket_event.php` : `${process.env.NEXT_PUBLIC_API_URL}/create_ticket_event.php`;
      const payload = initialData ? { ...form, image_url, requester_id: +myId, id: initialData.id } : { ...form, image_url, created_by: +myId };
      const res = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      
      if (initialData) {
        onSaved({ ...initialData, ...form, image_url, price: +form.price, total_tickets: +form.total_tickets } as TicketedEvent);
      } else {
        onSaved({ ...form, id: Date.now(), image_url, status: "active", created_by: +myId, created_at: new Date().toISOString(), price: +form.price, total_tickets: +form.total_tickets, available_tickets: +form.total_tickets } as any);
      }
    } catch (err: any) {
      setError(err.message || "Failed to save ticket event.");
    } finally {
      setSubmitting(false); setUploading(false);
    }
  };

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={onClose}>
      <div style={{
        maxWidth: "600px",
        width: "100%",
        maxHeight: "92vh",
        overflowY: "auto",
        backgroundColor: "#ffffff",
        borderRadius: "1.5rem",
        padding: "2rem",
        border: "1.5px solid rgba(0, 12, 102, 0.15)",
        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)"
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontSize: "1.8rem",
            fontWeight: 700,
            color: "#000c66",
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            <PlusCircle size={28} style={{ color: "#000c66" }} /> 
            {initialData ? "Edit Ticketed Event" : "Create Ticketed Event"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center", padding: 0 }}><X size={24} /></button>
        </div>

        {error && <div style={{ marginBottom: "1rem", padding: "1rem", borderRadius: "1rem", fontSize: "0.9rem", backgroundColor: "rgba(211, 47, 47, 0.1)", color: "#d32f2f", border: "1px solid rgba(211, 47, 47, 0.2)" }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Image upload */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontFamily: "var(--font-roboto), sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#505255" }}>Ticket Banner Image *</label>
            <label style={{ display: "block", cursor: "pointer" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                height: "45px",
                borderRadius: "9999px",
                border: "1.5px solid #d1d5db",
                padding: "0 1.25rem",
                backgroundColor: "#ffffff",
                cursor: "pointer",
                boxSizing: "border-box"
              }}>
                <Upload size={18} style={{ color: "#94a3b8" }} />
                <span style={{ color: "#94a3b8", fontSize: "0.95rem", fontFamily: "var(--font-roboto), sans-serif" }}>{imageFile ? imageFile.name : (initialData?.image_url ? "Click to change image" : "Click to upload image")}</span>
              </div>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} required={!initialData?.image_url} />
            </label>
            {imagePreview && (
              <div style={{ position: "relative", height: "160px", marginTop: "0.75rem", borderRadius: "1rem", overflow: "hidden", border: "1.5px solid rgba(0, 12, 102, 0.15)" }}>
                <img src={imagePreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(""); }}
                  style={{ position: "absolute", top: "0.5rem", right: "0.5rem", backgroundColor: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></button>
              </div>
            )}
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontFamily: "var(--font-roboto), sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#505255" }}>Event Title *</label>
            <input 
              type="text" 
              required 
              value={form.title} 
              onChange={e => set("title", e.target.value)}
              style={{
                width: "100%",
                height: "45px",
                border: "1.5px solid #d1d5db",
                borderRadius: "9999px",
                padding: "0 1.25rem",
                fontSize: "0.95rem",
                fontFamily: "var(--font-roboto), sans-serif",
                backgroundColor: "#ffffff",
                outline: "none",
                color: "#000000"
              }}
            />
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontFamily: "var(--font-roboto), sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#505255" }}>Description *</label>
            <textarea 
              required 
              rows={3} 
              value={form.description} 
              onChange={e => set("description", e.target.value)}
              style={{
                width: "100%",
                border: "1.5px solid #d1d5db",
                borderRadius: "1rem",
                padding: "0.8rem 1.25rem",
                fontSize: "0.95rem",
                fontFamily: "var(--font-roboto), sans-serif",
                backgroundColor: "#ffffff",
                outline: "none",
                color: "#000000",
                resize: "vertical"
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontFamily: "var(--font-roboto), sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#505255" }}>Date *</label>
              <input 
                type="date" 
                required 
                value={form.event_date} 
                onChange={e => set("event_date", e.target.value)}
                style={{
                  width: "100%",
                  height: "45px",
                  border: "1.5px solid #d1d5db",
                  borderRadius: "9999px",
                  padding: "0 1.25rem",
                  fontSize: "0.95rem",
                  fontFamily: "var(--font-roboto), sans-serif",
                  backgroundColor: "#ffffff",
                  outline: "none",
                  color: "#000000"
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontFamily: "var(--font-roboto), sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#505255" }}>Time *</label>
              <input 
                type="time" 
                required 
                value={form.event_time} 
                onChange={e => set("event_time", e.target.value)}
                style={{
                  width: "100%",
                  height: "45px",
                  border: "1.5px solid #d1d5db",
                  borderRadius: "9999px",
                  padding: "0 1.25rem",
                  fontSize: "0.95rem",
                  fontFamily: "var(--font-roboto), sans-serif",
                  backgroundColor: "#ffffff",
                  outline: "none",
                  color: "#000000"
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontFamily: "var(--font-roboto), sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#505255" }}>Venue *</label>
            <input 
              type="text" 
              required 
              value={form.venue} 
              onChange={e => set("venue", e.target.value)}
              style={{
                width: "100%",
                height: "45px",
                border: "1.5px solid #d1d5db",
                borderRadius: "9999px",
                padding: "0 1.25rem",
                fontSize: "0.95rem",
                fontFamily: "var(--font-roboto), sans-serif",
                backgroundColor: "#ffffff",
                outline: "none",
                color: "#000000"
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontFamily: "var(--font-roboto), sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#505255" }}>Price (LKR) *</label>
              <input 
                type="number" 
                step="0.01" 
                required 
                value={form.price} 
                onChange={e => set("price", e.target.value)}
                style={{
                  width: "100%",
                  height: "45px",
                  border: "1.5px solid #d1d5db",
                  borderRadius: "9999px",
                  padding: "0 1.25rem",
                  fontSize: "0.95rem",
                  fontFamily: "var(--font-roboto), sans-serif",
                  backgroundColor: "#ffffff",
                  outline: "none",
                  color: "#000000"
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontFamily: "var(--font-roboto), sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#505255" }}>Total Tickets *</label>
              <input 
                type="number" 
                min="1" 
                required 
                value={form.total_tickets} 
                onChange={e => set("total_tickets", e.target.value)}
                style={{
                  width: "100%",
                  height: "45px",
                  border: "1.5px solid #d1d5db",
                  borderRadius: "9999px",
                  padding: "0 1.25rem",
                  fontSize: "0.95rem",
                  fontFamily: "var(--font-roboto), sans-serif",
                  backgroundColor: "#ffffff",
                  outline: "none",
                  color: "#000000"
                }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={submitting || uploading} 
            style={{
              width: "100%",
              height: "48px",
              backgroundColor: "#000c66",
              color: "#ffffff",
              border: "none",
              borderRadius: "9999px",
              fontSize: "1rem",
              fontWeight: 600,
              fontFamily: "var(--font-roboto), sans-serif",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              transition: "opacity 0.2s",
              opacity: submitting || uploading ? 0.7 : 1
            }}
          >
            {uploading ? "Uploading image..." : submitting ? "Saving..." : (initialData ? "Save Changes" : "Create Ticketed Event")}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Info Hub Form Modal ──────────────────────────────────────── */
function InfoHubFormModal({ myId, initialData, onClose, onSaved }: { myId: string; initialData?: InfoHubItem | null; onClose: () => void; onSaved: (i: InfoHubItem) => void; }) {
  const [form, setForm] = useState({ 
    category: initialData?.category || "procedure", 
    title: initialData?.title || "", 
    description: initialData?.description || "", 
    contact_info: initialData?.contact_info || "", 
    action_link: initialData?.action_link || "", 
    action_text: initialData?.action_text || "" 
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError("");
    try {
      const endpoint = initialData ? `${process.env.NEXT_PUBLIC_API_URL}/update_info_hub.php` : `${process.env.NEXT_PUBLIC_API_URL}/create_info_hub.php`;
      const payload = initialData ? { ...form, user_id: +myId, id: initialData.id } : { ...form, user_id: +myId };
      const res = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      
      if (initialData) {
        onSaved({ ...initialData, ...form } as InfoHubItem);
      } else {
        onSaved({ ...form, id: data.id } as any);
      }
    } catch (err: any) {
      setError(err.message || "Failed to save info hub item.");
    } finally {
      setSubmitting(false);
    }
  };

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={onClose}>
      <div style={{
        maxWidth: "600px",
        width: "100%",
        maxHeight: "92vh",
        overflowY: "auto",
        backgroundColor: "#ffffff",
        borderRadius: "1.5rem",
        padding: "2rem",
        border: "1.5px solid rgba(0, 12, 102, 0.15)",
        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)"
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontSize: "1.8rem",
            fontWeight: 700,
            color: "#000c66",
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            <BookOpen size={28} style={{ color: "#000c66" }} /> 
            {initialData ? "Edit Info Hub Item" : "Add Info Hub Item"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center", padding: 0 }}><X size={24} /></button>
        </div>

        {error && <div style={{ marginBottom: "1rem", padding: "1rem", borderRadius: "1rem", fontSize: "0.9rem", backgroundColor: "rgba(211, 47, 47, 0.1)", color: "#d32f2f", border: "1px solid rgba(211, 47, 47, 0.2)" }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontFamily: "var(--font-roboto), sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#505255" }}>
              Category *
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <select 
                value={form.category} 
                onChange={e => set("category", e.target.value)}
                style={{
                  width: "100%",
                  height: "45px",
                  border: "1.5px solid #d1d5db",
                  borderRadius: "9999px",
                  padding: "0 2.5rem 0 1rem",
                  fontSize: "0.95rem",
                  fontFamily: "var(--font-roboto), sans-serif",
                  appearance: "none",
                  WebkitAppearance: "none",
                  backgroundColor: "#ffffff",
                  outline: "none",
                  color: "#000000",
                  cursor: "pointer"
                }}
              >
                <option value="procedure">University Procedure</option>
                <option value="hotline">Emergency Hotline</option>
                <option value="contact">Key Contact</option>
              </select>
              <ChevronDown size={18} style={{ color: "#000c66", position: "absolute", right: "1rem", pointerEvents: "none" }} />
            </div>
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontFamily: "var(--font-roboto), sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#505255" }}>
              Title / Name *
            </label>
            <input 
              type="text" 
              required 
              value={form.title} 
              onChange={e => set("title", e.target.value)}
              style={{
                width: "100%",
                height: "45px",
                border: "1.5px solid #d1d5db",
                borderRadius: "9999px",
                padding: "0 1.25rem",
                fontSize: "0.95rem",
                fontFamily: "var(--font-roboto), sans-serif",
                backgroundColor: "#ffffff",
                outline: "none",
                color: "#000000"
              }}
            />
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontFamily: "var(--font-roboto), sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#505255" }}>
              Description / Role *
            </label>
            <textarea 
              required 
              rows={4} 
              value={form.description} 
              onChange={e => set("description", e.target.value)}
              style={{
                width: "100%",
                border: "1.5px solid #d1d5db",
                borderRadius: "1rem",
                padding: "0.8rem 1.25rem",
                fontSize: "0.95rem",
                fontFamily: "var(--font-roboto), sans-serif",
                backgroundColor: "#ffffff",
                outline: "none",
                color: "#000000",
                resize: "vertical"
              }}
            />
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontFamily: "var(--font-roboto), sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#505255" }}>
              Contact Info (Phone / Email)
            </label>
            <input 
              type="text" 
              value={form.contact_info} 
              onChange={e => set("contact_info", e.target.value)}
              style={{
                width: "100%",
                height: "45px",
                border: "1.5px solid #d1d5db",
                borderRadius: "9999px",
                padding: "0 1.25rem",
                fontSize: "0.95rem",
                fontFamily: "var(--font-roboto), sans-serif",
                backgroundColor: "#ffffff",
                outline: "none",
                color: "#000000"
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontFamily: "var(--font-roboto), sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#505255" }}>
                Action URL
              </label>
              <input 
                type="url" 
                value={form.action_link} 
                onChange={e => set("action_link", e.target.value)} 
                placeholder="https://..." 
                style={{
                  width: "100%",
                  height: "45px",
                  border: "1.5px solid #d1d5db",
                  borderRadius: "9999px",
                  padding: "0 1.25rem",
                  fontSize: "0.95rem",
                  fontFamily: "var(--font-roboto), sans-serif",
                  backgroundColor: "#ffffff",
                  outline: "none",
                  color: "#000000"
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontFamily: "var(--font-roboto), sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#505255" }}>
                Action Button Text
              </label>
              <input 
                type="text" 
                value={form.action_text} 
                onChange={e => set("action_text", e.target.value)} 
                placeholder="Download Form" 
                style={{
                  width: "100%",
                  height: "45px",
                  border: "1.5px solid #d1d5db",
                  borderRadius: "9999px",
                  padding: "0 1.25rem",
                  fontSize: "0.95rem",
                  fontFamily: "var(--font-roboto), sans-serif",
                  backgroundColor: "#ffffff",
                  outline: "none",
                  color: "#000000"
                }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={submitting} 
            style={{
              width: "100%",
              height: "48px",
              backgroundColor: "#000c66",
              color: "#ffffff",
              border: "none",
              borderRadius: "9999px",
              fontSize: "1rem",
              fontWeight: 600,
              fontFamily: "var(--font-roboto), sans-serif",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              transition: "opacity 0.2s",
              opacity: submitting ? 0.7 : 1
            }}
          >
            {submitting ? "Saving..." : "Save Item"}
          </button>
        </form>
      </div>
    </div>
  );
}
