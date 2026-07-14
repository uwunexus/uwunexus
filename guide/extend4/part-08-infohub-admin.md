# 🎓 UWU-NEXUS සම්පූර්ණ මාර්ගෝපදේශය
## Part 8: Info Hub & Admin Panel — Content Management + Full Admin Powers

---

## ℹ️ MODULE 6: Information Hub

### Info Hub කියන්නේ මොකක්ද?

University ඇතුළේ **important information** students ට easily access කරන module.

```
3 categories:
├── 📋 Procedures   → University procedures (how to do X)
├── 📞 Hotlines     → Emergency contact numbers
└── 👤 Contacts     → Lecturer / office contacts
```

---

### 🗄️ DATABASE: `info_hub_items` Table

```sql
DESCRIBE info_hub_items;
```

| Field | Type | Null | Description |
|-------|------|------|-------------|
| `id` | int | NO | Auto ID |
| `category` | enum | NO | `'procedure'` / `'hotline'` / `'contact'` |
| `title` | varchar(255) | NO | "How to Apply for Medical Leave" |
| `description` | text | NO | Full explanation |
| `contact_info` | varchar(255) | YES | Phone / email |
| `action_link` | varchar(255) | YES | URL (form link etc.) |
| `action_text` | varchar(100) | YES | "Download Form" / "Visit Office" |
| `created_at` | timestamp | YES | Added time |

**Real examples:**

| category | title | contact_info |
|----------|-------|-------------|
| `hotline` | Security Office | 0554711222 |
| `hotline` | Medical Center | 0554711333 |
| `contact` | Dean - Faculty of Applied Sciences | dean.fas@uwu.ac.lk |
| `procedure` | How to Apply for Medical Leave | — |
| `procedure` | How to Get Enrollment Certificate | — |

---

### 🔄 Info Hub Flow

```
Page load → useEffect → GET /get_info_hub.php
               ↓
PHP → SELECT * FROM info_hub_items
               ↓
JSON → setItems(data.items)
               ↓
Filter by category:
  procedures = items.filter(i => i.category === 'procedure')
  hotlines   = items.filter(i => i.category === 'hotline')
  contacts   = items.filter(i => i.category === 'contact')
               ↓
3 sections render:
  📋 University Procedures
  📞 Emergency Hotlines
  👤 Key Contacts
```

### 🔍 Search

```typescript
// Title or description ගෙන් search
const filteredItems = items.filter(item =>
  item.title.toLowerCase().includes(search.toLowerCase()) ||
  item.description.toLowerCase().includes(search.toLowerCase())
);
```

**Admin** ගෙන් Add / Edit / Delete — Admin panel ඇතුළෙ Info Hub tab.

---

---

## 🛡️ MODULE: Admin Panel

### Admin Panel කියන්නේ මොකක්ද?

**SuperAdmin** සහ **ClubAdmin** ට entire website manage කරන control center.

```
URL: /admin
Middleware: superadmin OR clubadmin role ඕනෙ (others → redirect home)
```

---

### 🗂️ Admin Panel Tabs

```typescript
type Tab = "users" | "events" | "tickets" | "marketplace" | "lost-found" | "info-hub"

// ClubAdmin login → Events tab ට auto-jump
if (role === "clubadmin") setTab("events");
```

| Tab | SuperAdmin | ClubAdmin | කරන දේ |
|-----|-----------|-----------|---------|
| **👤 Users** | ✅ Full access | ❌ No | User manage, role change, delete |
| **📅 Events** | ✅ Full access | ✅ Own events | Events approve/reject/delete |
| **🎫 Tickets** | ✅ Full access | ❌ No | Ticket events + purchases manage |
| **🛒 Marketplace** | ✅ Full access | ❌ No | Items approve/reject |
| **🔍 Lost & Found** | ✅ Full access | ❌ No | Reports manage |
| **ℹ️ Info Hub** | ✅ Full access | ❌ No | Content add/edit/delete |

---

### 👥 TAB 1: Users Management

**What SuperAdmin can do:**
- ✅ All registered users view
- ✅ Role change (promote / demote)
- ✅ User delete

**State:**
```typescript
const [users, setUsers] = useState<User[]>([]);
const [userSearch, setUserSearch] = useState("");
const [roleFilter, setRoleFilter] = useState("all");

// Stats cards
const userStats = {
  total:    users.length,
  students: users.filter(u => u.role === "student").length,
  staff:    users.filter(u => u.role === "staff").length,
  admins:   users.filter(u => ["superadmin","clubadmin"].includes(u.role)).length,
};
```

