"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Phone, X, Upload, Image as ImageIcon, Edit, Tag, Plus, Store } from "lucide-react";
import { uploadToCloudinary } from "../lib/cloudinary";

interface Category {
  id: number;
  name: string;
  icon: string;
}

interface Item {
  id: number;
  title: string;
  description: string;
  price: string;
  condition_state: string;
  category_name: string;
  category_id: number;
  seller_name: string;
  email: string;
  contact_number: string;
  contact_email: string;
  status: string;
  images: string[];
}

export default function MarketplacePage() {
  const [tab, setTab] = useState<"browse" | "my-items">("browse");
  const [items, setItems] = useState<Item[]>([]);
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [myId, setMyId] = useState("");
  const [contactProduct, setContactProduct] = useState<Item | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    condition_state: "Used - Good",
    category_id: "",
    contact_number: "",
    contact_email: ""
  });
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    const parseCookie = (name: string) => document.cookie.split("; ").find(r => r.startsWith(name + "="))?.split("=")[1];
    const cookieId = parseCookie("uwu_user_id") || "";
    setMyId(cookieId);

    const fetchAll = async () => {
      try {
        const catRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/get_marketplace_categories.php`).then(r => r.json());
        if (catRes.success) setCategories(catRes.categories);

        const itemsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/get_marketplace_items.php`).then(r => r.json());
        if (itemsRes.success) setItems(itemsRes.items);

        if (cookieId) {
          const myRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/get_marketplace_items.php?seller_id=${cookieId}`).then(r => r.json());
          if (myRes.success) setMyItems(myRes.items);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setForm({ title: "", description: "", price: "", condition_state: "Used - Good", category_id: "", contact_number: "", contact_email: "" });
    setFiles([]);
    setShowModal(true);
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      description: item.description,
      price: item.price,
      condition_state: item.condition_state,
      category_id: item.category_id.toString() || (categories.find(c => c.name === item.category_name)?.id.toString() || ""),
      contact_number: item.contact_number || "",
      contact_email: item.contact_email || ""
    });
    setFiles([]);
    setShowModal(true);
  };

  const handleUpdateStatus = async (itemId: number, newStatus: string) => {
    if (!confirm(`Are you sure you want to mark this as ${newStatus}?`)) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/update_marketplace_item.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId, seller_id: +myId, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setMyItems(prev => prev.map(i => i.id === itemId ? { ...i, status: newStatus } : i));
        if (newStatus !== 'active') {
          setItems(prev => prev.filter(i => i.id !== itemId));
        }
      } else {
        alert(data.message);
      }
    } catch (e) {
      alert("Error updating status.");
    }
  };

  const handleSaveListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myId) return alert("You must be logged in.");
    setFormLoading(true);

    try {
      // 1. Upload Images to Cloudinary if new files added
      const imageUrls = await Promise.all(
        files.map(file => uploadToCloudinary(file, "uwunexus/marketplace"))
      );

      const endpoint = editingItem
        ? `${process.env.NEXT_PUBLIC_API_URL}/update_marketplace_item.php`
        : `${process.env.NEXT_PUBLIC_API_URL}/create_marketplace_item.php`;

      const payload: any = {
        ...form,
        seller_id: +myId
      };

      if (editingItem) payload.id = editingItem.id;
      if (imageUrls.length > 0) payload.images = imageUrls;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message || (editingItem ? "Listing updated successfully! It is pending approval." : "Listing created successfully! It is pending approval."));
        setShowModal(false);
        // Refresh My Items
        const myRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/get_marketplace_items.php?seller_id=${myId}`).then(r => r.json());
        if (myRes.success) setMyItems(myRes.items);
      } else {
        alert(data.message);
      }
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  const filteredItems = (tab === "browse" ? items : myItems).filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory ? categories.find(c => c.id === selectedCategory)?.name === item.category_name : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container" style={{ maxWidth: '1210px', marginTop: '1.5rem', paddingLeft: '0', paddingRight: '0', minHeight: '100vh', paddingBottom: '4rem' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4" style={{ marginTop: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '3rem', color: '#000000', letterSpacing: '0.02em', marginBottom: '0.25rem' }}>
            University Marketplace
          </h1>
          <p style={{ fontFamily: 'var(--font-inclusive-sans), sans-serif', fontSize: '1.15rem', color: '#64748b', fontWeight: 500 }}>
            The smarter way to trade on campus
          </p>
        </div>
        <button
          style={{
            backgroundColor: '#000c66',
            color: '#ffffff',
            border: 'none',
            borderRadius: '9999px',
            padding: '0.6rem 2.2rem',
            fontFamily: 'var(--font-syne), sans-serif',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'background-color 0.2s'
          }}
          onClick={openCreateModal}
        >
          <Plus size={18} />
          <span>List Item</span>
        </button>
      </div>

      {/* Search & Categories Bar */}
      <div className="flex flex-wrap gap-4 items-center mb-8" style={{ width: '100%', marginTop: '2rem' }}>
        {/* Search Input Box */}
        <div style={{ flex: "0 0 280px", position: "relative" }}>
          <input
            type="text"
            placeholder="Search the product"
            className="form-input"
            style={{
              paddingLeft: '1.25rem',
              paddingRight: '3.5rem',
              borderRadius: '9999px',
              border: '2px solid rgba(0, 0, 0, 0.2)',
              height: '43px',
              width: '100%',
              outline: 'none',
              fontSize: '0.95rem',
              fontFamily: 'var(--font-inclusive-sans), sans-serif'
            }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#64748b' }}>
            {search && <X size={16} style={{ cursor: 'pointer' }} onClick={() => setSearch("")} />}
            <Filter size={16} />
          </div>
        </div>

        {/* Category Buttons Row */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            style={{
              height: "43px",
              padding: "0 1.25rem",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              whiteSpace: "nowrap",
              borderRadius: "9999px",
              backgroundColor: selectedCategory === null ? "#000c66" : "#ffffff",
              color: selectedCategory === null ? "#ffffff" : "#000c66",
              border: `1.5px solid ${selectedCategory === null ? "#000c66" : "#e2e8f0"}`,
              fontSize: "0.9rem",
              fontWeight: 500,
              fontFamily: "var(--font-inter), sans-serif",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            All
          </button>
          {categories.map((c) => {
            const isActive = selectedCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
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
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-tabs Row */}
      {myId && (
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setTab("browse")}
            style={{
              height: '38px',
              padding: '0 1.25rem',
              borderRadius: '9999px',
              backgroundColor: tab === "browse" ? "#000c66" : "#ffffff",
              color: tab === "browse" ? "#ffffff" : "#000c66",
              border: `1.5px solid ${tab === "browse" ? "#000c66" : "#e2e8f0"}`,
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
            Browse Items
          </button>
          <button
            onClick={() => setTab("my-items")}
            style={{
              height: '38px',
              padding: '0 1.25rem',
              borderRadius: '9999px',
              backgroundColor: tab === "my-items" ? "#000c66" : "#ffffff",
              color: tab === "my-items" ? "#ffffff" : "#000c66",
              border: `1.5px solid ${tab === "my-items" ? "#000c66" : "#e2e8f0"}`,
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
            My Items
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "5rem 0", color: "#64748b", fontFamily: "var(--font-syne), sans-serif", fontWeight: 700 }}>Loading marketplace items...</div>
      ) : filteredItems.length === 0 ? (
        <div style={{ textAlign: "center", padding: "5rem 0", color: "#64748b", maxWidth: "600px", margin: "0 auto", fontFamily: "var(--font-syne), sans-serif" }}>
          <Store size={48} style={{ margin: "0 auto 1rem auto", opacity: 0.3 }} />
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#000000", marginBottom: "0.5rem" }}>No Items Found</h2>
          <p style={{ fontWeight: 500 }}>{tab === "my-items" ? "You haven't listed any items yet." : "No listings match your search criteria."}</p>
        </div>
      ) : (
        <div className="grid gap-8" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          {filteredItems.map((product) => {
            const formatPrice = (priceStr: string) => {
              const num = parseFloat(priceStr);
              return isNaN(num) ? priceStr : num.toFixed(2);
            };

            return (
              <div key={product.id} className="event-card">
                {/* Image visual wrapper with aspect ratio matching mockup */}
                <div className="event-card-image-wrapper">
                  {product.images && product.images.length > 0 ? (
                    <img src={product.images[0]} alt={product.title} className="event-card-img" />
                  ) : (
                    <div className="event-card-no-img" style={{ background: "linear-gradient(135deg, #000c6622, #000c6611)" }}>
                      <ImageIcon size={40} style={{ color: "#000c66", opacity: 0.4 }} />
                    </div>
                  )}
                  {product.images && product.images.length > 1 && (
                    <div className="absolute bottom-3 right-3 badge text-xs z-10" style={{ backgroundColor: "rgba(0,0,0,0.7)", color: "white", padding: "0.2rem 0.5rem", borderRadius: "0.5rem", fontFamily: "var(--font-syne), sans-serif", fontWeight: 700 }}>
                      1 / {product.images.length}
                    </div>
                  )}
                  {tab === "my-items" && (
                    <div className="absolute top-3 left-3 badge text-xs font-bold shadow z-10" style={{
                      backgroundColor: product.status === 'active' ? "var(--success)" : product.status === 'pending' ? "var(--warning)" : product.status === 'rejected' ? "var(--danger)" : "var(--muted)",
                      color: "white",
                      padding: "0.3rem 0.75rem",
                      borderRadius: "9999px",
                      fontFamily: "var(--font-syne), sans-serif",
                      fontWeight: 700
                    }}>
                      {product.status.toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Content block stack */}
                <div className="event-card-content">
                  {/* Title & Price Row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.5rem", marginBottom: "1rem" }}>
                    <h3 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "1.25rem", fontWeight: 700, color: "#000000", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                      {product.title}
                    </h3>
                    <span style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "1.25rem", fontWeight: 700, color: "#000000", whiteSpace: "nowrap" }}>
                      LKR.{formatPrice(product.price)}
                    </span>
                  </div>

                  {/* Metadata List */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem", marginBottom: "1.5rem", fontFamily: "var(--font-syne), sans-serif", fontSize: "0.95rem", color: "#000000", fontWeight: 700 }}>
                    <div>Condition: {product.condition_state}</div>
                    <div>Category: {product.category_name}</div>
                    {tab === "browse" ? (
                      <>
                        <div>Seller: {product.seller_name}</div>
                        <div>Phone: {product.contact_number}</div>
                      </>
                    ) : null}
                  </div>

                  {/* Actions Button */}
                  <div style={{ display: "flex", justifyContent: "center", width: "100%", marginTop: "auto" }}>
                    {tab === "browse" ? (
                      <button 
                        onClick={() => setContactProduct(product)}
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
                          textDecoration: "none",
                          border: "none",
                          cursor: "pointer",
                          transition: "opacity 0.2s",
                          whiteSpace: "nowrap"
                        }}
                      >
                        <Phone size={16} />
                        <span>Contact Seller</span>
                      </button>
                    ) : (
                      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", width: "100%" }}>
                        <button
                          style={{
                            backgroundColor: "#ffffff",
                            color: "#0d0e4aff",
                            borderRadius: "9999px",
                            border: "1.5px solid #0d0e4aff",
                            padding: "0.6rem 1.5rem",
                            fontFamily: "var(--font-syne), sans-serif",
                            fontWeight: 700,
                            fontSize: "1rem",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.5rem",
                            cursor: "pointer"
                          }}
                          onClick={() => openEditModal(product)}
                        >
                          <Edit size={14} />
                          <span>Edit</span>
                        </button>
                        {product.status !== 'sold' && (
                          <button
                            style={{
                              backgroundColor: "rgba(34,197,94,0.1)",
                              color: "var(--success)",
                              borderRadius: "9999px",
                              border: "1.5px solid rgba(34,197,94,0.2)",
                              padding: "0.6rem 1.5rem",
                              fontFamily: "var(--font-syne), sans-serif",
                              fontWeight: 700,
                              fontSize: "1rem",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "0.5rem",
                              cursor: "pointer"
                            }}
                            onClick={() => handleUpdateStatus(product.id, 'sold')}
                          >
                            <Tag size={14} />
                            <span>Sold</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Listing Modal */}
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
              <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "1.75rem", fontWeight: 800, color: "#000000" }}>
                {editingItem ? "Edit Listing" : "Create Listing"}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#000000" }}><X size={22} /></button>
            </div>

            <form onSubmit={handleSaveListing} style={{ fontFamily: "var(--font-syne), sans-serif", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem", color: "#000000" }}>Item Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Casio fx-991EX Calculator"
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem", color: "#000000" }}>Price (LKR) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    placeholder="2500"
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
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem", color: "#000000" }}>Condition *</label>
                  <select
                    value={form.condition_state}
                    onChange={e => setForm({ ...form, condition_state: e.target.value })}
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
                    <option value="Brand New">Brand New</option>
                    <option value="Like New">Like New</option>
                    <option value="Used - Good">Used - Good</option>
                    <option value="Used - Acceptable">Used - Acceptable</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem", color: "#000000" }}>Category *</label>
                <select
                  required
                  value={form.category_id}
                  onChange={e => setForm({ ...form, category_id: e.target.value })}
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
                  <option value="" disabled>Select a category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem", color: "#000000" }}>Contact Number *</label>
                  <input
                    type="text"
                    required
                    value={form.contact_number}
                    onChange={e => setForm({ ...form, contact_number: e.target.value })}
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
                    onChange={e => setForm({ ...form, contact_email: e.target.value })}
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
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe your item, any flaws, and preferred meetup location..."
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
                {editingItem && files.length === 0 && (
                  <p style={{ fontSize: "0.75rem", color: "var(--warning)", marginBottom: "0.5rem", fontWeight: 600 }}>Note: Uploading new images will replace existing ones. Leave blank to keep existing images.</p>
                )}
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
                  fontWeight: 800,
                  fontFamily: "var(--font-syne), sans-serif",
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                  opacity: formLoading ? 0.7 : 1,
                  marginTop: "0.5rem"
                }}
              >
                {formLoading ? "Saving..." : (editingItem ? "Update Listing" : "Publish Listing")}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Contact Via Modal */}
      {contactProduct && (
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
          onClick={() => setContactProduct(null)}
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
              onClick={() => setContactProduct(null)} 
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
                  const phone = contactProduct.contact_number;
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
                  window.location.href = `mailto:${contactProduct.contact_email || contactProduct.email}`;
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
                  <path fill="#4285F4" d="M20 18h2V6c0-1.1-.9-2-2-2h-3v14h3z"/>
                  <path fill="#34A853" d="M4 18h2V4H4c-1.1 0-2 0.9-2 2v12h2z"/>
                  <path fill="#EA4335" d="M12 13.5l8-6.5V4l-8 6.5L4 4v3l8 6.5z"/>
                  <path fill="#FBBC05" d="M17 4h-3v5l3-2.5V4zM7 4h3v5L7 6.5V4z"/>
                </svg>
                <span style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "1.3rem", fontWeight: 700, color: "#000000" }}>
                  Email
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
