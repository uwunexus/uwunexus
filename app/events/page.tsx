"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Calendar, MapPin, Clock, Users, Search, Filter, X } from "lucide-react";

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

const CATEGORIES = ["All", "Academic", "Cultural", "Sports", "Club Activity", "Career", "Other"];

const CATEGORY_COLORS: Record<string, string> = {
  Academic:       "var(--accent)",
  Cultural:       "#ec4899",
  Sports:         "var(--success)",
  "Club Activity":"var(--primary)",
  Career:         "var(--warning)",
  Other:          "#94a3b8",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(":");
  const date = new Date();
  date.setHours(parseInt(h), parseInt(m));
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
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
    const matchCat = category === "All" || e.category === category;
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
    <div className="container py-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-2">University Event Calendar</h1>
        <p className="text-muted">Discover and follow upcoming activities at Uva Wellassa University.</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="card mb-8 p-4 flex flex-wrap gap-4 items-center">
        <div style={{ flex: "1 1 260px", position: "relative" }}>
          <Search size={18} className="text-muted" style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search events, locations, organizers..."
            style={{ paddingLeft: "2.5rem" }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="btn text-sm"
              style={{
                padding: "0.4rem 1rem",
                backgroundColor: category === cat ? "var(--primary)" : "var(--secondary)",
                color: category === cat ? "white" : "var(--foreground)",
                border: `1px solid ${category === cat ? "var(--primary)" : "var(--border)"}`,
              }}
            >
              {cat}
            </button>
          ))}
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
        <div key={month} className="mb-12">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
            <span className="text-muted">─</span>
            <span className="gradient-text">{month}</span>
            <span className="badge badge-primary ml-2">{monthEvents.length}</span>
          </h2>
          <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
            {monthEvents.map(event => {
              const catColor = CATEGORY_COLORS[event.category] ?? "#94a3b8";
              return (
                <div
                  key={event.id}
                  className="card p-0 overflow-hidden flex flex-col"
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedEvent(event)}
                >
                  {/* Image */}
                  <div className="aspect-video image-container-blurred" style={{ backgroundImage: event.image_url ? `url(${event.image_url})` : 'none', backgroundColor: "var(--secondary)" }}>
                    {event.image_url ? (
                      <Image
                        src={event.image_url}
                        alt={event.title}
                        fill
                        className="next-image"
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                    ) : (
                      <div className="relative z-10" style={{ height: "100%", background: `linear-gradient(135deg, ${catColor}33, ${catColor}11)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Calendar size={48} style={{ color: catColor, opacity: 0.5 }} />
                      </div>
                    )}
                    {/* Category badge overlaid */}
                    <span className="badge relative z-10" style={{ position: "absolute", top: "0.75rem", left: "0.75rem", backgroundColor: `${catColor}cc`, color: "white" }}>
                      {event.category}
                    </span>
                    {/* Date badge */}
                    <div className="relative z-10" style={{ position: "absolute", top: "0.75rem", right: "0.75rem", backgroundColor: "rgba(15,23,42,0.85)", borderRadius: "0.5rem", padding: "0.35rem 0.65rem", textAlign: "center", minWidth: "48px" }}>
                      <div className="text-xs text-muted">{new Date(event.event_date + "T00:00:00").toLocaleDateString("en-US", { month: "short" })}</div>
                      <div className="font-bold" style={{ fontSize: "1.25rem", lineHeight: 1 }}>{new Date(event.event_date + "T00:00:00").getDate()}</div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col" style={{ flex: 1 }}>
                    <h3 className="font-bold text-lg mb-3" style={{ lineHeight: 1.3 }}>{event.title}</h3>
                    <div className="flex flex-col gap-2 text-muted text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        <span>{formatTime(event.event_time)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={14} />
                        <span>{event.organized_by}</span>
                      </div>
                    </div>
                    <button
                      className="btn mt-auto w-full text-sm justify-center"
                      style={{ border: `1px solid ${catColor}`, color: catColor, backgroundColor: `${catColor}11` }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Modal */}
      {selectedEvent && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="card"
            style={{ maxWidth: "600px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: 0 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal image */}
            <div style={{ position: "relative", height: "250px", backgroundColor: "var(--secondary)" }}>
              {selectedEvent.image_url ? (
                <Image src={selectedEvent.image_url} alt={selectedEvent.title} fill sizes="600px" style={{ objectFit: "cover" }} />
              ) : (
                <div style={{ height: "100%", background: `linear-gradient(135deg, ${CATEGORY_COLORS[selectedEvent.category] ?? "#8b5cf6"}33, ${CATEGORY_COLORS[selectedEvent.category] ?? "#8b5cf6"}11)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Calendar size={64} style={{ color: CATEGORY_COLORS[selectedEvent.category], opacity: 0.4 }} />
                </div>
              )}
              <button
                onClick={() => setSelectedEvent(null)}
                style={{ position: "absolute", top: "0.75rem", right: "0.75rem", backgroundColor: "rgba(15,23,42,0.85)", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white" }}
              >
                <X size={18} />
              </button>
              <span className="badge" style={{ position: "absolute", bottom: "0.75rem", left: "0.75rem", backgroundColor: CATEGORY_COLORS[selectedEvent.category], color: "white" }}>
                {selectedEvent.category}
              </span>
            </div>

            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">{selectedEvent.title}</h2>
              {selectedEvent.description && (
                <p className="text-muted mb-6" style={{ lineHeight: 1.7 }}>{selectedEvent.description}</p>
              )}
              <div className="grid gap-3 text-sm mb-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div className="flex items-center gap-2">
                  <Calendar size={16} style={{ color: "var(--primary)" }} />
                  <span>{formatDate(selectedEvent.event_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} style={{ color: "var(--accent)" }} />
                  <span>{formatTime(selectedEvent.event_time)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} style={{ color: "var(--danger)" }} />
                  <span>{selectedEvent.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={16} style={{ color: "var(--success)" }} />
                  <span>{selectedEvent.organized_by}</span>
                </div>
              </div>
              <button className="btn btn-primary w-full justify-center" onClick={() => setSelectedEvent(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
