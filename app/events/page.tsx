"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Calendar, MapPin, Clock, Users, Search, Filter, X, ChevronDown } from "lucide-react";

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
  Academic: "#000c66", // Navy Blue
  Cultural: "#b25e00", // Dark Gold/Orange
  Sports: "#0e9f6e", // Green
  "Club Activity": "#0088cc", // Bright Blue
  Career: "#d03801", // Red/Orange
  Other: "#64748b", // Slate
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(":");
  const date = new Date();
  date.setHours(parseInt(h), parseInt(m));

  // Format as "9.00 a.m" or "7.00 p.m" to match the mockup style
  let hours = date.getHours();
  const ampm = hours >= 12 ? 'p.m' : 'a.m';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  return `${hours}.00 ${ampm}`;
}

export const Iconlyuser = ({ size = 24, color = "#000000", style = {} }: { size?: number; color?: string; style?: React.CSSProperties }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <path d="M12.232 20.575C9.83398 20.58 7.58698 20.132 5.67798 18.969C6.62598 15.97 9.19798 14.582 12.232 14.59C15.262 14.582 17.838 15.974 18.785 18.969C17.766 19.59 16.651 20.007 15.468 20.26" stroke={color} strokeWidth="1.5" strokeLinecap="square"></path>
      <path d="M6.84476 13.7399C4.71976 13.7349 2.91376 14.7099 2.24976 16.8099C2.61276 17.0309 2.99176 17.2149 3.38676 17.3659" stroke={color} strokeWidth="1.5" strokeLinecap="square"></path>
      <path d="M17.656 13.7399C19.78 13.7349 21.586 14.7099 22.25 16.8099C21.861 17.0479 21.451 17.2419 21.025 17.3989" stroke={color} strokeWidth="1.5" strokeLinecap="square"></path>
      <path d="M12.9826 3.42493C14.8966 3.76993 16.3486 5.44493 16.3486 7.45793C16.3486 9.72193 14.5136 11.5569 12.2496 11.5569C9.98661 11.5569 8.15161 9.72193 8.15161 7.45793C8.15161 6.20893 8.71061 5.08993 9.59261 4.33793" stroke={color} strokeWidth="1.5" strokeLinecap="square"></path>
      <path d="M17.656 5.86682C19.246 5.86682 20.536 7.15582 20.536 8.74682C20.536 10.3368 19.246 11.6268 17.656 11.6268" stroke={color} strokeWidth="1.5" strokeLinecap="square"></path>
      <path d="M6.84509 5.86682C5.25409 5.86682 3.96509 7.15582 3.96509 8.74682C3.96509 10.3368 5.25409 11.6268 6.84509 11.6268" stroke={color} strokeWidth="1.5" strokeLinecap="square"></path>
    </svg> 
  );
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/get_events.php`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setEvents(data.events);
        else setError(data.message);
      })
      .catch(() => setError("Could not connect to backend."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = events.filter(e => {
    // Map "Academics" filter button back to "Academic" category stored in DB
    const dbCategory = category === "Academics" ? "Academic" : category;
    const matchCat = category === "All" || e.category === dbCategory;

    const q = search.toLowerCase();
    const matchSearch = !q ||
      e.title.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q) ||
      e.organized_by.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  // Group events by month
  const grouped: Record<string, Event[]> = {};
  filtered.forEach(e => {
    const d = new Date(e.event_date + "T00:00:00");
    const key = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });

  return (
    <div className="container events-container">
      {/* Header */}
      <div className="events-header text-left">
        <h1 className="events-title mb-2">
          University Event Calendar
        </h1>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap gap-4 items-center mb-10 events-controls-row" style={{ width: '100%', marginTop: '1rem', paddingBottom: '1.5rem' }}>
        {/* Search bar wrapper matching mockup design */}
        <div className="events-search-wrapper">
          <input
            type="text"
            className="form-input"
            placeholder="Search events..."
            style={{
              paddingLeft: "1.25rem",
              paddingRight: "2.5rem",
              borderRadius: "9999px",
              border: "1.5px solid #e2e8f0",
              backgroundColor: "#ffffff",
              height: "43px",
              width: "100%",
              outline: "none",
              fontSize: "0.95rem",
              fontFamily: "var(--font-inclusive-sans), sans-serif"
            }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Search size={18} style={{ position: "absolute", right: "1.25rem", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
        </div>

        {/* Desktop Filter Buttons */}
        <div className="desktop-filter-buttons flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => {
            const isActive = category === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  height: "43px",
                  padding: "0 1.25rem",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  whiteSpace: "nowrap",
                  borderRadius: "9999px",
                  backgroundColor: isActive ? "#000c66" : "#ffffff",
                  color: isActive ? "#ffffff" : "#000c66",
                  border: `1.5px solid ${isActive ? "#000c66" : "#e2e8f0"}`,
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  fontFamily: "var(--font-inter), sans-serif",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Mobile Category Connected Navy Dropdown */}
        <div className="mobile-category-select" style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{
              height: "36px",
              paddingLeft: "0.85rem",
              paddingRight: "0.75rem",
              borderRadius: isDropdownOpen ? "1rem 1rem 0 0" : "9999px",
              border: "1.5px solid #000c66",
              backgroundColor: "#000c66",
              color: "#ffffff",
              fontSize: "0.8rem",
              fontWeight: 600,
              fontFamily: "var(--font-inter), sans-serif",
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              gap: "0.4rem",
              transition: "border-radius 0.2s ease"
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {category === "All" ? "All Categories" : category}
            </span>
            <ChevronDown
              size={15}
              style={{
                color: "#ffffff",
                transition: "transform 0.2s ease",
                transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                flexShrink: 0
              }}
            />
          </button>

          {/* Connected Navy Dropdown Menu */}
          {isDropdownOpen && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 40 }}
                onClick={() => setIsDropdownOpen(false)}
              />
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "#000c66",
                  borderRadius: "0 0 1rem 1rem",
                  padding: "0.4rem 0.5rem 0.5rem 0.5rem",
                  boxShadow: "0 12px 25px rgba(0, 12, 102, 0.25)",
                  border: "1.5px solid #000c66",
                  borderTop: "none",
                  zIndex: 50,
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px"
                }}
              >
                {CATEGORIES.map(cat => {
                  const isSelected = category === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setCategory(cat);
                        setIsDropdownOpen(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "0.45rem 0.75rem",
                        borderRadius: "0.6rem",
                        fontSize: "0.8rem",
                        fontWeight: isSelected ? 700 : 500,
                        fontFamily: "var(--font-inter), sans-serif",
                        color: "#ffffff",
                        backgroundColor: isSelected ? "rgba(255, 255, 255, 0.2)" : "transparent",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        transition: "all 0.15s ease",
                        cursor: "pointer"
                      }}
                    >
                      <span>{cat === "All" ? "All Categories" : cat}</span>
                      {isSelected && <span style={{ fontSize: "0.75rem", color: "#ffffff" }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 mb-6 rounded text-sm" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-20 text-muted">Loading events...</div>
      )}

      {/* No Events */}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-20 text-muted">
          <Calendar size={48} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
          <p>No events found. Check back later!</p>
        </div>
      )}

      {/* Events grouped by month */}
      {!loading && Object.entries(grouped).map(([month, monthEvents]) => (
        <div key={month} className="month-group-wrapper">
          {/* Monthly group header divider */}
          <div className="flex items-center gap-3 mb-8 month-group-divider" style={{ width: '100%' }}>
            <h2 className="month-group-title">
              {month}
            </h2>
            <span className="month-group-badge">
              {monthEvents.length}
            </span>
            <div style={{ flex: 1, height: '1.5px', backgroundColor: '#cbd5e1' }}></div>
          </div>

          {/* Cards Grid */}
          <div className="events-cards-grid">
            {monthEvents.map(event => {
              const themeColor = CATEGORY_COLORS[event.category] ?? "#64748b";
              const dateObj = new Date(event.event_date + "T00:00:00");
              const monthShort = dateObj.toLocaleDateString("en-US", { month: "short" });
              const dayNum = dateObj.getDate();

              // Map database category value to user-facing filter label
              const displayCategory = event.category === "Academic" ? "Acedemic" : event.category;

              return (
                <div
                  key={event.id}
                  className="event-card"
                  onClick={() => setSelectedEvent(event)}
                >
                  {/* Image wrapper with padded container */}
                  <div className="event-card-image-wrapper">
                    {event.image_url ? (
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="event-card-img"
                      />
                    ) : (
                      <div className="event-card-no-img" style={{ background: `linear-gradient(135deg, ${themeColor}22, ${themeColor}11)` }}>
                        <Calendar size={40} style={{ color: themeColor, opacity: 0.4 }} />
                      </div>
                    )}
                    {/* Floating Category Badge */}
                    <span className="event-card-cat-badge" style={{ backgroundColor: themeColor }}>
                      {displayCategory}
                    </span>
                    {/* Floating Date Badge */}
                    <div className="event-card-date-badge" style={{ backgroundColor: themeColor }}>
                      <div className="event-card-date-month">{monthShort}</div>
                      <div className="event-card-date-day">{dayNum}</div>
                    </div>
                  </div>

                  {/* Content Stack */}
                  <div className="event-card-content">
                    <h3 className="event-card-title">{event.title}</h3>

                    <div className="event-card-info-stack">
                      <div className="event-card-info-row">
                        <Clock size={20} style={{ color: '#000000' }} />
                        <span>{formatTime(event.event_time)}</span>
                      </div>
                      <div className="event-card-info-row">
                        <MapPin size={20} style={{ color: '#000000' }} />
                        <span>{event.location}</span>
                      </div>
                      <div className="event-card-info-row">
                        <Iconlyuser size={20} color="#000000" />
                        <span>{event.organized_by}</span>
                      </div>
                    </div>

                    <button className="event-card-btn">
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Modal Details Dialog */}
      {selectedEvent && (
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
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="event-detail-modal-container"
            onClick={e => e.stopPropagation()}
          >
            {/* Left Column - Image */}
            <div className="event-detail-modal-img-col">
              {selectedEvent.image_url ? (
                <img 
                  src={selectedEvent.image_url} 
                  alt={selectedEvent.title} 
                  style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} 
                />
              ) : (
                <div style={{ height: "100%", background: `linear-gradient(135deg, ${CATEGORY_COLORS[selectedEvent.category] ?? "#8b5cf6"}33, ${CATEGORY_COLORS[selectedEvent.category] ?? "#8b5cf6"}11)`, display: "flex", alignItems: "center", justifyContent: "center", position: "absolute", inset: 0 }}>
                  <Calendar size={80} style={{ color: CATEGORY_COLORS[selectedEvent.category], opacity: 0.4 }} />
                </div>
              )}
            </div>

            {/* Right Column - Details */}
            <div className="event-detail-modal-info-col">
              <h2 className="event-detail-modal-title">
                {selectedEvent.title}
              </h2>
              
              {selectedEvent.description && (
                <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "1rem", fontWeight: 500, color: "#000000", lineHeight: 1.5, marginBottom: "1rem" }}>
                  {selectedEvent.description}
                </p>
              )}

              {/* Nested Silver Metadata Card */}
              <div className="event-detail-modal-meta-card">
                <div className="event-detail-modal-meta-grid">
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    <Calendar size={18} style={{ color: "#000000", flexShrink: 0, marginTop: "2px" }} />
                    <span style={{ lineHeight: "1.3" }}>{formatDate(selectedEvent.event_date)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    <Clock size={18} style={{ color: "#000000", flexShrink: 0, marginTop: "2px" }} />
                    <span style={{ lineHeight: "1.3" }}>{formatTime(selectedEvent.event_time)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    <MapPin size={18} style={{ color: "#000000", flexShrink: 0, marginTop: "2px" }} />
                    <span style={{ lineHeight: "1.3" }}>{selectedEvent.location}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    <Iconlyuser size={18} color="#000000" style={{ flexShrink: 0, marginTop: "2px" }} />
                    <span style={{ wordBreak: "break-word", lineHeight: "1.3" }}>
                      {selectedEvent.organized_by}
                    </span>
                  </div>
                </div>
              </div>

              {/* Close Button Row */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "auto" }}>
                <button 
                  onClick={() => setSelectedEvent(null)}
                  style={{ 
                    backgroundColor: "#000c66", 
                    color: "#ffffff", 
                    border: "none", 
                    borderRadius: "9999px", 
                    padding: "0.6rem 2.5rem", 
                    fontSize: "1rem", 
                    fontWeight: 700, 
                    fontFamily: "var(--font-syne), sans-serif", 
                    cursor: "pointer",
                    transition: "background-color 0.2s"
                  }}
                >
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
