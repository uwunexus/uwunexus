"use client";

import { useState, useEffect } from "react";
import { Calendar, MapPin, Clock, Search, ChevronLeft, ChevronRight, LayoutList } from "lucide-react";

interface Event {
  id: number;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  organized_by: string;
  category: string;
  image_url: string | null;
  status: string;
  created_at: string;
}

const CATEGORIES = ["All", "Academics", "Cultural", "Sports", "Club Activity", "Career", "Other"];

const CATEGORY_COLORS: Record<string, string> = {
  Academic:       "#000c66",
  Cultural:       "#b25e00",
  Sports:         "#0e9f6e",
  "Club Activity":"#0088cc",
  Career:         "#d03801",
  Other:          "#64748b",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(":");
  const date = new Date();
  date.setHours(parseInt(h), parseInt(m));
  let hours = date.getHours();
  const ampm = hours >= 12 ? "p.m" : "a.m";
  hours = hours % 12 || 12;
  return `${hours}.00 ${ampm}`;
}

export const Iconlyuser = ({ size = 24, color = "#000000", style = {} }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
    <path d="M12.232 20.575C9.83398 20.58 7.58698 20.132 5.67798 18.969C6.62598 15.97 9.19798 14.582 12.232 14.59C15.262 14.582 17.838 15.974 18.785 18.969C17.766 19.59 16.651 20.007 15.468 20.26" stroke={color} strokeWidth="1.5" strokeLinecap="square" />
    <path d="M6.84476 13.7399C4.71976 13.7349 2.91376 14.7099 2.24976 16.8099C2.61276 17.0309 2.99176 17.2149 3.38676 17.3659" stroke={color} strokeWidth="1.5" strokeLinecap="square" />
    <path d="M17.656 13.7399C19.78 13.7349 21.586 14.7099 22.25 16.8099C21.861 17.0479 21.451 17.2419 21.025 17.3989" stroke={color} strokeWidth="1.5" strokeLinecap="square" />
    <path d="M12.9826 3.42493C14.8966 3.76993 16.3486 5.44493 16.3486 7.45793C16.3486 9.72193 14.5136 11.5569 12.2496 11.5569C9.98661 11.5569 8.15161 9.72193 8.15161 7.45793C8.15161 6.20893 8.71061 5.08993 9.59261 4.33793" stroke={color} strokeWidth="1.5" strokeLinecap="square" />
    <path d="M17.656 5.86682C19.246 5.86682 20.536 7.15582 20.536 8.74682C20.536 10.3368 19.246 11.6268 17.656 11.6268" stroke={color} strokeWidth="1.5" strokeLinecap="square" />
    <path d="M6.84509 5.86682C5.25409 5.86682 3.96509 7.15582 3.96509 8.74682C3.96509 10.3368 5.25409 11.6268 6.84509 11.6268" stroke={color} strokeWidth="1.5" strokeLinecap="square" />
  </svg>
);