**User Search + Filter:**
```typescript
const filteredUsers = users.filter(u => {
  const matchRole = roleFilter === "all" || u.role === roleFilter;
  const q = userSearch.toLowerCase();
  return matchRole && (
    !q ||
    u.full_name.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q) ||
    u.enrollment_number.toLowerCase().includes(q)
  );
});
```

**Role Update Flow:**
```
SuperAdmin → User row → Role dropdown → "clubadmin" select
          ↓
POST /update_role.php
  { requester_id: 1, target_id: 7, new_role: "clubadmin" }
          ↓
PHP:
  - requester_id role check (superadmin only)
  - UPDATE users SET role = 'clubadmin' WHERE id = 7
          ↓
{"success": true}
          ↓
UI optimistic update: user.role = "clubadmin" ✅
```

**Role Colors in UI:**
```
superadmin → 🟣 Purple badge
clubadmin  → 🔵 Blue badge
staff      → 🟡 Yellow badge
student    → 🟢 Green badge
```

**Delete User Flow:**
```
SuperAdmin → Delete button → confirm() dialog
          ↓
POST /delete_user.php
  { requester_id: 1, target_id: 7 }
          ↓
PHP → DELETE FROM users WHERE id = 7
          ↓
setUsers(prev => prev.filter(u => u.id !== 7))  (UI remove)
```

---

### 📅 TAB 2: Events Management

**What Admin can do:**
- ✅ ALL events view (pending + approved + rejected)
- ✅ Approve / Reject events
- ✅ Create new events
- ✅ Edit existing events
- ✅ Delete events

**Stats Cards:**
```typescript
const eventStats = {
  total:    events.length,
  approved: events.filter(e => e.status === "approved").length,
  pending:  events.filter(e => e.status === "pending").length,
  rejected: events.filter(e => e.status === "rejected").length,
};
```

**Fetch (Admin sees ALL statuses):**
```typescript
// Note: status=all → Admin mode
fetch('/api/backend/get_events.php?requester_id=1&status=all')
// PHP → role check → return all events (pending+approved+rejected)
```

**Approve / Reject:**
```typescript
const updateEventStatus = async (eventId, status) => {
  await fetch('/api/backend/update_event_status.php', {
    method: "POST",
    body: JSON.stringify({ requester_id: myId, event_id: eventId, status })
  });
  // status = "approved" | "rejected"
  setEvents(prev => prev.map(e =>
    e.id === eventId ? { ...e, status } : e
  ));
};
```

**Status Badge Colors:**
```
approved → 🟢 Green badge
pending  → 🟡 Yellow badge
rejected → 🔴 Red badge
```

---

### 🎫 TAB 3: Tickets Management (2 Sub-tabs)

**Sub-tab 1: Ticket Events**
```
Manage ticketed events:
  - View all events (active + closed)
  - Create new ticket event
  - Edit (title, price, seats, date)
  - Open / Close event (available ↔ closed)
  - Delete event
```

**Sub-tab 2: Purchase History**
```
View all ticket purchases:
  Order ID | Event | Customer | Contact | Amount | Status | Date

  Status values:
    pending  → Payment not confirmed yet
    success  → Payment confirmed ✅
    failed   → Payment failed ❌
```

**State:**
```typescript
const [ticketSubTab, setTicketSubTab] = useState<"events"|"purchases">("events");

// Sub-tab change → different fetch
useEffect(() => {
  if (ticketSubTab === "events") fetchTickets();
  if (ticketSubTab === "purchases") fetchPurchases();
}, [ticketSubTab]);
```

---

### 🛒 TAB 4: Marketplace Management

**What Admin can do:**
- ✅ All items view (pending + active + sold + hidden + rejected)
- ✅ Approve items (pending → active)
- ✅ Reject items
- ✅ Hide items (active → hidden)
- ✅ Delete items permanently

**Approve Flow:**
```
Admin → Pending item → "Approve" button
     ↓
POST /update_marketplace_item.php
  { id: 23, admin_id: 1, status: "active" }
     ↓
PHP → UPDATE marketplace_items SET status='active' WHERE id=23
     ↓
Item now visible in student Browse tab ✅
```

---

### 🔍 TAB 5: Lost & Found Management

**What Admin can do:**
- ✅ All reports view
- ✅ Mark resolved
- ✅ Delete inappropriate reports

---

### ℹ️ TAB 6: Info Hub Management

**What Admin can do:**
- ✅ Add new info items (procedure/hotline/contact)
- ✅ Edit existing items
- ✅ Delete items

