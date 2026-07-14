# 🎓 UWU-NEXUS සම්පූර්ණ මාර්ගෝපදේශය
## Part 6: Marketplace & Lost and Found — Buy/Sell + Item Reports

---

## 🛒 MODULE 3: Sarasawi Alewisala (Marketplace)

### Marketplace කියන්නේ මොකක්ද?

**Student-to-student e-commerce** platform.
UWU students ඔවුනොවුන් ගෙන් **items buy/sell** කරන්නට.

```
Use cases:
- 📚 Books, study materials sell කරන්නට
- 💻 Electronics (calculators, headphones)
- 🎒 Bags, clothing
- 🖊️ Lab equipment
```

---

### 👥 Tabs 2ක් — Page ඇතුළේ

```
Marketplace Page
├── 📦 Browse Tab    → ඔල්ලම active listings view
└── 📋 My Items Tab  → ඔයාගේ listings manage
```

```typescript
// State
const [tab, setTab] = useState<"browse" | "my-items">("browse");

// Tab click → state change → different items show
{tab === "browse" ? <AllItems /> : <MyItems />}
```

---

### 🔄 Marketplace Item Life Cycle

```
Student → Item create
               ↓
    status = 'pending'   (Others ට නොපෙනේ)
               ↓
  Admin approve
               ↓
    status = 'active'    (Browse ට visible ✅)
               ↓
  Seller → "Mark as Sold"
               ↓
    status = 'sold'      (List ගෙන් disappear)
               ↓
  OR Admin → reject / hide
               ↓
    status = 'rejected' / 'hidden'
```

**Status Values:**

| Status | Meaning | Browse ට visible? |
|--------|---------|------------------|
| `pending` | Admin approval wait | ❌ No |
| `active` | Approved, for sale | ✅ Yes |
| `sold` | Item sold | ❌ No |
| `hidden` | Admin hidden | ❌ No |
| `rejected` | Admin rejected | ❌ No |

---

### 📸 Multi-Image Upload — Cloudinary

Marketplace items ට **multiple photos** upload කරන්නට.

```typescript
// app/marketplace/page.tsx — handleSaveListing()

// Step 1: Files ඔක්කොම parallel ව Cloudinary ට upload
const imageUrls = await Promise.all(
  files.map(file => uploadToCloudinary(file, "uwunexus/marketplace"))
);
// Result: ["https://res.cloudinary.com/.../img1.jpg",
//          "https://res.cloudinary.com/.../img2.jpg"]

// Step 2: URLs array payload ඇතුළේ include
const payload = {
  ...form,           // title, price, description, etc.
  seller_id: myId,
  images: imageUrls  // Image URL array
};
```

**`app/lib/cloudinary.ts` — Upload Helper:**

```typescript
export async function uploadToCloudinary(file: File, folder: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );
  const data = await res.json();
  return data.secure_url;  // "https://res.cloudinary.com/..."
}
```

---

### 📤 Item Create Flow

```
Student → "Add Listing" button click
               ↓
Modal open — form fill:
  Title, Description, Price,
  Condition (New/Used-Good/Used-Fair/Poor),
  Category, Contact Number, Contact Email,
  Photos (multiple)
               ↓
"Save Listing" click
               ↓
STEP 1: Photos → Cloudinary upload → URL array ගන්නවා
               ↓
STEP 2: POST /api/backend/create_marketplace_item.php
  {title, price, condition, category_id, seller_id, images:[...urls]}
               ↓
PHP:
  INSERT INTO marketplace_items (title, price, ..., status='pending')
  INSERT INTO marketplace_images (item_id, image_url) × n
               ↓
{"success": true, "message": "Pending approval"}
               ↓
Student → "My Items" tab → pending item visible
```

---

### 📥 Items Load Flow (Browse)

```
Page load → useEffect
               ↓
Parallel fetch:
  1. get_marketplace_categories.php  → Categories list
  2. get_marketplace_items.php       → Active items (status='active')
  3. get_marketplace_items.php?seller_id=7  → My items (all statuses)
               ↓
setState calls → Page render:
  - Category filter buttons
  - Item cards grid
  - My listings (with status badges)
```

