"use client";

import { useState, useEffect } from "react";
<<<<<<< Updated upstream
import { Phone, FileText, UserCircle, Search as SearchIcon, ExternalLink, Mail, Award, Loader } from "lucide-react";
=======
import { BookOpen, Phone, FileText, UserCircle, Search as SearchIcon, ExternalLink, Mail, Smartphone, Award } from "lucide-react";
>>>>>>> Stashed changes

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
  const [search, setSearch] = useState("");
<<<<<<< Updated upstream
  const [activeCategory, setActiveCategory] = useState("procedure");
=======
  const [activeTab, setActiveTab] = useState<"procedure" | "hotline" | "contact">("procedure");
>>>>>>> Stashed changes

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api/backend'}/get_info_hub.php`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setItems(data.items);
        }
      })
      .catch(console.error)
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
<<<<<<< Updated upstream
    <div className="container relative min-h-screen" style={{ maxWidth: '1210px', marginTop: '1.5rem', paddingBottom: '4rem' }}>

      {/* Title & Subtitle */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontSize: "3.2rem",
          fontWeight: 700,
          color: "#000000",
          letterSpacing: "-0.02em",
          marginBottom: "0.5rem"
=======
    <div style={{ maxWidth: "1210px", margin: "1.5rem auto", padding: "0 1rem", minHeight: "100vh", position: "relative" }}>
      {/* Title & Subtitle */}
      <div style={{ textAlign: "left", marginBottom: "2rem" }}>
        <h1 style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontSize: "3rem",
          fontWeight: 700,
          color: "#000000",
          margin: "0 0 0.5rem 0"
>>>>>>> Stashed changes
        }}>
          Information Hub
        </h1>
        <p style={{
          fontFamily: "var(--font-roboto), sans-serif",
<<<<<<< Updated upstream
          fontSize: "1.05rem",
          color: "#2f2f2fff",
          margin: 0,
          lineHeight: "1.6"
=======
          fontSize: "1.1rem",
          color: "#505255",
          margin: 0
>>>>>>> Stashed changes
        }}>
          Your primary point of reference for all university procedures, contacts, and emergency information.
        </p>
      </div>

<<<<<<< Updated upstream
      {/* Control Bar (Search & Tab Capsule) */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
        flexWrap: "wrap",
        marginBottom: "1.5rem"
      }}>

        {/* Pill-shaped Search Bar */}
        <div style={{ position: "relative", width: "100%", maxWidth: "574px" }}>
          <input
            type="text"
            placeholder="search here....."
=======
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
>>>>>>> Stashed changes
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              height: "48px",
              borderRadius: "9999px",
              border: "1.5px solid #d1d5db",
              backgroundColor: "#ffffff",
              padding: "0 3.5rem 0 1.5rem",
              fontSize: "0.95rem",
              fontFamily: "var(--font-roboto), sans-serif",
              fontWeight: 400,
              color: "#000000",
              outline: "none"
            }}
          />