**Create Info Item:**
```typescript
// Form: category, title, description, contact_info, action_link, action_text
await fetch('/api/backend/create_info_hub.php', {
  method: "POST",
  body: JSON.stringify({
    category:     "hotline",
    title:        "Security Office",
    description:  "24/7 campus security",
    contact_info: "0554711222",
    action_link:  "",
    action_text:  "Call Now"
  })
});
```

---

### 🔐 Security — Admin Panel Protection Layers

**Layer 1: Middleware (proxy.ts)**
```typescript
// Page load කලාම check:
if (!isAuthenticated || !['superadmin','clubadmin'].includes(role)) {
  return redirect('/');  // ← Home ට kick
}
```

**Layer 2: Backend PHP Check**
```php
// හැම admin PHP file ඇතුළේ:
$stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
$stmt->execute([$requester_id]);
$user = $stmt->fetch();

if (!in_array($user['role'], ['superadmin', 'clubadmin'])) {
  http_response_code(403);
  echo json_encode(["success" => false, "message" => "Forbidden"]);
  exit();
}
```

> 🛡️ **Double protection:**
> Even if someone bypasses the frontend middleware,
> the PHP backend **always** verifies the role from DB.
> Hacker ට admin actions direct API call කරලත් **403 Forbidden**!

---

### 📊 Admin Panel — Full Architecture View

```
/admin page load
      ↓
Middleware check → superadmin/clubadmin? ✅
      ↓
Cookie ගෙන්: myId, myRole

ClubAdmin?       → default tab = "events"
SuperAdmin?      → default tab = "users"
      ↓
Tab click → fetch data → render table/cards

Users tab:
  GET /users.php?requester_id=1
  → All users table + role dropdowns + delete buttons

Events tab:
  GET /get_events.php?requester_id=1&status=all
  → Events table + approve/reject buttons + create modal

Tickets tab (Events):
  GET /get_ticketed_events.php?all=true
  → Ticket events + create/edit/delete

Tickets tab (Purchases):
  GET /get_ticket_purchases.php?user_id=1
  → Purchase history table

Marketplace tab:
  GET /get_marketplace_items.php?admin=true
  → All items + approve/reject/hide/delete

Lost & Found tab:
  GET /get_lost_found.php?admin=true
  → All reports + delete

Info Hub tab:
  GET /get_info_hub.php
  → All items + create/edit/delete forms
```

---

### 🎯 useCallback — Performance Optimization

Admin panel ඇතුළේ `useCallback` use කරනවා:

```typescript
// useCallback: function reference re-create වෙන්නේ නෑ
// (dependency array same ව) → unnecessary re-renders avoid
const fetchUsers = useCallback(async () => {
  const r = await fetch(`/api/backend/users.php?requester_id=${myId}`);
  const d = await r.json();
  if (d.success) setUsers(d.users);
}, [myId]);  // ← myId change වෙනකොට only re-create

// useEffect: myId ready වෙනකොට fetch run
useEffect(() => {
  if (myId) fetchUsers();
}, [myId, fetchUsers]);
```

> 💡 `useCallback` vs plain function:
> Plain function → every re-render ට new function create.
> `useCallback` → dependencies same ව → **same function** reuse.
> Admin panel ගේ වගේ heavy pages ට performance ↑

---

## 📌 Part 8 Summary — ඔයා ඉගෙනගත්ත දේ

**Info Hub:**
- ✅ `info_hub_items` table — 3 categories: procedure, hotline, contact
- ✅ Page load → fetch → client-side category filter → 3 sections render

**Admin Panel:**
- ✅ **6 tabs:** Users, Events, Tickets, Marketplace, Lost & Found, Info Hub
- ✅ **ClubAdmin** = Events tab only. **SuperAdmin** = ඔල්ලම tabs
- ✅ **Double security:** Middleware (frontend) + PHP role check (backend)
- ✅ **Role colors:** Purple=superadmin, Blue=clubadmin, Yellow=staff, Green=student
- ✅ **Event stats:** pending/approved/rejected count cards
- ✅ **Tickets sub-tabs:** Events management + Purchase history
- ✅ **useCallback** — performance optimization, unnecessary re-renders avoid

---

## ➡️ ඊළඟ Part (Part 9) ගැන Preview

**Part 9: Deployment & Environment — How it all goes LIVE**

- Vercel deployment (GitHub push → auto deploy)
- VPS server (PHP + MySQL setup)
- Environment variables (.env.local)
- Domain setup (uwunexus.tech)
- Stripe webhook setup
- GitHub workflow

---

*📝 UWU-NEXUS Project Guide | Part 8 of 10*