---

### 🔍 Search & Category Filter

```typescript
const filteredItems = (tab === "browse" ? items : myItems).filter(item => {
  // Title or description ඇතුළේ search text ඇද?
  const matchesSearch =
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.description.toLowerCase().includes(search.toLowerCase());

  // Selected category match ද?
  const matchesCategory = selectedCategory
    ? categories.find(c => c.id === selectedCategory)?.name === item.category_name
    : true;

  return matchesSearch && matchesCategory;
});
```

---

### ✏️ Edit & Status Update — "My Items"

Student ඔවුන්ගේ items:
- ✏️ **Edit** — Title, price, description update
- ✅ **Mark as Sold** — status → 'sold'
- 🗑️ Admin only: Delete/Reject/Hide

```typescript
// Status update (Mark as Sold)
const handleUpdateStatus = async (itemId, newStatus) => {
  await fetch('/api/backend/update_marketplace_item.php', {
    method: "POST",
    body: JSON.stringify({
      id: itemId,
      seller_id: myId,   // Security: only own items update කරන්නට
      status: newStatus
    })
  });

  // UI instant update (optimistic)
  if (newStatus !== 'active') {
    setItems(prev => prev.filter(i => i.id !== itemId));  // Browse ගෙන් remove
  }
};
```

> 💡 **Optimistic Update** — Backend respond කරන්නෙ කලින්ම
> UI update කරනවා. Fast feel ✅

---

### 📞 Contact Seller

Buy කරන්න user → **Contact button** click → Contact modal:

```
Contact Info Show:
  📞 Phone: 0771234567
  📧 Email: seller@std.uwu.ac.lk
```

Platform ඇතුළෙන්ම chat/payment **නෑ** — ඒ direct contact!

---

## 🔍 MODULE 4: Lost & Found

### Lost & Found කියන්නේ මොකක්ද?

University campus ඇතුළේ **items lost / found** report කරන module.

```
Use cases:
- 📱 Phone හම්බෙව්වොත් report
- 🔑 Keys lost කළොත් report
- 👜 Bag found කළොත් report
- 📔 ID card lost report
```

---

### 📋 Report Types

| Type | Meaning |
|------|---------|
| **Lost** | "මේ item මට නැතිවිච්ච" — report කරනවා |
| **Found** | "මේ item මට හෙව්නා" — report කරනවා |

---

### 🔄 Report Life Cycle

```
User → Report submit
            ↓
  status = 'active'    (Immediately public ✅)
            ↓
  Item found / returned
            ↓
  User → "Mark Resolved"
            ↓
  status = 'resolved'  (Archive ට)
```

> 💡 Marketplace ට වඩා **simpler** — Admin approval **ඕනෑ නෑ**.
> Report submit → instantly visible.

---

### 📤 Report Create Flow

```
User → "Report Item" button click
            ↓
Modal open — form fill:
  Item Title (eg: "Black Calculator")
  Description (details)
  Location (eg: "Library 2nd Floor")
  Date/Time (Month + Day + Time select)
  Type: Lost / Found
  Contact Number, Contact Email
  Photos (optional)
            ↓
Photo upload → Cloudinary
            ↓
POST /api/backend/create_lost_found.php
  {title, description, location, time_date,
   type: "Lost", contact_number, user_id, images:[...]}
            ↓
PHP:
  INSERT INTO lost_found_items (title, ..., status='active')
  INSERT INTO lost_found_images (item_id, image_url) × n
            ↓
{"success": true}
            ↓
Report list refresh → New report top ✅
```

---

### 📅 Date/Time Input — Special UI

Lost & Found ඇතුළේ date/time input **split** කරලා:

```typescript
// Month dropdown + Day input + Time input
const [selectedMonth, setSelectedMonth] = useState("jan");
const [selectedDay,   setSelectedDay]   = useState("1");
const [selectedTime,  setSelectedTime]  = useState("12:00");

// Combine into one string before save
const time_date = `${selectedMonth} ${selectedDay} , ${selectedTime}`;
// Example: "jul 13 , 14:30"
```