export default function EventsPage() {
  const [events, setEvents]               = useState<Event[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");
  const [search, setSearch]               = useState("");
  const [category, setCategory]           = useState("All");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [viewMode, setViewMode]           = useState<"list" | "calendar">("list");

  // Calendar state
  const [calendarDate, setCalendarDate]   = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay]     = useState<number | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/get_events.php`)
      .then(r => r.json())
      .then(data => { if (data.success) setEvents(data.events); else setError(data.message); })
      .catch(() => setError("Could not connect to backend."))
      .finally(() => setLoading(false));
  }, []);

  // ── Filtering ──────────────────────────────────────────────────
  const filtered = events.filter(e => {
    const dbCategory = category === "Academics" ? "Academic" : category;
    const matchCat = category === "All" || e.category === dbCategory;
    const q = search.toLowerCase();
    const matchSearch = !q || e.title.toLowerCase().includes(q) || e.location.toLowerCase().includes(q) || e.organized_by.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  // Group events by month for list view
  const grouped: Record<string, Event[]> = {};
  filtered.forEach(e => {
    const d   = new Date(e.event_date + "T00:00:00");
    const key = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });

  // ── Calendar helpers ───────────────────────────────────────────
  const calYear  = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const daysInMonth  = new Date(calYear, calMonth + 1, 0).getDate();
  const firstWeekDay = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
  const calMonthLabel = calendarDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Events in the currently displayed calendar month (use ALL events, not filtered, so calendar shows all)
  const eventsByDay: Record<number, Event[]> = {};
  events.forEach(ev => {
    const d = new Date(ev.event_date + "T00:00:00");
    if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
      const day = d.getDate();
      if (!eventsByDay[day]) eventsByDay[day] = [];
      eventsByDay[day].push(ev);
    }
  });

  const selectedDayEvents = selectedDay ? (eventsByDay[selectedDay] ?? []) : [];

  const prevMonth = () => {
    setCalendarDate(new Date(calYear, calMonth - 1, 1));
    setSelectedDay(null);
  };
  const nextMonth = () => {
    setCalendarDate(new Date(calYear, calMonth + 1, 1));
    setSelectedDay(null);
  };

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();

  // ── Calendar grid cells ────────────────────────────────────────
  const totalCells = Math.ceil((firstWeekDay + daysInMonth) / 7) * 7;
  const calCells: (number | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const d = i - firstWeekDay + 1;
    return d > 0 && d <= daysInMonth ? d : null;
  });

  return (
    <div className="container" style={{ maxWidth: "1210px", marginTop: "4rem", paddingLeft: "0", paddingRight: "0" }}>

      {/* ── Header ── */}
      <div className="mb-4 text-left" style={{ marginTop: "1.5rem" }}>
        <h1 className="page-title" style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, color: "#000000", letterSpacing: "0.02em" }}>
          University Event Calendar
        </h1>
      </div>

      {/* ── View Toggle + Search + Filters ── */}
      <div className="flex flex-wrap gap-4 items-center mb-10" style={{ width: "100%", marginTop: "2rem", paddingBottom: "2rem" }}>
        {/* View mode toggle */}
        <div style={{ display: "flex", borderRadius: "9999px", border: "1.5px solid #e2e8f0", overflow: "hidden", flexShrink: 0 }}>
          <button
            onClick={() => setViewMode("list")}
            style={{
              height: "43px", padding: "0 1.25rem",
              backgroundColor: viewMode === "list" ? "#000c66" : "#ffffff",
              color: viewMode === "list" ? "#ffffff" : "#64748b",
              border: "none", cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: "0.4rem",
              fontFamily: "var(--font-inter), sans-serif", fontWeight: 700, fontSize: "0.9rem",
              transition: "all 0.2s",
            }}
          >
            <LayoutList size={16} /> List
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            style={{
              height: "43px", padding: "0 1.25rem",
              backgroundColor: viewMode === "calendar" ? "#000c66" : "#ffffff",
              color: viewMode === "calendar" ? "#ffffff" : "#64748b",
              border: "none", borderLeft: "1.5px solid #e2e8f0", cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: "0.4rem",
              fontFamily: "var(--font-inter), sans-serif", fontWeight: 700, fontSize: "0.9rem",
              transition: "all 0.2s",
            }}
          >
            <Calendar size={16} /> Calendar
          </button>
        </div>

        {/* Search */}
        <div style={{ flex: "1 1 300px", position: "relative" }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search events..."
            style={{ paddingLeft: "1.25rem", paddingRight: "2.5rem", borderRadius: "9999px", border: "1.5px solid #e2e8f0", backgroundColor: "#ffffff", height: "43px", width: "100%", outline: "none", fontSize: "0.95rem", fontFamily: "var(--font-inclusive-sans), sans-serif" }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Search size={18} style={{ position: "absolute", right: "1.25rem", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
        </div>

        {/* Category filters */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => {
            const isActive = category === cat;
            return (
              <button key={cat} onClick={() => setCategory(cat)} style={{ height: "43px", padding: "0 1.25rem", display: "inline-flex", alignItems: "center", justifyContent: "center", whiteSpace: "nowrap", borderRadius: "9999px", backgroundColor: isActive ? "#000c66" : "#ffffff", color: isActive ? "#ffffff" : "#000c66", border: `1.5px solid ${isActive ? "#000c66" : "#e2e8f0"}`, fontSize: "0.9rem", fontWeight: 500, fontFamily: "var(--font-inter), sans-serif", cursor: "pointer", transition: "all 0.2s" }}>
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && <div className="p-4 mb-6 rounded text-sm" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}
      {loading && <div className="text-center py-20 text-muted">Loading events...</div>}

      {/* ══════════════════════════════════════════════════════════
           CALENDAR VIEW
         ══════════════════════════════════════════════════════════ */}
      {!loading && viewMode === "calendar" && (
        <div>
          {/* Calendar card */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "2rem", boxShadow: "0 4px 32px rgba(0,0,0,0.08)", overflow: "hidden", marginBottom: "2rem" }}>

            {/* Calendar header */}
            <div style={{ backgroundColor: "#000c66", padding: "1.5rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <button onClick={prevMonth} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", transition: "background 0.2s" }}>
                <ChevronLeft size={20} />
              </button>
              <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "#ffffff", margin: 0 }}>
                {calMonthLabel}
              </h2>
              <button onClick={nextMonth} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", transition: "background 0.2s" }}>
                <ChevronRight size={20} />
              </button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <div style={{ minWidth: "600px" }}>
                {/* Weekday labels */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {WEEKDAYS.map(d => (
                    <div key={d} style={{ padding: "0.75rem 0", textAlign: "center", fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "0.85rem", color: d === "Sun" || d === "Sat" ? "#94a3b8" : "#000c66" }}>
                      {d}
                    </div>
                  ))}
                </div>

                {/* Day cells */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
                  {calCells.map((day, idx) => {
                    const dayEvents = day ? (eventsByDay[day] ?? []) : [];
                    const active = selectedDay === day && day !== null;
                    const todayCell = day !== null && isToday(day);
                const hasEvents = dayEvents.length > 0;
                const isWeekend = idx % 7 === 0 || idx % 7 === 6;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (day && hasEvents) setSelectedDay(active ? null : day);
                    }}
                    style={{
                      minHeight: "90px",
                      padding: "0.6rem 0.5rem 0.5rem",
                      borderRight: (idx + 1) % 7 !== 0 ? "1px solid #f1f5f9" : "none",
                      borderBottom: idx < calCells.length - 7 ? "1px solid #f1f5f9" : "none",
                      backgroundColor: active ? "#000c1a" : todayCell ? "#eef2ff" : "#ffffff",
                      cursor: hasEvents ? "pointer" : "default",
                      transition: "background 0.15s",
                      position: "relative",
                    }}
                  >
                    {day !== null && (
                      <>
                        {/* Day number */}
                        <div style={{
                          width: "28px", height: "28px", borderRadius: "50%",
                          backgroundColor: todayCell ? "#000c66" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "var(--font-syne), sans-serif",
                          fontWeight: todayCell ? 700 : 500,
                          fontSize: "0.9rem",
                          color: active ? "#ffffff" : todayCell ? "#ffffff" : isWeekend ? "#94a3b8" : "#1e293b",
                          marginBottom: "0.4rem",
                        }}>
                          {day}
                        </div>

                        {/* Event dots / pills */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          {dayEvents.slice(0, 3).map((ev, i) => {
                            const color = CATEGORY_COLORS[ev.category] ?? "#64748b";
                            return (
                              <div
                                key={i}
                                onClick={e => { e.stopPropagation(); setSelectedEvent(ev); }}
                                title={ev.title}
                                style={{
                                  backgroundColor: color,
                                  borderRadius: "4px",
                                  padding: "1px 5px",
                                  fontSize: "0.65rem",
                                  fontWeight: 700,
                                  fontFamily: "var(--font-syne), sans-serif",
                                  color: "#ffffff",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  cursor: "pointer",
                                  opacity: active ? 0.9 : 1,
                                }}
                              >
                                {ev.title}
                              </div>
                            );
                          })}
                          {dayEvents.length > 3 && (
                            <div style={{ fontSize: "0.65rem", fontWeight: 700, color: active ? "#aab0cc" : "#64748b", paddingLeft: "4px", fontFamily: "var(--font-syne), sans-serif" }}>
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

          {/* Legend */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem 1.5rem", marginBottom: "2rem", padding: "1rem 1.5rem", backgroundColor: "#ffffff", borderRadius: "1rem", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <span style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#64748b", alignSelf: "center" }}>Categories:</span>
            {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
              <div key={cat} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: color, flexShrink: 0 }} />
                <span style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 600, fontSize: "0.82rem", color: "#1e293b" }}>{cat}</span>
              </div>
            ))}
          </div>

          {/* Selected day events panel */}
          {selectedDay && selectedDayEvents.length > 0 && (
            <div style={{ marginBottom: "3rem" }}>
              <div className="flex items-center gap-3 mb-5">
                <h2 style={{ fontFamily: "var(--font-audiowide), sans-serif", fontWeight: 400, fontSize: "1.3rem", color: "#000000", margin: 0 }}>
                  {new Date(calYear, calMonth, selectedDay).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </h2>
                <span style={{ backgroundColor: "#000c66", color: "#ffffff", borderRadius: "9999px", padding: "0.15rem 0.65rem", fontSize: "0.85rem", fontWeight: 700 }}>
                  {selectedDayEvents.length}
                </span>
                <div style={{ flex: 1, height: "1.5px", backgroundColor: "#cbd5e1" }} />
              </div>

              <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                {selectedDayEvents.map(event => {
                  const color = CATEGORY_COLORS[event.category] ?? "#64748b";
                  return (
                    <div key={event.id} onClick={() => setSelectedEvent(event)} style={{ backgroundColor: "#ffffff", borderRadius: "1.25rem", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", overflow: "hidden", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", borderTop: `4px solid ${color}` }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; }}
                    >
                      <div style={{ padding: "1.25rem" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                          <span style={{ backgroundColor: color, color: "#fff", borderRadius: "9999px", padding: "0.2rem 0.7rem", fontSize: "0.75rem", fontWeight: 700, fontFamily: "var(--font-syne), sans-serif" }}>{event.category}</span>
                          <span style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "#64748b" }}>{formatTime(event.event_time)}</span>
                        </div>
                        <h3 style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "#000000", marginBottom: "0.6rem", lineHeight: 1.3 }}>{event.title}</h3>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#64748b", fontSize: "0.85rem", fontFamily: "var(--font-syne), sans-serif", fontWeight: 600 }}>
                          <MapPin size={14} /> {event.location}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
           LIST VIEW
         ══════════════════════════════════════════════════════════ */}
      {!loading && viewMode === "list" && (
        <>
          {!error && filtered.length === 0 && (
            <div className="text-center py-20 text-muted">
              <Calendar size={48} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
              <p>No events found. Check back later!</p>
            </div>
          )}

          {Object.entries(grouped).map(([month, monthEvents]) => (
            <div key={month} className="mb-12">
              <div className="flex items-center gap-3 mb-8" style={{ width: "100%" }}>
                <h2 style={{ fontFamily: "var(--font-audiowide), sans-serif", fontWeight: 400, fontSize: "1.6rem", color: "#000000", margin: 0, whiteSpace: "nowrap" }}>{month}</h2>
                <span style={{ backgroundColor: "#000c66", color: "#ffffff", borderRadius: "9999px", padding: "0.15rem 0.65rem", fontSize: "0.85rem", fontWeight: 700 }}>{monthEvents.length}</span>
                <div style={{ flex: 1, height: "1.5px", backgroundColor: "#cbd5e1" }} />
              </div>

              <div className="grid gap-8" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))" }}>
                {monthEvents.map(event => {
                  const themeColor  = CATEGORY_COLORS[event.category] ?? "#64748b";
                  const dateObj     = new Date(event.event_date + "T00:00:00");
                  const monthShort  = dateObj.toLocaleDateString("en-US", { month: "short" });
                  const dayNum      = dateObj.getDate();
                  const displayCat  = event.category === "Academic" ? "Acedemic" : event.category;

                  return (
                    <div key={event.id} className="event-card" onClick={() => setSelectedEvent(event)}>
                      <div className="event-card-image-wrapper">
                        {event.image_url ? (
                          <img src={event.image_url} alt={event.title} className="event-card-img" />
                        ) : (
                          <div className="event-card-no-img" style={{ background: `linear-gradient(135deg, ${themeColor}22, ${themeColor}11)` }}>
                            <Calendar size={40} style={{ color: themeColor, opacity: 0.4 }} />
                          </div>
                        )}
                        <span className="event-card-cat-badge" style={{ backgroundColor: themeColor }}>{displayCat}</span>
                        <div className="event-card-date-badge" style={{ backgroundColor: themeColor }}>
                          <div className="event-card-date-month">{monthShort}</div>
                          <div className="event-card-date-day">{dayNum}</div>
                        </div>
                      </div>
                      <div className="event-card-content">
                        <h3 className="event-card-title">{event.title}</h3>
                        <div className="event-card-info-stack">
                          <div className="event-card-info-row"><Clock size={20} style={{ color: "#000000" }} /><span>{formatTime(event.event_time)}</span></div>
                          <div className="event-card-info-row"><MapPin size={20} style={{ color: "#000000" }} /><span>{event.location}</span></div>
                          <div className="event-card-info-row"><Iconlyuser size={20} color="#000000" /><span>{event.organized_by}</span></div>
                        </div>
                        <button className="event-card-btn">View Details</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}

      {/* ── Event Detail Modal ── */}
      {selectedEvent && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.65)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", backdropFilter: "blur(5px)" }}
          onClick={() => setSelectedEvent(null)}
        >
          <div className="event-detail-modal-container" onClick={e => e.stopPropagation()}>
            {/* Left Column - Image */}
            <div className="event-detail-modal-img-col">
              {selectedEvent.image_url ? (
                <img src={selectedEvent.image_url} alt={selectedEvent.title} style={{ width: "100%", height: "100%", objectFit: "contain", position: "absolute", inset: 0 }} />
              ) : (
                <div style={{ height: "100%", background: `linear-gradient(135deg, ${CATEGORY_COLORS[selectedEvent.category] ?? "#8b5cf6"}33, ${CATEGORY_COLORS[selectedEvent.category] ?? "#8b5cf6"}11)`, display: "flex", alignItems: "center", justifyContent: "center", position: "absolute", inset: 0 }}>
                  <Calendar size={80} style={{ color: CATEGORY_COLORS[selectedEvent.category], opacity: 0.4 }} />
                </div>
              )}
            </div>

            {/* Right Column - Details */}
            <div className="event-detail-modal-info-col">
              <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "2.2rem", fontWeight: 800, color: "#000000", marginBottom: "1rem", lineHeight: 1.2 }}>{selectedEvent.title}</h2>
              {selectedEvent.description && (
                <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "1.05rem", fontWeight: 500, color: "#000000", lineHeight: 1.6, marginBottom: "1.25rem", whiteSpace: "pre-wrap" }}>{selectedEvent.description}</p>
              )}
              <div style={{ backgroundColor: "#e6e9ec", borderRadius: "1.8rem", padding: "1.25rem 1.5rem", border: "1px solid rgba(0,0,0,0.03)", marginBottom: "1.25rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem 1.5rem", fontFamily: "var(--font-syne), sans-serif", fontSize: "1rem", fontWeight: 700, color: "#000000" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}><Calendar size={20} style={{ color: "#000000", flexShrink: 0, marginTop: "2px" }} /><span style={{ lineHeight: "1.3" }}>{formatDate(selectedEvent.event_date)}</span></div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}><Clock size={20} style={{ color: "#000000", flexShrink: 0, marginTop: "2px" }} /><span style={{ lineHeight: "1.3" }}>{formatTime(selectedEvent.event_time)}</span></div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}><MapPin size={20} style={{ color: "#000000", flexShrink: 0, marginTop: "2px" }} /><span style={{ lineHeight: "1.3" }}>{selectedEvent.location}</span></div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}><Iconlyuser size={20} color="#000000" style={{ flexShrink: 0, marginTop: "2px" }} /><span style={{ wordBreak: "break-word", lineHeight: "1.3" }}>{selectedEvent.organized_by}</span></div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "auto" }}>
                <button onClick={() => setSelectedEvent(null)} style={{ backgroundColor: "#000c66", color: "#ffffff", border: "none", borderRadius: "9999px", padding: "0.6rem 2.5rem", fontSize: "1rem", fontWeight: 700, fontFamily: "var(--font-syne), sans-serif", cursor: "pointer", transition: "background-color 0.2s" }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
