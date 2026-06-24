"use client";

import { useState, useEffect } from "react";
import { Store, Search, Filter, MessageCircle, X, Upload, Image as ImageIcon, ChevronLeft, ChevronRight, Edit, EyeOff, Tag } from "lucide-react";
import Image from "next/image";
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
        const catRes = await fetch("http://localhost:8000/get_marketplace_categories.php").then(r => r.json());
        if (catRes.success) setCategories(catRes.categories);

        const itemsRes = await fetch("http://localhost:8000/get_marketplace_items.php").then(r => r.json());
        if (itemsRes.success) setItems(itemsRes.items);

        if (cookieId) {
          const myRes = await fetch(`http://localhost:8000/get_marketplace_items.php?seller_id=${cookieId}`).then(r => r.json());
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
      const res = await fetch("http://localhost:8000/update_marketplace_item.php", {
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
        ? "http://localhost:8000/update_marketplace_item.php" 
        : "http://localhost:8000/create_marketplace_item.php";

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
        const myRes = await fetch(`http://localhost:8000/get_marketplace_items.php?seller_id=${myId}`).then(r => r.json());
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
    <div className="container py-8 relative min-h-screen">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Store size={36} className="text-success" />
            Sarasawi Alewisala
          </h1>
          <p className="text-muted">Trusted student-to-student marketplace.</p>
        </div>
        <button className="btn btn-primary" style={{ backgroundColor: 'var(--success)' }} onClick={openCreateModal}>
          + Create Listing
        </button>
      </div>

      {myId && (
        <div className="flex gap-6 mb-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <button 
            className="pb-3 px-1 font-bold transition-all" 
            style={{ borderBottom: tab === "browse" ? "2px solid var(--success)" : "2px solid transparent", color: tab === "browse" ? "var(--success)" : "var(--muted)" }} 
            onClick={() => setTab("browse")}>
            Browse Items
          </button>
          <button 
            className="pb-3 px-1 font-bold transition-all" 
            style={{ borderBottom: tab === "my-items" ? "2px solid var(--success)" : "2px solid transparent", color: tab === "my-items" ? "var(--success)" : "var(--muted)" }} 
            onClick={() => setTab("my-items")}>
            My Items
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="card mb-8 p-4 flex flex-wrap gap-4 items-center">
        <div className="flex-1" style={{ minWidth: '250px', position: 'relative' }}>
          <Search size={18} className="text-muted" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search for items..." 
            className="form-input" 
            style={{ paddingLeft: '2.5rem' }} 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <select 
          className="form-input w-auto" 
          value={selectedCategory || ""} 
          onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted">Loading marketplace items...</div>
      ) : filteredItems.length === 0 ? (
        <div className="card text-center py-20 text-muted max-w-2xl mx-auto">
          <Store size={48} className="mx-auto mb-4 opacity-30" />
          <h2 className="text-xl font-semibold mb-2 text-foreground">No Items Found</h2>
          <p>{tab === "my-items" ? "You haven't listed any items yet." : "No listings match your search criteria."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md-grid-cols-2 lg-grid-cols-4 gap-6">
          {filteredItems.map((product) => (
            <div key={product.id} className="card p-0 overflow-hidden flex flex-col" style={{ padding: 0 }}>
              {/* Image Carousel / Banner */}
              <div className="aspect-4-3 image-container-blurred" style={{ backgroundImage: product.images && product.images.length > 0 ? `url(${product.images[0]})` : 'none' }}>
                {product.images && product.images.length > 0 ? (
                  <Image src={product.images[0]} alt={product.title} fill className="next-image" sizes="(max-width: 768px) 100vw, 33vw" />
                ) : (
                  <div className="flex justify-center items-center h-full opacity-50 text-muted relative z-10">
                    <ImageIcon size={48} />
                  </div>
                )}
                {product.images && product.images.length > 1 && (
                  <div className="absolute bottom-2 right-2 badge text-xs z-10" style={{ backgroundColor: "rgba(0,0,0,0.7)", color: "white" }}>
                    1 / {product.images.length}
                  </div>
                )}
                {tab === "my-items" && (
                  <div className="absolute top-2 left-2 badge text-xs font-bold shadow z-10" style={{ 
                    backgroundColor: product.status === 'active' ? "var(--success)" : product.status === 'pending' ? "var(--warning)" : product.status === 'rejected' ? "var(--danger)" : "var(--muted)", 
                    color: "white" 
                  }}>
                    {product.status.toUpperCase()}
                  </div>
                )}
              </div>
              
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-lg mb-1 truncate">{product.title}</h3>
                <div className="text-xl font-bold text-success mb-2">LKR {product.price}</div>
                
                <div className="flex flex-col gap-1 text-sm text-muted mb-4">
                  <span>Condition: <strong className="text-foreground">{product.condition_state}</strong></span>
                  <span>Category: {product.category_name}</span>
                  {tab === "browse" && (
                    <>
                      <span>Seller: {product.seller_name}</span>
                      <span>Phone: <strong className="text-foreground">{product.contact_number}</strong></span>
                    </>
                  )}
                </div>
                
                <div className="mt-auto">
                  {tab === "browse" ? (
                    <a href={`mailto:${product.contact_email || product.email}`} className="btn w-full flex justify-center" style={{ border: '1px solid var(--border)' }}>
                      <MessageCircle size={16} /> Contact Seller
                    </a>
                  ) : (
                    <div className="flex gap-2">
                      <button className="btn flex-1 flex justify-center" style={{ border: '1px solid var(--border)' }} onClick={() => openEditModal(product)}>
                        <Edit size={16} /> Edit
                      </button>
                      {product.status !== 'sold' && (
                        <button className="btn flex-1 flex justify-center" style={{ border: '1px solid var(--border)', backgroundColor: 'rgba(34,197,94,0.1)', color: 'var(--success)' }} onClick={() => handleUpdateStatus(product.id, 'sold')}>
                          <Tag size={16} /> Sold
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Listing Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={() => setShowModal(false)}>
          <div className="card max-h-[90vh] overflow-y-auto" style={{ maxWidth: "600px", width: "100%" }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{editingItem ? "Edit Listing" : "Create Listing"}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}><X size={22} /></button>
            </div>

            <form onSubmit={handleSaveListing}>
              <div className="form-group mb-4">
                <label className="form-label">Item Title *</label>
                <input type="text" className="form-input" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g., Casio fx-991EX Calculator" />
              </div>
              
              <div className="grid gap-4 mb-4 grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Price (LKR) *</label>
                  <input type="number" className="form-input" required min="0" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="2500" />
                </div>
                <div className="form-group">
                  <label className="form-label">Condition *</label>
                  <select className="form-input" value={form.condition_state} onChange={e => setForm({...form, condition_state: e.target.value})}>
                    <option value="Brand New">Brand New</option>
                    <option value="Like New">Like New</option>
                    <option value="Used - Good">Used - Good</option>
                    <option value="Used - Acceptable">Used - Acceptable</option>
                  </select>
                </div>
              </div>

              <div className="form-group mb-4">
                <label className="form-label">Category *</label>
                <select className="form-input" required value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}>
                  <option value="" disabled>Select a category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
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
                <textarea className="form-input" rows={4} required value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe your item, any flaws, and preferred meetup location..."></textarea>
              </div>

              <div className="form-group mb-6">
                <label className="form-label">Images (Optional, Max 3)</label>
                {editingItem && files.length === 0 && (
                  <p className="text-xs text-warning mb-2">Note: Uploading new images will replace existing ones. Leave blank to keep existing images.</p>
                )}
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

              <button type="submit" disabled={formLoading} className="btn btn-primary w-full justify-center">
                {formLoading ? "Saving..." : (editingItem ? "Update Listing" : "Publish Listing")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