---

### 🔍 Filter by Type

```typescript
// Filter: All / Lost / Found / Mine
const [filter, setFilter] = useState<"All" | "Lost" | "Found" | "Mine">("All");

const filtered = reports.filter(r => {
  if (filter === "All")   return r.status === "active";
  if (filter === "Lost")  return r.type === "Lost"  && r.status === "active";
  if (filter === "Found") return r.type === "Found" && r.status === "active";
  if (filter === "Mine")  return r.user_id === +myId;  // ඔයාගේ reports
  return true;
});
```

---

### ✅ Mark as Resolved

```typescript
// "Mark Resolved" button → confirm dialog → update
await fetch('/api/backend/update_lost_found.php', {
  method: "POST",
  body: JSON.stringify({
    id: reportId,
    user_id: myId,     // Security check (own report only)
    status: "resolved"
  })
});

// Remove from active list
setReports(prev => prev.filter(r => r.id !== reportId));
```

---

### 📞 Contact Reporter

Report ඇතුළේ **Contact button** → contact info modal:

```
Lost item reporter:
  📞 0771234567
  📧 iit23068@std.uwu.ac.lk

Found item reporter:
  📞 0777654321
  📧 mrt23084@std.uwu.ac.lk
```

---

## ⚖️ Marketplace vs Lost & Found — Comparison

| Feature | Marketplace | Lost & Found |
|---------|------------|-------------|
| Purpose | Buy/Sell items | Lost/Found reports |
| Admin Approval | ✅ Yes (pending → active) | ❌ No (instant active) |
| Payment | ❌ Direct contact | ❌ Direct contact |
| Resolve | Mark as Sold | Mark as Resolved |
| Images | Multiple (required-ish) | Multiple (optional) |
| Categories | ✅ Yes (Books, Electronics...) | ❌ No |
| DB Tables | `marketplace_items` + `marketplace_images` | `lost_found_items` + `lost_found_images` |

---

### 🗄️ Database Tables — Image Storage

Items ගේ images **separate table** ඇතුළේ:

```
marketplace_items (id=5, title="Calculator")
        ↓
marketplace_images:
  (item_id=5, image_url="https://res.cloudinary.com/.../img1.jpg")
  (item_id=5, image_url="https://res.cloudinary.com/.../img2.jpg")
  (item_id=5, image_url="https://res.cloudinary.com/.../img3.jpg")
```

PHP ඇතුළේ images JOIN කරලා fetch:
```sql
SELECT mi.*, GROUP_CONCAT(img.image_url) as images
FROM marketplace_items mi
LEFT JOIN marketplace_images img ON img.item_id = mi.id
WHERE mi.status = 'active'
GROUP BY mi.id
```

`GROUP_CONCAT` → `"url1,url2,url3"` → PHP `explode(",", ...)` → array

---

## 📌 Part 6 Summary — ඔයා ඉගෙනගත්ත දේ

**Marketplace:**
- ✅ Life cycle: pending → active → sold (Admin approval required)
- ✅ Multi-image upload — `Promise.all()` parallel Cloudinary upload
- ✅ Optimistic UI update — backend wait නොකර instant refresh
- ✅ Tab system — Browse vs My Items

**Lost & Found:**
- ✅ Life cycle: active → resolved (No admin approval needed)
- ✅ Filter by Lost / Found / Mine / All
- ✅ Date/Time — Month + Day + Time split inputs combine
- ✅ Image stored in separate table, JOIN ව fetch

**Both modules:**
- ✅ Contact via phone/email — platform ඇතුළෙන් payment/chat නෑ
- ✅ Images — Cloudinary cloud storage, DB ඇතුළේ URL save

---

## ➡️ ඊළඟ Part (Part 7) ගැන Preview

**Part 7: GPA Calculator — Smart Grade System**

- Curriculum structure (Degrees, Modules, Groups)
- Grade save/load flow
- GPA calculation formula
- Specialization system
- Level tabs (Year 1–4)

---

*📝 UWU-NEXUS Project Guide | Part 6 of 10*
