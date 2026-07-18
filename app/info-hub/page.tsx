"use client";

import { useState, useEffect } from "react";
import { Phone, FileText, UserCircle, Search as SearchIcon, ExternalLink, Mail, Award, Loader } from "lucide-react";

interface InfoItem {
  id: number;
  category: string;
  title: string;
  description: string;
  contact_info: string;
  action_link: string;
  action_text: string;
}

export default function InfoHubPage() {
  const [items, setItems] = useState<InfoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"procedure" | "hotline" | "contact">("procedure");

  useEffect(() => {
    setError(null);
    fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api/backend'}/get_info_hub.php`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (data.success && Array.isArray(data.items)) {
          setItems(data.items);
        } else {
          setError(data.message || "Failed to load information from the server.");
        }
      })
      .catch(err => {
        console.error("Fetch error on Info Hub:", err);
        setError(err.message || "Could not connect to the backend server. Please verify the backend is running.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.description.toLowerCase().includes(search.toLowerCase())
  );

  const procedures = filteredItems.filter(i => i.category === 'procedure');
  const hotlines = filteredItems.filter(i => i.category === 'hotline');
  const contacts = filteredItems.filter(i => i.category === 'contact');

  return (
    <div style={{ maxWidth: "1210px", margin: "1.5rem auto", padding: "0 1rem", minHeight: "100vh", position: "relative" }}>
      {/* Title & Subtitle */}
      <div style={{ textAlign: "left", marginBottom: "2rem" }}>
        <h1 style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontSize: "3rem",
          fontWeight: 700,
          color: "#000000",
          margin: "0 0 0.5rem 0"
        }}>
          Information Hub
        </h1>
        <p style={{
          fontFamily: "var(--font-roboto), sans-serif",
          fontSize: "1.1rem",
          color: "#505255",
          margin: 0
        }}>
          Your primary point of reference for all university procedures, contacts, and emergency information.
        </p>
      </div>

      {/* Control row: Search and Switcher Tab Capsule */}
      <div style={{
        display: "flex",
        gap: "1.5rem",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: "1.5rem",
        borderBottom: "1.5px solid rgba(0, 12, 102, 0.1)"
      }}>
        {/* Search Bar */}
        <div style={{ position: "relative", maxWidth: "450px", width: "100%" }}>
          <input 
            type="text" 
            style={{
              width: "100%",
              height: "48px",
              borderRadius: "9999px",
              border: "1.5px solid #d1d5db",
              padding: "0 3.5rem 0 1.5rem",
              fontSize: "1rem",
              fontFamily: "var(--font-roboto), sans-serif",
              backgroundColor: "#ffffff",
              outline: "none",
              color: "#000000"
            }}
            placeholder="search the procedure or contacts"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <SearchIcon size={20} style={{ position: "absolute", right: "1.5rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
        </div>

        {/* Sub Navigation switcher tabs */}
        <div style={{
          display: "flex",
          backgroundColor: "#edf4fe",
          borderRadius: "9999px",
          padding: "0.25rem",
          border: "1.5px solid rgba(0, 12, 102, 0.1)",
          gap: "0.25rem",
          flexWrap: "wrap"
        }}>
          <button 
            onClick={() => setActiveTab("procedure")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.6rem 1.25rem",
              borderRadius: "9999px",
              fontSize: "0.95rem",
              fontWeight: 600,
              fontFamily: "var(--font-roboto), sans-serif",
              cursor: "pointer",
              border: "none",
              backgroundColor: activeTab === "procedure" ? "#000c66" : "transparent",
              color: activeTab === "procedure" ? "#ffffff" : "#000c66",
              transition: "all 0.2s"
            }}
          >
            <FileText size={16} /> University Procedures
          </button>
          <button 
            onClick={() => setActiveTab("hotline")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.6rem 1.25rem",
              borderRadius: "9999px",
              fontSize: "0.95rem",
              fontWeight: 600,
              fontFamily: "var(--font-roboto), sans-serif",
              cursor: "pointer",
              border: "none",
              backgroundColor: activeTab === "hotline" ? "#000c66" : "transparent",
              color: activeTab === "hotline" ? "#ffffff" : "#000c66",
              transition: "all 0.2s"
            }}
          >
            <Phone size={16} /> Emergency Hotlines
          </button>
          <button 
            onClick={() => setActiveTab("contact")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.6rem 1.25rem",
              borderRadius: "9999px",
              fontSize: "0.95rem",
              fontWeight: 600,
              fontFamily: "var(--font-roboto), sans-serif",
              cursor: "pointer",
              border: "none",
              backgroundColor: activeTab === "contact" ? "#000c66" : "transparent",
              color: activeTab === "contact" ? "#ffffff" : "#000c66",
              transition: "all 0.2s"
            }}
          >
            <UserCircle size={16} /> Key Contacts
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ marginTop: "2rem", paddingBottom: "3rem" }}>
        {error && (
          <div style={{
            backgroundColor: "rgba(239, 68, 68, 0.08)",
            border: "1.5px solid rgba(239, 68, 68, 0.2)",
            color: "#ef4444",
            borderRadius: "1rem",
            padding: "1.25rem",
            marginBottom: "1.5rem",
            fontFamily: "var(--font-roboto), sans-serif",
            fontWeight: 500,
            textAlign: "center"
          }}>
            {error}
          </div>
        )}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
            <Loader size={40} className="text-muted" style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : (
          <>
            {/* Procedures Tab */}
            {activeTab === "procedure" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {procedures.length === 0 ? (
                  <div style={{ color: "#64748b", fontStyle: "italic", padding: "2rem 0", fontFamily: "var(--font-roboto), sans-serif" }}>No procedures found.</div>
                ) : (
                  procedures.map(proc => (
                    <div key={proc.id} style={{
                      backgroundColor: "#edf4fe",
                      border: "1.5px solid rgba(0, 12, 102, 0.1)",
                      borderRadius: "1.5rem",
                      padding: "1.75rem",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
                    }}>
                      <h3 style={{
                        fontFamily: "var(--font-syne), sans-serif",
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        color: "#000000",
                        marginBottom: "1rem"
                      }}>
                        {proc.title}
                      </h3>
                      <div style={{
                        backgroundColor: "#ffffff",
                        border: "1.5px solid rgba(0, 12, 102, 0.05)",
                        borderRadius: "1rem",
                        padding: "1.25rem",
                        fontSize: "0.95rem",
                        color: "#334155",
                        fontFamily: "var(--font-roboto), sans-serif",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                        marginBottom: proc.action_text && proc.action_link ? "1.5rem" : 0
                      }}>
                        {proc.description}
                      </div>

                      {proc.action_text && proc.action_link && (
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <a 
                            href={proc.action_link} 
                            target="_blank" 
                            rel="noreferrer" 
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              backgroundColor: "#000c66",
                              color: "#ffffff",
                              borderRadius: "9999px",
                              padding: "0.6rem 1.25rem",
                              fontSize: "0.9rem",
                              fontWeight: 600,
                              fontFamily: "var(--font-roboto), sans-serif",
                              textDecoration: "none",
                              transition: "opacity 0.2s"
                            }}
                            onMouseOver={e => e.currentTarget.style.opacity = "0.9"}
                            onMouseOut={e => e.currentTarget.style.opacity = "1"}
                          >
                            <ExternalLink size={14} />
                            {proc.action_text}
                          </a>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Emergency Hotlines Tab */}
            {activeTab === "hotline" && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: "1.5rem"
              }}>
                {hotlines.length === 0 ? (
                  <div style={{ color: "#64748b", fontStyle: "italic", padding: "2rem 0", fontFamily: "var(--font-roboto), sans-serif", gridColumn: "1 / -1" }}>No hotlines found.</div>
                ) : (
                  hotlines.map(hotline => (
                    <div key={hotline.id} style={{
                      backgroundColor: "#edf4fe",
                      border: "1.5px solid rgba(0, 12, 102, 0.1)",
                      borderRadius: "1.5rem",
                      padding: "1.5rem",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between"
                    }}>
                      <h3 style={{
                        fontFamily: "var(--font-syne), sans-serif",
                        fontSize: "1.6rem",
                        fontWeight: 700,
                        color: "#000000",
                        marginBottom: "1rem"
                      }}>
                        {hotline.title}
                      </h3>
                      
                      <div style={{
                        display: "flex",
                        gap: "0.5rem",
                        alignItems: "center",
                        justifyContent: "space-between"
                      }}>
                        {/* Description Pill */}
                        <div style={{
                          backgroundColor: "#ffffff",
                          border: "1.5px solid rgba(0, 12, 102, 0.05)",
                          borderRadius: "9999px",
                          padding: "0.5rem 1rem",
                          fontSize: "0.85rem",
                          color: "#505255",
                          fontFamily: "var(--font-roboto), sans-serif",
                          flex: 1,
                          marginRight: "0.5rem",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}>
                          {hotline.description || "Emergency Line"}
                        </div>

                        {/* Phone Dialer Link Pill */}
                        {hotline.contact_info && (
                          <a 
                            href={`tel:${hotline.contact_info}`}
                            style={{
                              backgroundColor: "#ffffff",
                              border: "1.5px solid rgba(0, 12, 102, 0.05)",
                              borderRadius: "9999px",
                              padding: "0.5rem 1rem",
                              fontSize: "0.95rem",
                              fontWeight: 700,
                              fontFamily: "var(--font-syne), sans-serif",
                              color: "#000000",
                              textDecoration: "none",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              whiteSpace: "nowrap"
                            }}
                          >
                            <Phone size={14} style={{ color: "#000c66" }} />
                            {hotline.contact_info}
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Key Contacts Tab */}
            {activeTab === "contact" && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "1.5rem"
              }}>
                {contacts.length === 0 ? (
                  <div style={{ color: "#64748b", fontStyle: "italic", padding: "2rem 0", fontFamily: "var(--font-roboto), sans-serif", gridColumn: "1 / -1" }}>No contacts found.</div>
                ) : (
                  contacts.map(contact => (
                    <div key={contact.id} style={{
                      backgroundColor: "#edf4fe",
                      border: "1.5px solid rgba(0, 12, 102, 0.1)",
                      borderRadius: "1.5rem",
                      padding: "1.5rem",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "stretch"
                    }}>
                      {/* Top Centered Navy Banner Capsule */}
                      <div style={{
                        backgroundColor: "#000c66",
                        color: "#ffffff",
                        borderRadius: "9999px",
                        padding: "0.6rem 1rem",
                        fontFamily: "var(--font-syne), sans-serif",
                        fontWeight: 700,
                        fontSize: "1.1rem",
                        textAlign: "center",
                        marginBottom: "1.25rem"
                      }}>
                        {contact.title}
                      </div>

                      {/* Details row: Designation */}
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        marginBottom: "0.75rem",
                        fontSize: "0.95rem",
                        fontFamily: "var(--font-roboto), sans-serif",
                        color: "#000000"
                      }}>
                        <Award size={20} style={{ color: "#000c66", flexShrink: 0 }} />
                        <span>{contact.description}</span>
                      </div>

                      {/* Details row: Contact Link */}
                      {contact.contact_info && (
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          fontSize: "0.95rem",
                          fontFamily: "var(--font-roboto), sans-serif"
                        }}>
                          {contact.contact_info.includes('@') ? (
                            <Mail size={20} style={{ color: "#000c66", flexShrink: 0 }} />
                          ) : (
                            <Phone size={20} style={{ color: "#000c66", flexShrink: 0 }} />
                          )}
                          <a 
                            href={contact.contact_info.includes('@') ? `mailto:${contact.contact_info}` : `tel:${contact.contact_info}`} 
                            style={{ 
                              color: "#000000", 
                              textDecoration: "none",
                              wordBreak: "break-all"
                            }}
                            className="hover:underline"
                          >
                            {contact.contact_info}
                          </a>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Styles for spinner rotation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