<<<<<<< Updated upstream
          <SearchIcon
            size={18}
            style={{
              position: "absolute",
              right: "1.25rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
              pointerEvents: "none"
            }}
          />
        </div>

        {/* Tab Selection Capsule */}
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
          <button
            onClick={() => setActiveCategory("procedure")}
            style={{
              border: "none",
              backgroundColor: activeCategory === "procedure" ? "#000c66" : "transparent",
              color: activeCategory === "procedure" ? "#ffffff" : "#000c66",
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
            <FileText size={16} />
            University Procedures
          </button>
          <button
            onClick={() => setActiveCategory("hotline")}
            style={{
              border: "none",
              backgroundColor: activeCategory === "hotline" ? "#000c66" : "transparent",
              color: activeCategory === "hotline" ? "#ffffff" : "#000c66",
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
            <Phone size={16} />
            Emergency Hotlines
          </button>
          <button
            onClick={() => setActiveCategory("contact")}
            style={{
              border: "none",
              backgroundColor: activeCategory === "contact" ? "#000c66" : "transparent",
              color: activeCategory === "contact" ? "#ffffff" : "#000c66",
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
            <UserCircle size={16} />
            Key Contacts
=======
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
>>>>>>> Stashed changes
          </button>
        </div>
      </div>

<<<<<<< Updated upstream
      {/* Horizontal Divider Line */}
      <hr style={{ border: 0, borderTop: "1.5px solid rgba(0, 12, 102, 0.1)", margin: "0.5rem 0 2rem 0" }} />

      {/* Active Tab Cards Display */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
          <Loader size={40} className="text-muted" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        <div>

          {/* Procedures Category View */}
          {activeCategory === "procedure" && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
              {procedures.length === 0 ? (
                <div style={{ fontFamily: "var(--font-roboto), sans-serif", color: "#64748b", fontStyle: "italic", padding: "1rem" }}>No procedures found.</div>
              ) : (
                procedures.map(proc => (
                  <div
                    key={proc.id}
                    style={{
                      flex: "1 1 calc((100% - 3rem) / 3)",
                      minWidth: "290px",
                      maxWidth: "380px",
                      backgroundColor: "#edf4fe",
                      border: "1px solid rgba(0, 12, 102, 0.15)",
                      borderRadius: "2rem",
                      padding: "1.5rem 1.75rem",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
                      <div style={{
                        backgroundColor: "#000c66",
                        borderRadius: "9999px",
                        padding: "0.5rem 1.25rem",
                        color: "#ffffff",
                        fontFamily: "var(--font-syne), sans-serif",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        alignSelf: "flex-start",
                        marginBottom: "1rem",
                        textAlign: "center"
                      }}>
                        {proc.title}
                      </div>
                      <p style={{
                        fontFamily: "var(--font-roboto), sans-serif",
                        fontWeight: 400,
                        fontSize: "0.9rem",
                        color: "#000000",
                        lineHeight: "1.5",
                        margin: "0 0 1.25rem 0",
                        whiteSpace: "pre-wrap"
                      }}>
                        {proc.description}
                      </p>
                    </div>
                    {proc.action_text && proc.action_link && (
                      <a
                        href={proc.action_link}
                        target="_blank"
                        rel="noreferrer"
                        className="proc-action-btn"
                        style={{
                          alignSelf: "flex-end",
                          backgroundColor: "#ffffff",
                          border: "1.5px solid #000000",
                          borderRadius: "9999px",
                          padding: "0.45rem 1.25rem",
                          color: "#000000",
                          fontFamily: "var(--font-roboto), sans-serif",
                          fontWeight: 500,
                          fontSize: "0.85rem",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          transition: "all 0.2s"
                        }}
                      >
                        <ExternalLink size={14} />
                        {proc.action_text}
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Emergency Hotlines Category View */}
          {activeCategory === "hotline" && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
              {hotlines.length === 0 ? (
                <div style={{ fontFamily: "var(--font-roboto), sans-serif", color: "#64748b", fontStyle: "italic", padding: "1rem" }}>No hotlines found.</div>
              ) : (
                hotlines.map(hotline => (
                  <div
                    key={hotline.id}
                    style={{
                      flex: "1 1 calc((100% - 1.5rem) / 2)",
                      minWidth: "300px",
                      maxWidth: "580px",
                      backgroundColor: "#edf4fe",
                      border: "1px solid rgba(0, 12, 102, 0.15)",
                      borderRadius: "2rem",
                      padding: "1.5rem 2rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
                    }}
                  >
                    <h3 style={{
                      fontFamily: "var(--font-syne), sans-serif",
                      fontSize: "1.6rem",
                      fontWeight: 600,
                      color: "#000000",
                      margin: 0
                    }}>
                      {hotline.title}
                    </h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
                      {hotline.description && (
                        <div style={{
                          backgroundColor: "#ffffff",
                          borderRadius: "9999px",
                          border: "1.5px solid #d1d5db",
                          padding: "0.6rem 1.5rem",
                          color: "#000000",
                          fontFamily: "var(--font-roboto), sans-serif",
                          fontWeight: 400,
                          fontSize: "0.95rem",
                          display: "flex",
                          alignItems: "center"
                        }}>
                          {hotline.description}
                        </div>
                      )}
                      {hotline.contact_info && (
                        <a
                          href={`tel:${hotline.contact_info}`}
                          style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "9999px",
                            border: "1.5px solid #d1d5db",
                            padding: "0.6rem 1.25rem",
                            color: "#000000",
                            fontFamily: "var(--font-roboto), sans-serif",
                            fontWeight: 500,
                            fontSize: "0.95rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            textDecoration: "none"
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

          {/* Key Contacts Category View */}
          {activeCategory === "contact" && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
              {contacts.length === 0 ? (
                <div style={{ fontFamily: "var(--font-roboto), sans-serif", color: "#64748b", fontStyle: "italic", padding: "1rem" }}>No contacts found.</div>
              ) : (
                contacts.map(contact => (
                  <div
                    key={contact.id}
                    style={{
                      flex: "1 1 calc((100% - 3rem) / 3)",
                      minWidth: "290px",
                      maxWidth: "380px",
                      backgroundColor: "#edf4fe",
                      border: "1px solid rgba(0, 12, 102, 0.15)",
                      borderRadius: "2rem",
                      padding: "1.5rem 1.5rem",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
                    }}
                  >
                    <div style={{
                      backgroundColor: "#000c66",
                      borderRadius: "9999px",
                      padding: "0.6rem 2rem",
                      color: "#ffffff",
                      fontFamily: "var(--font-syne), sans-serif",
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      textAlign: "center",
                      width: "100%",
                      marginBottom: "1.25rem"
                    }}>
                      {contact.title}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", padding: "0.25rem 0" }}>
                        <Award size={18} style={{ color: "#000c66", minWidth: "18px" }} />
                        <span style={{
                          fontFamily: "var(--font-roboto), sans-serif",
                          fontWeight: 400,
                          fontSize: "0.975rem",
                          color: "#000000"
                        }}>
                          {contact.description}
                        </span>
                      </div>

                      {contact.contact_info && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", padding: "0.25rem 0" }}>
                          <Mail size={18} style={{ color: "#000c66", minWidth: "18px" }} />
                          <a
                            href={contact.contact_info.includes('@') ? `mailto:${contact.contact_info}` : `tel:${contact.contact_info}`}
                            style={{
                              fontFamily: "var(--font-roboto), sans-serif",
                              fontWeight: 400,
                              fontSize: "0.975rem",
                              color: "#000000",
                              textDecoration: "none"
                            }}
                          >
                            {contact.contact_info}
=======
      {/* Main Content Area */}
      <div style={{ marginTop: "2rem", paddingBottom: "3rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "#64748b", fontFamily: "var(--font-roboto), sans-serif" }}>
            Loading information...
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
>>>>>>> Stashed changes
                          </a>
                        </div>
                      )}
                    </div>
<<<<<<< Updated upstream
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      )}

      {/* Styles for spinner rotation and hover actions */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .proc-action-btn:hover {
          background-color: #000000 !important;
          color: #ffffff !important;
        }
      `}</style>
=======
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

                      {/* Details row: Email Link */}
                      {contact.contact_info && (
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          fontSize: "0.95rem",
                          fontFamily: "var(--font-roboto), sans-serif"
                        }}>
                          <Mail size={20} style={{ color: "#000c66", flexShrink: 0 }} />
                          <a 
                            href={`mailto:${contact.contact_info}`} 
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
>>>>>>> Stashed changes
    </div>
  );
}
