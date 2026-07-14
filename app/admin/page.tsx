"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Shield, Users, Calendar, Search, RefreshCw, CheckCircle, XCircle, Trash2, PlusCircle, Clock, MapPin, X, Upload, ChevronDown, Ticket, Store, Eye, EyeOff, BookOpen, Edit } from "lucide-react";
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

  const [alertMessage, setAlertMessage] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{ message: string, onConfirm: () => void } | null>(null);

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
    setConfirmDialog({
      message: "Are you sure you want to permanently delete this user? This cannot be undone.",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/delete_user.php`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ requester_id: +myId, target_id: targetId }),
          });
          const data = await res.json();
          if (data.success) {
            setUsers(prev => prev.filter(u => u.id !== targetId));
          } else {
            setAlertMessage(data.message);
          }
        } catch (e) {
          setAlertMessage("Error deleting user.");
        }
      }
    });
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
    setConfirmDialog({
      message: "Delete this event permanently?",
      onConfirm: async () => {
        setConfirmDialog(null);
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/delete_event.php`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requester_id: +myId, event_id: eventId }),
        });
        setEvents(prev => prev.filter(e => e.id !== eventId));
      }
    });
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
    setConfirmDialog({
      message: "Delete this ticketed event permanently?",
      onConfirm: async () => {
        setConfirmDialog(null);
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/delete_ticket_event.php`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: +myId, id: ticketId }),
        });
        setTickets(prev => prev.filter(t => t.id !== ticketId));
      }
    });
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
    setConfirmDialog({
      message: `Are you sure you want to ${action} this item?`,
      onConfirm: async () => {
        setConfirmDialog(null);
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
            setAlertMessage(d.message);
          }
        } catch (e) {
          setAlertMessage("Error updating marketplace item.");
        }
      }
    });
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
    setConfirmDialog({
      message: "Are you sure you want to permanently delete this report?",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/delete_lost_found.php`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: itemId, user_id: +myId })
          });
          const d = await r.json();
          if (d.success) {
            setLostFoundItems(prev => prev.filter(i => i.id !== itemId));
          } else {
            setAlertMessage(d.message);
          }
        } catch (e) {
          setAlertMessage("Error deleting item.");
        }
      }
    });
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
    setConfirmDialog({
      message: "Are you sure you want to delete this Info Hub item?",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/delete_info_hub.php`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: itemId, user_id: +myId })
          });
          const d = await r.json();
          if (d.success) {
            setInfoHubItems(prev => prev.filter(i => i.id !== itemId));
          } else {
            setAlertMessage(d.message);
          }
        } catch (e) {
          setAlertMessage("Error deleting item.");
        }
      }
    });
  };

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Shield size={36} style={{ color: "var(--primary)" }} />
            Admin Panel
          </h1>
          <p className="text-muted">Manage users, roles, and events for UWU-NEXUS.</p>
        </div>
        <div className="flex gap-3">
          {tab === "events" && ["superadmin", "clubadmin"].includes(myRole) && (
            <button className="btn btn-primary" onClick={() => { setEditingEvent(null); setShowEventModal(true); }}>
              <PlusCircle size={18} /> Create Event
            </button>
          )}
          {tab === "tickets" && ["superadmin", "clubadmin"].includes(myRole) && (
            <button className="btn btn-primary" onClick={() => { setEditingTicket(null); setShowTicketModal(true); }}>
              <PlusCircle size={18} /> Create Ticket
            </button>
          )}
          {tab === "info-hub" && ["superadmin"].includes(myRole) && (
            <button className="btn btn-primary" onClick={() => { setEditingInfoHub(null); setShowInfoHubModal(true); }}>
              <PlusCircle size={18} /> Add Info Hub Item
            </button>
          )}
          <button className="btn btn-secondary" onClick={tab === "users" ? fetchUsers : tab === "events" ? fetchEvents : fetchTickets}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 mb-8 p-1 rounded-lg overflow-x-auto" style={{ backgroundColor: "var(--secondary)", display: "inline-flex", border: "1px solid var(--border)", maxWidth: "100%" }}>
        {[
          { key: "users", label: "Users", icon: <Users size={16} />, adminOnly: true }, 
          { key: "events", label: "Events", icon: <Calendar size={16} /> },
          { key: "tickets", label: "Tickets", icon: <Ticket size={16} /> },
          { key: "marketplace", label: "Marketplace", icon: <Store size={16} />, adminOnly: true },
          { key: "lost-found", label: "Lost & Found", icon: <Search size={16} />, adminOnly: true },
          { key: "info-hub", label: "Info Hub", icon: <BookOpen size={16} />, adminOnly: true }
        ].filter(t => myRole === "superadmin" || !t.adminOnly).map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className="btn flex items-center gap-2"
            style={{ padding: "0.5rem 1.5rem", backgroundColor: tab === t.key ? "var(--primary)" : "transparent", color: tab === t.key ? "white" : "var(--foreground)", transition: "all 0.2s" }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── USERS TAB ── */}
      {tab === "users" && (
        <>
          {/* Stats */}
          <div className="grid gap-6 mb-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            {[
              { label: "Total Users", value: userStats.total, color: "var(--primary)" },
              { label: "Students", value: userStats.students, color: "var(--success)" },
              { label: "Staff", value: userStats.staff, color: "var(--warning)" },
              { label: "Admins", value: userStats.admins, color: "var(--accent)" },
            ].map(s => (
              <div key={s.label} className="card text-center" style={{ borderTop: `3px solid ${s.color}` }}>
                <div className="text-4xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
                <div className="text-muted text-sm">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="card mb-6 p-4 flex flex-wrap gap-4 items-center">
            <div style={{ flex: "1 1 250px", position: "relative" }}>
              <Search size={16} className="text-muted" style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)" }} />
              <input type="text" className="form-input" placeholder="Search users..." style={{ paddingLeft: "2.5rem" }} value={userSearch} onChange={e => setUserSearch(e.target.value)} />
            </div>
            <select className="form-input" style={{ width: "160px" }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="all">All Roles</option>
              <option value="student">Student</option>
              <option value="staff">Staff</option>
              <option value="clubadmin">Club Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>

          {/* Table */}
          <div className="card p-0 overflow-hidden">
            {usersLoading ? <div className="p-12 text-center text-muted">Loading users...</div> :
              filteredUsers.length === 0 ? <div className="p-12 text-center text-muted">No users found.</div> : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                      <tr>
                        {["#", "Full Name", "Email", "Enrollment No.", "Batch", "Degree", "Role", ...(myRole === "superadmin" ? ["Actions"] : [])].map(h => (
                          <th key={h} className="p-4 text-left text-sm font-semibold text-muted" style={{ borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user, i) => {
                        const rc = ROLE_COLORS[user.role] ?? ROLE_COLORS.student;
                        return (
                          <tr key={user.id} style={{ borderBottom: "1px solid var(--border)" }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)")}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}>
                            <td className="p-4 text-muted text-sm">{i + 1}</td>
                            <td className="p-4 font-semibold">{user.full_name}</td>
                            <td className="p-4 text-sm text-muted">{user.email}</td>
                            <td className="p-4 text-sm font-mono">{user.enrollment_number}</td>
                            <td className="p-4 text-sm">{user.batch}</td>
                            <td className="p-4 text-sm">{user.degree}</td>
                            <td className="p-4">
                              <span className="badge" style={{ backgroundColor: rc.bg, color: rc.color, textTransform: "capitalize" }}>{user.role}</span>
                            </td>
                            {myRole === "superadmin" && (
                              <td className="p-4 flex gap-2">
                                {user.id === +myId ? <span className="text-muted text-sm">You</span> : (
                                  <>
                                    <select className="form-input text-sm" style={{ padding: "0.35rem 0.75rem", width: "140px" }}
                                      value={user.role} disabled={updatingUserId === user.id}
                                      onChange={e => updateUserRole(user.id, e.target.value)}>
                                      <option value="student">Student</option>
                                      <option value="staff">Staff</option>
                                      <option value="clubadmin">Club Admin</option>
                                      <option value="superadmin">Super Admin</option>
                                    </select>
                                    <button onClick={() => deleteUser(user.id)} className="btn" title="Delete User" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.3)", padding: "0.35rem 0.75rem" }}>
                                      <Trash2 size={16} />
                                    </button>
                                  </>
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
          <div className="grid gap-6 mb-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            {[
              { label: "Total Events", value: eventStats.total, color: "var(--primary)" },
              { label: "Approved", value: eventStats.approved, color: "var(--success)" },
              { label: "Pending", value: eventStats.pending, color: "var(--warning)" },
              { label: "Rejected", value: eventStats.rejected, color: "var(--danger)" },
            ].map(s => (
              <div key={s.label} className="card text-center" style={{ borderTop: `3px solid ${s.color}` }}>
                <div className="text-4xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
                <div className="text-muted text-sm">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {["all", "approved", "pending", "rejected"].map(s => {
              const sc = STATUS_COLORS[s];
              return (
                <button key={s} onClick={() => setEventStatusFilter(s)}
                  className="btn text-sm capitalize"
                  style={{
                    padding: "0.4rem 1.2rem",
                    backgroundColor: eventStatusFilter === s ? (sc?.bg ?? "var(--primary)") : "var(--secondary)",
                    color: eventStatusFilter === s ? (sc?.color ?? "white") : "var(--foreground)",
                    border: `1px solid ${eventStatusFilter === s ? (sc?.color ?? "var(--primary)") : "var(--border)"}`,
                  }}>
                  {s === "all" ? "All Events" : s}
                </button>
              );
            })}
          </div>

          {/* Events list */}
          {eventsLoading ? <div className="p-12 text-center text-muted">Loading events...</div> :
            filteredEvents.length === 0 ? (
              <div className="card text-center py-16 text-muted">
                <Calendar size={48} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
                <p>No events found.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredEvents.map(event => {
                  const sc = STATUS_COLORS[event.status];
                  return (
                    <div key={event.id} className="card flex flex-wrap gap-4 items-center" style={{ padding: "1rem 1.5rem" }}>
                      {/* Thumbnail */}
                      <div style={{ width: "80px", height: "60px", borderRadius: "0.5rem", overflow: "hidden", flexShrink: 0, backgroundColor: "var(--background)", position: "relative" }}>
                        {event.image_url ? (
                          <Image src={event.image_url} alt={event.title} fill sizes="80px" style={{ objectFit: "cover" }} />
                        ) : (
                          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Calendar size={28} className="text-muted" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: "1 1 200px" }}>
                        <div className="font-bold mb-1">{event.title}</div>
                        <div className="flex flex-wrap gap-3 text-xs text-muted">
                          <span className="flex items-center gap-1"><Calendar size={11} /> {formatDate(event.event_date)}</span>
                          <span className="flex items-center gap-1"><Clock size={11} /> {formatTime(event.event_time)}</span>
                          <span className="flex items-center gap-1"><MapPin size={11} /> {event.location}</span>
                        </div>
                        <div className="text-xs text-muted mt-1">By: <strong className="text-foreground">{event.creator_name}</strong> · {event.category}</div>
                      </div>

                      {/* Status badge */}
                      <span className="badge capitalize" style={{ backgroundColor: sc.bg, color: sc.color }}>{event.status}</span>

                      {/* Actions (superadmin only) */}
                      {myRole === "superadmin" && (
                        <div className="flex gap-2 flex-wrap">
                          {event.status !== "approved" && (
                            <button onClick={() => updateEventStatus(event.id, "approved")}
                              className="btn text-sm" title="Approve"
                              style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "var(--success)", border: "1px solid var(--success)", padding: "0.35rem 0.75rem" }}>
                              <CheckCircle size={15} /> Approve
                            </button>
                          )}
                          {event.status !== "rejected" && (
                            <button onClick={() => updateEventStatus(event.id, "rejected")}
                              className="btn text-sm" title="Reject"
                              style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid var(--danger)", padding: "0.35rem 0.75rem" }}>
                              <XCircle size={15} /> Reject
                            </button>
                          )}
                          <button onClick={() => { setEditingEvent(event); setShowEventModal(true); }}
                            className="btn text-sm" title="Edit"
                            style={{ backgroundColor: "rgba(59,130,246,0.1)", color: "var(--accent-light)", border: "1px solid rgba(59,130,246,0.3)", padding: "0.35rem 0.75rem" }}>
                            <Edit size={15} /> Edit
                          </button>
                          <button onClick={() => deleteEvent(event.id)}
                            className="btn text-sm" title="Delete"
                            style={{ backgroundColor: "rgba(239,68,68,0.05)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.3)", padding: "0.35rem 0.75rem" }}>
                            <Trash2 size={15} />
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
          <div className="flex gap-4 border-b border-border mb-6">
            <button 
              className={`pb-3 px-2 font-medium transition-colors ${ticketSubTab === "events" ? "text-primary border-b-2 border-primary" : "text-muted hover:text-foreground"}`}
              onClick={() => setTicketSubTab("events")}
            >
              Manage Events
            </button>
            <button 
              className={`pb-3 px-2 font-medium transition-colors ${ticketSubTab === "purchases" ? "text-primary border-b-2 border-primary" : "text-muted hover:text-foreground"}`}
              onClick={() => setTicketSubTab("purchases")}
            >
              Purchased Tickets
            </button>
          </div>

          {ticketSubTab === "events" && (
            <>
              {/* Stats */}
              <div className="grid gap-6 mb-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
                {[
                  { label: "Total Ticket Events", value: ticketStats.total, color: "var(--primary)" },
                  { label: "Active", value: ticketStats.active, color: "var(--success)" },
                  { label: "Closed", value: ticketStats.closed, color: "var(--muted)" },
                ].map(s => (
                  <div key={s.label} className="card text-center" style={{ borderTop: `3px solid ${s.color}` }}>
                    <div className="text-4xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-muted text-sm">{s.label}</div>
                  </div>
                ))}
              </div>

          {/* Status filter */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {["all", "active", "closed"].map(s => {
              const sc = s === "active" ? { bg: "rgba(34,197,94,0.2)", color: "#22c55e" } : s === "closed" ? { bg: "rgba(148,163,184,0.2)", color: "#94a3b8" } : null;
              return (
                <button key={s} onClick={() => setTicketStatusFilter(s)}
                  className="btn text-sm capitalize"
                  style={{
                    padding: "0.4rem 1.2rem",
                    backgroundColor: ticketStatusFilter === s ? (sc?.bg ?? "var(--primary)") : "var(--secondary)",
                    color: ticketStatusFilter === s ? (sc?.color ?? "white") : "var(--foreground)",
                    border: `1px solid ${ticketStatusFilter === s ? (sc?.color ?? "var(--primary)") : "var(--border)"}`,
                  }}>
                  {s === "all" ? "All Tickets" : s}
                </button>
              );
            })}
          </div>

          {/* Tickets list */}
          {ticketsLoading ? <div className="p-12 text-center text-muted">Loading tickets...</div> :
            filteredTickets.length === 0 ? (
              <div className="card text-center py-16 text-muted">
                <Ticket size={48} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
                <p>No ticketed events found.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredTickets.map(ticket => {
                  const sc = ticket.status === "active" ? { bg: "rgba(34,197,94,0.2)", color: "#22c55e" } : { bg: "rgba(148,163,184,0.2)", color: "#94a3b8" };
                  return (
                    <div key={ticket.id} className="card flex flex-wrap gap-4 items-center" style={{ padding: "1rem 1.5rem" }}>
                      {/* Thumbnail */}
                      <div style={{ width: "80px", height: "60px", borderRadius: "0.5rem", overflow: "hidden", flexShrink: 0, backgroundColor: "var(--background)", position: "relative" }}>
                        {ticket.image_url ? (
                          <Image src={ticket.image_url} alt={ticket.title} fill sizes="80px" style={{ objectFit: "cover" }} />
                        ) : (
                          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Ticket size={28} className="text-muted" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: "1 1 200px" }}>
                        <div className="font-bold mb-1">{ticket.title}</div>
                        <div className="flex flex-wrap gap-3 text-xs text-muted">
                          <span className="flex items-center gap-1"><Calendar size={11} /> {formatDate(ticket.event_date)}</span>
                          <span className="flex items-center gap-1"><Clock size={11} /> {formatTime(ticket.event_time)}</span>
                          <span className="flex items-center gap-1"><MapPin size={11} /> {ticket.venue}</span>
                        </div>
                        <div className="text-xs text-muted mt-1">Price: <strong className="text-primary">LKR {ticket.price}</strong> · {ticket.available_tickets} / {ticket.total_tickets} tickets left</div>
                      </div>

                      {/* Status badge */}
                      <span className="badge capitalize" style={{ backgroundColor: sc.bg, color: sc.color }}>{ticket.status}</span>

                      {/* Actions (superadmin only) */}
                      {myRole === "superadmin" && (
                        <div className="flex gap-2 flex-wrap">
                          {ticket.status === "active" ? (
                            <button onClick={() => updateTicketStatus(ticket.id, "closed")}
                              className="btn text-sm" title="Close Ticket Sales"
                              style={{ backgroundColor: "rgba(148,163,184,0.1)", color: "#94a3b8", border: "1px solid #94a3b8", padding: "0.35rem 0.75rem" }}>
                              <XCircle size={15} /> Close Sales
                            </button>
                          ) : (
                            <button onClick={() => updateTicketStatus(ticket.id, "active")}
                              className="btn text-sm" title="Reopen Ticket Sales"
                              style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "var(--success)", border: "1px solid var(--success)", padding: "0.35rem 0.75rem" }}>
                              <CheckCircle size={15} /> Reopen
                            </button>
                          )}
                          <button onClick={() => { setEditingTicket(ticket); setShowTicketModal(true); }}
                            className="btn text-sm" title="Edit"
                            style={{ backgroundColor: "rgba(59,130,246,0.1)", color: "var(--accent-light)", border: "1px solid rgba(59,130,246,0.3)", padding: "0.35rem 0.75rem" }}>
                            <Edit size={15} /> Edit
                          </button>
                          <button onClick={() => deleteTicket(ticket.id)}
                            className="btn text-sm" title="Delete"
                            style={{ backgroundColor: "rgba(239,68,68,0.05)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.3)", padding: "0.35rem 0.75rem" }}>
                            <Trash2 size={15} />
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
            <div className="card">
              <h2 className="text-xl font-bold mb-6">Purchased Tickets</h2>
              {purchasesLoading ? (
                <div className="text-center py-8 text-muted">Loading purchases...</div>
              ) : purchases.length === 0 ? (
                <div className="text-center py-8 text-muted">No purchases found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        <th className="p-3 text-sm font-semibold text-muted">Order ID</th>
                        <th className="p-3 text-sm font-semibold text-muted">Event</th>
                        <th className="p-3 text-sm font-semibold text-muted">Customer</th>
                        <th className="p-3 text-sm font-semibold text-muted">Contact</th>
                        <th className="p-3 text-sm font-semibold text-muted">Amount</th>
                        <th className="p-3 text-sm font-semibold text-muted">Status</th>
                        <th className="p-3 text-sm font-semibold text-muted">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchases.map(p => (
                        <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td className="p-3 text-sm font-medium">{p.order_id}</td>
                          <td className="p-3 text-sm">{p.event_title}</td>
                          <td className="p-3 text-sm">{p.customer_name}</td>
                          <td className="p-3 text-sm text-muted">
                            <div>{p.customer_email}</div>
                            <div>{p.customer_phone}</div>
                          </td>
                          <td className="p-3 text-sm font-bold">{p.currency} {p.amount}</td>
                          <td className="p-3">
                            <span className="badge text-xs" style={{
                              backgroundColor: p.status === "success" ? "rgba(34,197,94,0.1)" : p.status === "pending" ? "rgba(234,179,8,0.1)" : "rgba(239,68,68,0.1)",
                              color: p.status === "success" ? "var(--success)" : p.status === "pending" ? "var(--warning)" : "var(--danger)",
                              padding: "0.2rem 0.5rem", borderRadius: "1rem"
                            }}>
                              {p.status}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-muted">{new Date(p.created_at).toLocaleString()}</td>
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
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-bold text-lg flex items-center gap-2"><Store size={20} /> Marketplace Moderation</h2>
          </div>
          {marketplaceLoading ? (
            <div className="p-8 text-center text-muted">Loading items...</div>
          ) : marketplaceItems.length === 0 ? (
            <div className="p-8 text-center text-muted">No items found.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: "rgba(0,0,0,0.2)", borderBottom: "1px solid var(--border)" }}>
                    <th className="p-4 font-semibold">Item</th>
                    <th className="p-4 font-semibold">Price</th>
                    <th className="p-4 font-semibold">Seller</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {marketplaceItems.map(item => (
                    <tr key={item.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="p-4">
                        <div className="font-bold">{item.title}</div>
                        <div className="text-xs text-muted">{item.category}</div>
                      </td>
                      <td className="p-4 font-bold text-primary">Rs. {item.price}</td>
                      <td className="p-4 text-sm">
                        <div>{item.seller_name}</div>
                        <div className="text-muted">{item.seller_email}</div>
                      </td>
                      <td className="p-4">
                        <span className="badge" style={{ backgroundColor: STATUS_COLORS[item.status === 'active' ? 'approved' : item.status]?.bg || 'rgba(0,0,0,0.2)', color: STATUS_COLORS[item.status === 'active' ? 'approved' : item.status]?.color || 'white' }}>
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap justify-end gap-2">
                        {item.status === 'pending' && (
                          <>
                            <button className="btn" style={{ backgroundColor: "var(--success)", color: "white", padding: "0.4rem 0.8rem" }} onClick={() => updateMarketplaceStatus(item.id, "approve")}>
                              <CheckCircle size={14} /> Approve
                            </button>
                            <button className="btn" style={{ backgroundColor: "var(--danger)", color: "white", padding: "0.4rem 0.8rem" }} onClick={() => updateMarketplaceStatus(item.id, "reject")}>
                              <XCircle size={14} /> Reject
                            </button>
                          </>
                        )}
                        {item.status !== 'pending' && item.status !== 'hidden' && (
                          <button className="btn" style={{ backgroundColor: "var(--warning)", color: "black", padding: "0.4rem 0.8rem" }} onClick={() => updateMarketplaceStatus(item.id, "hide")}>
                            <EyeOff size={14} /> Hide
                          </button>
                        )}
                        {item.status === 'hidden' && (
                          <button className="btn" style={{ backgroundColor: "var(--success)", color: "white", padding: "0.4rem 0.8rem" }} onClick={() => updateMarketplaceStatus(item.id, "approve")}>
                            <Eye size={14} /> Unhide
                          </button>
                        )}
                        <button className="btn" style={{ backgroundColor: "transparent", color: "var(--danger)", border: "1px solid var(--danger)", padding: "0.4rem 0.8rem" }} onClick={() => updateMarketplaceStatus(item.id, "delete")}>
                          <Trash2 size={14} />
                        </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── LOST & FOUND TAB ── */}
      {tab === "lost-found" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-bold text-lg flex items-center gap-2"><Search size={20} /> Lost & Found Reports</h2>
          </div>
          {lostFoundLoading ? (
            <div className="p-8 text-center text-muted">Loading reports...</div>
          ) : lostFoundItems.length === 0 ? (
            <div className="p-8 text-center text-muted">No reports found.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: "rgba(0,0,0,0.2)", borderBottom: "1px solid var(--border)" }}>
                    <th className="p-4 font-semibold">Title</th>
                    <th className="p-4 font-semibold">Type</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Reporter</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lostFoundItems.map(item => (
                    <tr key={item.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="p-4">
                        <div className="font-bold">{item.title}</div>
                        <div className="text-xs text-muted mt-1">{item.time_date} at {item.location}</div>
                      </td>
                      <td className="p-4">
                        <span className="badge" style={{ backgroundColor: item.type === 'Lost' ? 'var(--danger)' : 'var(--success)', color: 'white' }}>
                          {item.type}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="badge" style={{ backgroundColor: item.status === 'active' ? 'var(--warning)' : 'var(--muted)', color: item.status === 'active' ? 'black' : 'white' }}>
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-sm">
                        <div>{item.reporter_name}</div>
                        <div className="text-muted">{item.reporter_email}</div>
                      </td>
                      <td className="p-4 text-right">
                        <button className="btn" style={{ backgroundColor: "var(--danger)", color: "white", padding: "0.4rem 0.8rem" }} onClick={() => deleteLostFoundItem(item.id)}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── INFO HUB TAB ── */}
      {tab === "info-hub" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-bold text-lg flex items-center gap-2"><BookOpen size={20} /> Info Hub Directory</h2>
          </div>
          {infoHubLoading ? (
            <div className="p-8 text-center text-muted">Loading...</div>
          ) : infoHubItems.length === 0 ? (
            <div className="p-8 text-center text-muted">No items found.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: "rgba(0,0,0,0.2)", borderBottom: "1px solid var(--border)" }}>
                    <th className="p-4 font-semibold">Title</th>
                    <th className="p-4 font-semibold">Category</th>
                    <th className="p-4 font-semibold">Details</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {infoHubItems.map(item => (
                    <tr key={item.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="p-4 font-bold">{item.title}</td>
                      <td className="p-4">
                        <span className="badge" style={{ backgroundColor: item.category === 'procedure' ? 'var(--primary)' : item.category === 'hotline' ? 'var(--danger)' : 'var(--warning)', color: item.category === 'hotline' ? 'white' : 'black' }}>
                          {item.category.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted">
                        <div className="truncate max-w-xs">{item.description}</div>
                        {item.contact_info && <div>Contact: {item.contact_info}</div>}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button className="btn" style={{ backgroundColor: "rgba(59,130,246,0.1)", color: "var(--accent-light)", border: "1px solid rgba(59,130,246,0.3)", padding: "0.35rem 0.75rem" }} onClick={() => {
                            setEditingInfoHub(item); setShowInfoHubModal(true);
                          }}>
                            <Edit size={16} /> Edit
                          </button>
                          <button className="btn" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.3)", padding: "0.35rem 0.75rem" }} onClick={() => deleteInfoHubItem(item.id)}>
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={onClose}>
      <div className="card" style={{ maxWidth: "600px", width: "100%", maxHeight: "92vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <PlusCircle size={24} style={{ color: "var(--primary)" }} /> {initialData ? "Edit Event" : "Create New Event"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}><X size={22} /></button>
        </div>

        {error && <div className="mb-4 p-3 rounded text-sm" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Image upload */}
          <div className="form-group mb-4">
            <label className="form-label text-sm">Event Banner Image</label>
            <label style={{ display: "block", cursor: "pointer" }}>
              <div className="form-input flex items-center gap-3" style={{ cursor: "pointer", padding: "0.75rem" }}>
                <Upload size={18} className="text-muted" />
                <span className="text-muted text-sm">{imageFile ? imageFile.name : (initialData?.image_url ? "Click to change image" : "Click to upload image (auto-compressed)")}</span>
              </div>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />
            </label>
            {imagePreview && (
              <div style={{ position: "relative", height: "160px", marginTop: "0.5rem", borderRadius: "0.5rem", overflow: "hidden" }}>
                <img src={imagePreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "contain", backgroundColor: "#f8fafc" }} />
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(""); }}
                  style={{ position: "absolute", top: "0.5rem", right: "0.5rem", backgroundColor: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="form-group mb-4">
            <label className="form-label text-sm">Event Title *</label>
            <input type="text" className="form-input" placeholder="e.g. Tech Symposium 2026" required value={form.title} onChange={e => set("title", e.target.value)} />
          </div>

          <div className="form-group mb-4">
            <label className="form-label text-sm">Description</label>
            <textarea className="form-input" placeholder="Brief description of the event..." rows={3} style={{ resize: "vertical" }} value={form.description} onChange={e => set("description", e.target.value)} />
          </div>

          <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="form-group">
              <label className="form-label text-sm">Date *</label>
              <input type="date" className="form-input" required value={form.event_date} onChange={e => set("event_date", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label text-sm">Time *</label>
              <input type="time" className="form-input" required value={form.event_time} onChange={e => set("event_time", e.target.value)} />
            </div>
          </div>

          <div className="form-group mb-4">
            <label className="form-label text-sm">Location *</label>
            <input type="text" className="form-input" placeholder="e.g. Main Auditorium" required value={form.location} onChange={e => set("location", e.target.value)} />
          </div>

          <div className="form-group mb-4">
            <label className="form-label text-sm">Organized By *</label>
            <input type="text" className="form-input" placeholder="e.g. Computer Science Society" required value={form.organized_by} onChange={e => set("organized_by", e.target.value)} />
          </div>

          <div className="form-group mb-6">
            <label className="form-label text-sm">Category *</label>
            <select className="form-input" value={form.category} onChange={e => set("category", e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <button type="submit" disabled={submitting || uploading} className="btn btn-primary w-full justify-center text-lg"
            style={{ padding: "0.75rem", opacity: submitting ? 0.7 : 1 }}>
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
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={onClose}>
      <div className="card" style={{ maxWidth: "600px", width: "100%", maxHeight: "92vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <PlusCircle size={24} style={{ color: "var(--primary)" }} /> {initialData ? "Edit Ticketed Event" : "Create Ticketed Event"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}><X size={22} /></button>
        </div>

        {error && <div className="mb-4 p-3 rounded text-sm" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group mb-4">
            <label className="form-label text-sm">Ticket Banner Image *</label>
            <label style={{ display: "block", cursor: "pointer" }}>
              <div className="form-input flex items-center gap-3" style={{ cursor: "pointer", padding: "0.75rem" }}>
                <Upload size={18} className="text-muted" />
                <span className="text-muted text-sm">{imageFile ? imageFile.name : (initialData?.image_url ? "Click to change image" : "Click to upload image")}</span>
              </div>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} required={!initialData?.image_url} />
            </label>
            {imagePreview && (
              <div style={{ position: "relative", height: "160px", marginTop: "0.5rem", borderRadius: "0.5rem", overflow: "hidden" }}>
                <img src={imagePreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "contain", backgroundColor: "#f8fafc" }} />
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(""); }}
                  style={{ position: "absolute", top: "0.5rem", right: "0.5rem", backgroundColor: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></button>
              </div>
            )}
          </div>

          <div className="form-group mb-4">
            <label className="form-label text-sm">Event Title *</label>
            <input type="text" className="form-input" required value={form.title} onChange={e => set("title", e.target.value)} />
          </div>

          <div className="form-group mb-4">
            <label className="form-label text-sm">Description *</label>
            <textarea className="form-input" required rows={3} style={{ resize: "vertical" }} value={form.description} onChange={e => set("description", e.target.value)} />
          </div>

          <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="form-group"><label className="form-label text-sm">Date *</label><input type="date" className="form-input" required value={form.event_date} onChange={e => set("event_date", e.target.value)} /></div>
            <div className="form-group"><label className="form-label text-sm">Time *</label><input type="time" className="form-input" required value={form.event_time} onChange={e => set("event_time", e.target.value)} /></div>
          </div>

          <div className="form-group mb-4">
            <label className="form-label text-sm">Venue *</label>
            <input type="text" className="form-input" required value={form.venue} onChange={e => set("venue", e.target.value)} />
          </div>

          <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="form-group"><label className="form-label text-sm">Price (LKR) *</label><input type="number" step="0.01" className="form-input" required value={form.price} onChange={e => set("price", e.target.value)} /></div>
            <div className="form-group"><label className="form-label text-sm">Total Tickets *</label><input type="number" min="1" className="form-input" required value={form.total_tickets} onChange={e => set("total_tickets", e.target.value)} /></div>
          </div>

          <button type="submit" disabled={submitting || uploading} className="btn btn-primary w-full justify-center text-lg" style={{ padding: "0.75rem", opacity: submitting ? 0.7 : 1 }}>
            {uploading ? "Uploading image..." : submitting ? "Creating..." : "Create Ticketed Event"}
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
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={onClose}>
      <div className="card" style={{ maxWidth: "600px", width: "100%", maxHeight: "92vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen size={24} style={{ color: "var(--primary)" }} /> {initialData ? "Edit Info Hub Item" : "Add Info Hub Item"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}><X size={22} /></button>
        </div>

        {error && <div className="mb-4 p-3 rounded text-sm" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group mb-4">
            <label className="form-label text-sm">Category *</label>
            <select className="form-input" value={form.category} onChange={e => set("category", e.target.value)}>
              <option value="procedure">University Procedure</option>
              <option value="hotline">Emergency Hotline</option>
              <option value="contact">Key Contact</option>
            </select>
          </div>

          <div className="form-group mb-4">
            <label className="form-label text-sm">Title / Name *</label>
            <input type="text" className="form-input" required value={form.title} onChange={e => set("title", e.target.value)} />
          </div>

          <div className="form-group mb-4">
            <label className="form-label text-sm">Description / Role *</label>
            <textarea className="form-input" required rows={3} value={form.description} onChange={e => set("description", e.target.value)}></textarea>
          </div>

          <div className="form-group mb-4">
            <label className="form-label text-sm">Contact Info (Phone / Email)</label>
            <input type="text" className="form-input" value={form.contact_info} onChange={e => set("contact_info", e.target.value)} />
          </div>

          <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="form-group"><label className="form-label text-sm">Action URL</label><input type="url" className="form-input" value={form.action_link} onChange={e => set("action_link", e.target.value)} placeholder="https://..." /></div>
            <div className="form-group"><label className="form-label text-sm">Action Button Text</label><input type="text" className="form-input" value={form.action_text} onChange={e => set("action_text", e.target.value)} placeholder="Download Form" /></div>
          </div>

          <button type="submit" disabled={submitting} className="btn btn-primary w-full justify-center text-lg" style={{ padding: "0.75rem", opacity: submitting ? 0.7 : 1 }}>
            {submitting ? "Saving..." : "Save Item"}
          </button>
        </form>
      </div>
    </div>
  );
}
