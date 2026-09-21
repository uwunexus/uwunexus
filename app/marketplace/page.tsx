"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Search, Filter, Phone, X, Upload, Image as ImageIcon, Edit, Tag, Plus, Store, ChevronDown, User, Sparkles } from "lucide-react";
import { uploadToCloudinary, validateImageFile } from "../lib/cloudinary";

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [myId, setMyId] = useState("");
  const [contactProduct, setContactProduct] = useState<Item | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [copiedEmail, setCopiedEmail] = useState(false);

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
  const [uploadError, setUploadError] = useState<string | null>(null);

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
    setUploadError(null);
    setShowModal(true);
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      description: item.description,
      price: item.price,
      condition_state: item.condition_state,
      category_id: item.category_id.toString(),
      contact_number: item.contact_number,
      contact_email: item.contact_email
    });
    setFiles([]);
    setUploadError(null);
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

    if (!/^[0-9]{10}$/.test(form.contact_number)) {
      alert("Phone number must be exactly 10 digits.");
      return;
    }

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
    <div className="container marketplace-container" style={{ maxWidth: '1210px', marginTop: '1.5rem', paddingLeft: '0', paddingRight: '0', minHeight: '100vh', paddingBottom: '3.5rem' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4 marketplace-header" style={{ marginTop: '1.5rem' }}>
        <div>
          <h1 className="marketplace-page-title" style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '3rem', color: '#000000', letterSpacing: '0.02em', marginBottom: '0.25rem' }}>
            University Marketplace
          </h1>
          <p className="marketplace-page-subtitle" style={{ fontFamily: 'var(--font-inclusive-sans), sans-serif', fontSize: '1.15rem', color: '#64748b', fontWeight: 500 }}>
            The smarter way to trade on campus
          </p>
        </div>
        <button
          className="marketplace-list-btn"
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
            transition: 'background-color 0.2s',
            transform: 'translateY(-12px)'
          }}
          onClick={openCreateModal}
        >
          <Plus size={18} />
          <span>List Item</span>
        </button>
      </div>

      {/* Search & Categories Bar */}
      <div className="flex flex-wrap gap-4 items-center mb-8 marketplace-filter-bar" style={{ width: '100%', marginTop: '2rem' }}>
        {/* Search Input Box */}
        <div className="marketplace-search-wrapper" style={{ flex: "0 0 280px", position: "relative" }}>
          <input
            type="text"
            placeholder="Search items..."
            className="form-input marketplace-search-input"
            style={{
              paddingLeft: '1.25rem',
              paddingRight: '2.5rem',
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
            <Search size={18} />
          </div>
        </div>

        {/* Category Buttons Row for Desktop */}
        <div className="flex gap-2 flex-wrap marketplace-categories-row desktop-filter-buttons">
          <button
            className="marketplace-cat-btn"
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
                className="marketplace-cat-btn"
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

        {/* Mobile Category Connected Navy Dropdown */}
        <div className="mobile-category-select" style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{
              height: "38px",
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
              whiteSpace: "nowrap",
              transition: "border-radius 0.2s ease"
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {selectedCategory === null ? "All Categories" : (categories.find(c => c.id === selectedCategory)?.name || "All Categories")}
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
                  gap: "2px",
                  maxHeight: "220px",
                  overflowY: "auto"
                }}
              >
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setIsDropdownOpen(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "0.45rem 0.75rem",
                    borderRadius: "0.6rem",
                    fontSize: "0.8rem",
                    fontWeight: selectedCategory === null ? 700 : 500,
                    fontFamily: "var(--font-inter), sans-serif",
                    color: "#ffffff",
                    backgroundColor: selectedCategory === null ? "rgba(255, 255, 255, 0.15)" : "transparent",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    whiteSpace: "nowrap"
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: "0.25rem" }}>
                    All Categories
                  </span>
                  {selectedCategory === null && <span style={{ fontSize: "0.8rem", fontWeight: 700, flexShrink: 0 }}>✓</span>}
                </button>
                {categories.map(c => {
                  const isSelected = selectedCategory === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCategory(c.id);
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
                        backgroundColor: isSelected ? "rgba(255, 255, 255, 0.15)" : "transparent",
                        border: "none",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        whiteSpace: "nowrap"
                      }}
                    >
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: "0.25rem" }}>
                        {c.name}
                      </span>
                      {isSelected && <span style={{ fontSize: "0.8rem", fontWeight: 700, flexShrink: 0 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sub-tabs Row */}
      {myId && (
        <div className="flex gap-2 mb-8 marketplace-tabs-row">
          <button
            className="marketplace-tab-btn"
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
            className="marketplace-tab-btn"
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
        <div className="no-events-container">
          <div className="no-events-icon-badge">
            <Store size={26} />
          </div>
          <h2 className="no-events-title">No Items Found</h2>
          <p className="no-events-desc">{tab === "my-items" ? "You haven't listed any items yet." : "No listings match your search criteria."}</p>
        </div>
      ) : (
        <div className="grid gap-8 marketplace-items-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          {filteredItems.map((product) => {
            const formatPrice = (priceStr: string) => {
              const num = parseFloat(priceStr);
              return isNaN(num) ? priceStr : num.toFixed(2);
            };

            return (
              <div key={product.id} className="event-card marketplace-item-card" style={{ cursor: "pointer" }} onClick={() => tab === "browse" ? setContactProduct(product) : openEditModal(product)}>
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
                  <div className="marketplace-item-header-row" style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginBottom: "1.2rem" }}>
                    <h3 className="marketplace-item-title" style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "1.25rem", fontWeight: 700, color: "#000000", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.25 }}>
                      {product.title}
                    </h3>
                    <span className="marketplace-item-price" style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "1.2rem", fontWeight: 800, color: "var(--primary)", whiteSpace: "nowrap" }}>
                      LKR. {formatPrice(product.price)}
                    </span>
                  </div>

                  {/* Metadata List */}
                  <div className="marketplace-item-metadata" style={{ display: "flex", flexDirection: "column", gap: "0.55rem", marginBottom: "1.5rem", fontFamily: "var(--font-syne), sans-serif", fontSize: "0.95rem", color: "#000000", fontWeight: 700 }}>
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
                  <div className="marketplace-item-actions" style={{ display: "flex", justifyContent: "center", width: "100%", marginTop: "auto" }}>
                    {tab === "browse" ? (
                      <button
                        onClick={() => {
                          setSelectedImageIndex(0);
                          setContactProduct(product);
                        }}
                        className="marketplace-item-btn"
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
                        <Phone size={18} />
                        <span>Contact Seller</span>
                      </button>
                    ) : (
                      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", width: "100%" }}>
                        <button
                          className="marketplace-item-btn marketplace-item-btn-secondary"
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
                            className="marketplace-item-btn marketplace-item-btn-success"
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

      {/* Mobile Floating Action Button (+ List Item) */}
      <button
        className="marketplace-fab"
        onClick={openCreateModal}
        suppressHydrationWarning
      >
        <Plus size={20} />
        <span>List Item</span>
      </button>

      {/* Create / Edit Listing Modal */}
      {showModal && (
        <div
          className="marketplace-modal-overlay"
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
            className="marketplace-modal-card"
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
              <h2 className="marketplace-modal-title" style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "1.75rem", fontWeight: 800, color: "#000000" }}>
                {editingItem ? "Edit Listing" : "Create Listing"}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#000000" }}><X size={22} /></button>
            </div>

            <form onSubmit={handleSaveListing} className="marketplace-modal-form" style={{ fontFamily: "var(--font-syne), sans-serif", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem", color: "#000000" }}>Item Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Casio fx-991EX Calculator"
                  className="marketplace-modal-input"
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

              <div className="responsive-form-grid">
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem", color: "#000000" }}>Price (LKR) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    placeholder="2500"
                    className="marketplace-modal-input"
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
                    className="marketplace-modal-input"
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
                  className="marketplace-modal-input"
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
                    onChange={e => setForm({ ...form, contact_number: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                    placeholder="e.g., 0712345678"
                    className="marketplace-modal-input"
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
                    className="marketplace-modal-input"
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
                  rows={3}
                  required
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe your item, any flaws, and preferred meetup location..."
                  className="marketplace-modal-textarea"
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
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center text-muted flex flex-col items-center justify-center cursor-pointer relative hover:border-primary transition-colors marketplace-modal-upload-box" style={{ backgroundColor: "#f1f3f5", borderRadius: "1rem", border: "2px dashed rgba(0,0,0,0.15)" }}>
                  <Upload size={24} className="mb-2" />
                  <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Click to select images</span>
                  <input
                    type="file"
                    accept="image/jpeg, image/png, image/webp"
                    multiple
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={e => {
                      setUploadError(null);
                      if (e.target.files && e.target.files.length > 0) {
                        const rawFiles = Array.from(e.target.files).slice(0, 3);
                        for (const f of rawFiles) {
                          const err = validateImageFile(f);
                          if (err) {
                            setUploadError(err);
                            e.target.value = "";
                            setFiles([]);
                            return;
                          }
                        }
                        setFiles(rawFiles);
                      }
                    }}
                  />
                </div>
                {uploadError && (
                  <div style={{ fontSize: "0.85rem", color: "var(--danger)", marginTop: "0.5rem", fontWeight: 700, fontFamily: "var(--font-roboto), sans-serif" }}>
                    {uploadError}
                  </div>
                )}
                {files.length > 0 && !uploadError && (
                  <div style={{ fontSize: "0.85rem", color: "var(--success)", marginTop: "0.5rem", fontWeight: 700, fontFamily: "var(--font-roboto), sans-serif" }}>
                    {files.length} file(s) selected
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="marketplace-modal-submit-btn"
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
      {/* Contact & Item Details Modal */}
      {contactProduct && (
        <div
          className="marketplace-modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
            backdropFilter: "blur(6px)",
            overflowY: "auto"
          }}
          onClick={() => setContactProduct(null)}
        >
          {/* Single Unified Card */}
          <div
            className="marketplace-detail-modal-container"
            onClick={e => e.stopPropagation()}
          >
            {/* Top-Right X Close Button */}
            <button
              onClick={() => setContactProduct(null)}
              style={{
                position: "absolute",
                top: "1.25rem",
                right: "1.25rem",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#94a3b8",
                padding: "0.25rem",
                zIndex: 20
              }}
              aria-label="Close"
            >
              <X size={22} />
            </button>

            {/* Left Side: Poster / Product Flyer Image */}
            <div className="marketplace-detail-modal-img-col">
              <img
                src={contactProduct.images?.[selectedImageIndex] || contactProduct.images?.[0] || "/placeholder-image.jpg"}
                alt={contactProduct.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block"
                }}
              />
              {/* Multiple Image Thumbnails */}
              {contactProduct.images && contactProduct.images.length > 1 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "1rem",
                    left: "1rem",
                    right: "1rem",
                    display: "flex",
                    gap: "0.5rem",
                    overflowX: "auto",
                    padding: "0.4rem",
                    backgroundColor: "rgba(0,0,0,0.5)",
                    backdropFilter: "blur(4px)",
                    borderRadius: "1rem",
                    zIndex: 10
                  }}
                >
                  {contactProduct.images.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      style={{
                        position: "relative",
                        width: "48px",
                        height: "48px",
                        borderRadius: "0.5rem",
                        overflow: "hidden",
                        border: selectedImageIndex === idx ? "2px solid #ffffff" : "2px solid transparent",
                        opacity: selectedImageIndex === idx ? 1 : 0.65,
                        flexShrink: 0,
                        cursor: "pointer",
                        padding: 0,
                        background: "none"
                      }}
                    >
                      <img src={imgUrl} alt={`Thumb ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Side: Details Section */}
            <div className="marketplace-detail-modal-info-col">
              <div>
                {/* Title */}
                <h2
                  className="marketplace-detail-modal-title"
                  style={{
                    fontFamily: "var(--font-syne), sans-serif",
                    fontSize: "2rem",
                    fontWeight: 800,
                    color: "#000000",
                    lineHeight: 1.2,
                    marginBottom: "0.75rem",
                    paddingRight: "1.5rem"
                  }}
                >
                  {contactProduct.title}
                </h2>

                {/* Price */}
                <div
                  className="marketplace-detail-modal-price"
                  style={{
                    fontFamily: "var(--font-syne), sans-serif",
                    fontSize: "1.75rem",
                    fontWeight: 800,
                    color: "#202c59",
                    marginBottom: "1rem"
                  }}
                >
                  LKR {Number(contactProduct.price).toFixed(2)}
                </div>

                {/* Description */}
                <p
                  className="marketplace-detail-modal-desc"
                  style={{
                    fontFamily: "var(--font-syne), sans-serif",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    color: "#0f172a",
                    lineHeight: 1.6,
                    marginBottom: "1.5rem",
                    maxHeight: "140px",
                    overflowY: "auto"
                  }}
                >
                  {contactProduct.description || "No description provided for this item."}
                </p>

                {/* 2x2 Metadata Capsule Box */}
                <div
                  className="marketplace-detail-modal-meta-box"
                  style={{
                    border: "1.5px solid #1e293b",
                    borderRadius: "1.5rem",
                    padding: "1.1rem 1.4rem",
                    marginBottom: "1.5rem",
                    backgroundColor: "#ffffff"
                  }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                    {/* Left: Category & Seller */}
                    <div className="flex flex-col gap-2">
                      <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "0.95rem", color: "#000000", fontWeight: 700 }}>
                        Category : <span style={{ fontWeight: 600 }}>{contactProduct.category_name || "Textbooks & Notes"}</span>
                      </div>
                      <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "0.95rem", color: "#000000", fontWeight: 700 }}>
                        Seller : <span style={{ fontWeight: 600 }}>{contactProduct.seller_name || "Super Admin"}</span>
                      </div>
                    </div>

                    {/* Right: Condition & Contact */}
                    <div className="flex flex-col gap-2">
                      <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "0.95rem", color: "#000000", fontWeight: 700 }}>
                        Condition : <span style={{ fontWeight: 600 }}>{contactProduct.condition_state || "Brand New"}</span>
                      </div>
                      <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "0.95rem", color: "#000000", fontWeight: 700 }}>
                        Contact : <span style={{ fontWeight: 600 }}>{contactProduct.contact_number || "Available"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Via Section */}
                <h3
                  style={{
                    fontFamily: "var(--font-syne), sans-serif",
                    fontSize: "1.35rem",
                    fontWeight: 800,
                    color: "#000000",
                    textAlign: "center",
                    marginBottom: "1rem"
                  }}
                >
                  Contact Via
                </h3>

                {/* Contact Buttons */}
                <div className="flex items-center justify-center gap-4 mb-3 marketplace-detail-modal-contact-row">
                  {/* WhatsApp Button */}
                  <button
                    className="marketplace-detail-modal-contact-btn"
                    onClick={() => {
                      const phone = contactProduct.contact_number || "";
                      let clean = phone.replace(/\D/g, "");
                      if (clean.startsWith("0")) {
                        clean = "94" + clean.slice(1);
                      }
                      window.open(`https://wa.me/${clean}`, "_blank");
                    }}
                    style={{
                      height: "46px",
                      padding: "0 1.75rem",
                      borderRadius: "9999px",
                      border: "1.5px solid #1e293b",
                      backgroundColor: "#ffffff",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.6rem",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    onMouseOver={e => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                    onMouseOut={e => (e.currentTarget.style.backgroundColor = "#ffffff")}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.764.46 3.42 1.268 4.876L2 22l5.284-1.388c1.392.76 2.972 1.196 4.72 1.196 5.524 0 10.004-4.48 10.004-10.004C22.008 6.48 17.528 2 12.004 2z" fill="#25D366" />
                      <path d="M17.508 14.304c-.304-.152-1.8-.888-2.076-.988-.276-.1-.476-.152-.676.152-.2.304-.776.988-.952 1.188-.176.2-.352.224-.656.072-1.14-.572-1.9-1.02-2.652-2.312-.2-.344.2-.32.572-1.064.092-.184.048-.344-.024-.496-.072-.152-.676-1.632-.928-2.236-.244-.588-.492-.508-.676-.516-.176-.008-.376-.008-.576-.008s-.524.076-.8.376c-.276.3-1.052 1.028-1.052 2.508s1.076 2.904 1.224 3.104c.148.2 2.116 3.232 5.128 4.532.716.308 1.276.492 1.712.632.72.228 1.376.196 1.896.116.58-.088 1.8-.736 2.052-1.44.252-.704.252-1.308.176-1.44-.076-.132-.276-.232-.58-.384z" fill="#FFF" />
                    </svg>
                    <span style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "1rem", fontWeight: 700, color: "#000000" }}>
                      Whatsapp
                    </span>
                  </button>

                  {/* Email Button */}
                  <button
                    className="marketplace-detail-modal-contact-btn"
                    onClick={() => {
                      const email = contactProduct.contact_email || contactProduct.email;
                      const subject = `Inquiry regarding listing: ${contactProduct.title} on UWU-nexus`;
                      const body = `Hi ${contactProduct.seller_name || "Seller"},\n\nI am interested in your item "${contactProduct.title}" listed on UWU-nexus marketplace. Is it still available?\n\nRegards`;
                      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                      window.open(gmailUrl, "_blank");
                    }}
                    style={{
                      height: "46px",
                      padding: "0 1.75rem",
                      borderRadius: "9999px",
                      border: "1.5px solid #1e293b",
                      backgroundColor: "#ffffff",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.6rem",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    onMouseOver={e => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                    onMouseOut={e => (e.currentTarget.style.backgroundColor = "#ffffff")}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fill="#4285F4" d="M20 18h2V6c0-1.1-.9-2-2-2h-3v14h3z" />
                      <path fill="#34A853" d="M4 18h2V4H4c-1.1 0-2 0.9-2 2v12h2z" />
                      <path fill="#EA4335" d="M12 13.5l8-6.5V4l-8 6.5L4 4v3l8 6.5z" />
                      <path fill="#FBBC05" d="M17 4h-3v5l3-2.5V4zM7 4h3v5L7 6.5V4z" />
                    </svg>
                    <span style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "1rem", fontWeight: 700, color: "#000000" }}>
                      Email
                    </span>
                  </button>
                </div>
              </div>

              {/* Bottom Right: Solid Navy Close Button */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button
                  className="marketplace-detail-modal-close-btn"
                  onClick={() => setContactProduct(null)}
                  style={{
                    height: "44px",
                    padding: "0 2.25rem",
                    borderRadius: "9999px",
                    backgroundColor: "#1c2452",
                    color: "#ffffff",
                    border: "none",
                    fontFamily: "var(--font-syne), sans-serif",
                    fontSize: "1rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "opacity 0.2s",
                    boxShadow: "0 4px 14px rgba(28, 36, 82, 0.3)"
                  }}
                  onMouseOver={e => (e.currentTarget.style.opacity = "0.9")}
                  onMouseOut={e => (e.currentTarget.style.opacity = "1")}
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
