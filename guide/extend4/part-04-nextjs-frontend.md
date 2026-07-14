# 🎓 UWU-NEXUS සම්පූර්ණ මාර්ගෝපදේශය
## Part 4: Next.js Frontend — Pages, Components, State

---

## ⚡ Next.js කියන්නේ මොකක්ද?

**Next.js** කියන්නේ **React** library use කරලා website pages හදන **framework** (tool set) එකක්.

> 🏠 **Analogy:** House plan (blueprint) = React. House build කරන contractors = Next.js.
> React rules follow කරලා Next.js pages හදනවා.

---

## 📂 Frontend Folder Structure

```
app/
│
├── layout.tsx              ← 🔲 Master layout (NavBar + Footer — ඔක්කොම pages වල)
├── page.tsx                ← 🏠 Home page
├── globals.css             ← 🎨 Global CSS styles (ඔක්කොම pages වලට)
│
├── login/
│   └── page.tsx            ← Login page
├── signup/
│   └── page.tsx            ← Signup page
├── events/
│   └── page.tsx            ← Events calendar page
├── tickets/
│   ├── page.tsx            ← Tickets page
│   └── success/
│       └── page.tsx        ← Payment success page
├── marketplace/
│   └── page.tsx            ← Marketplace page
├── lost-and-found/
│   └── page.tsx            ← Lost & Found page
├── gpa-calculator/
│   └── page.tsx            ← GPA Calculator page
├── info-hub/
│   └── page.tsx            ← Info Hub page
├── admin/
│   └── page.tsx            ← Admin panel page
│
├── components/             ← Reusable parts
│   ├── NavBar.tsx          ← Navigation bar (ඔක්කොම pages ඉහළ)
│   ├── NavLinks.tsx        ← Nav links list
│   └── Counter.tsx         ← Animated number counter (home page)
│
├── actions/
│   └── auth.ts             ← Cookie set/delete functions
│
└── api/
    ├── create-checkout-session/
    │   └── route.ts        ← Stripe payment create
    └── webhook/stripe/
        └── route.ts        ← Stripe payment confirm
```

---

## 🔲 layout.tsx — Master Template

**`layout.tsx`** කියන්නේ ඔක්කොම pages wrap කරන **outer shell** එක.
NavBar සහ Footer ඇතුළේ handle කරන්නේ ඔය file.

```
Browser screen:
┌─────────────────────────────┐
│  NavBar (layout.tsx)        │  ← ඔල්ලම pages වල show
├─────────────────────────────┤
│                             │
│  {children}  ← Page content │  ← /events, /tickets, etc.
│                             │
├─────────────────────────────┤
│  Footer (layout.tsx)        │  ← ඔල්ලම pages වල show
└─────────────────────────────┘
```

**layout.tsx ගේ main job:**
```typescript
// 1. Cookies read කරනවා (server-side)
const isAuthenticated = cookieStore.get("uwu_auth")?.value === "true";
const role = cookieStore.get("uwu_role")?.value ?? "";
const isAdmin = ["superadmin", "clubadmin"].includes(role);

// 2. NavBar ට pass කරනවා
<NavBar isAuthenticated={isAuthenticated} isAdmin={isAdmin} />

// 3. Fonts load කරනවා (8 fonts!)
Inter, Outfit, Syne, Nobile, Zain, Audiowide, DM_Sans, Inclusive_Sans
```

---

## 🧩 TypeScript — JavaScript ට Types

UWU-NEXUS `.tsx` files use කරනවා — ඒ **TypeScript** + JSX (HTML-like code).

### TypeScript vs JavaScript

```typescript
// JavaScript (no types) — dangerous
function greet(name) {
  return "Hello " + name;
}
greet(123)  // Number දුන්නත් error නෑ!

// TypeScript (with types) — safe
function greet(name: string): string {
  return "Hello " + name;
}
greet(123)  // ❌ Error! string ඕනෙ, number දුන්නා
```

### Interface — Data Shape Define කරන්නවා

Events page ඇතුළේ:
```typescript
// Event object ගේ shape define කරනවා
interface Event {
  id: number;         // ID number
  title: string;      // Event title (text)
  event_date: string; // "2026-08-15"
  location: string;   // "Main Auditorium"
  status: string;     // "approved"
}

// Events list (array of Event objects)
const [events, setEvents] = useState<Event[]>([]);
//                                    ^^^^^^^^
//                          "Event type ගේ array"
```

---

## 🪝 React Hooks — Pages Live කරන Magic

### `useState` — Page ඇතුළේ Data Save කරන්නවා

> 💡 **State** = Component ඇතුළේ live data. State change වෙනකොට page **automatically re-render** (update) වෙනවා.

```typescript
// Events page ඇතුළේ (app/events/page.tsx)

const [events, setEvents]   = useState<Event[]>([]);   // Events list — default empty
const [loading, setLoading] = useState(true);           // Loading? — default true
const [search,  setSearch]  = useState("");             // Search text — default ""
const [category, setCategory] = useState("All");        // Selected category

//    ↑ current value   ↑ value update function
```

**State change → Page update:**
```typescript
// User search box ටයිප් කරනකොට:
<input onChange={(e) => setSearch(e.target.value)} />
//                      ↑ setSearch call → search state update → page re-render
//                        Filtered events list update ✅
```

### `useEffect` — Page Load වෙනකොට Auto-Run

```typescript
// Events page load වෙනකොට backend ගෙන් data ගන්නවා
useEffect(() => {

  fetch('/api/backend/get_events.php')  // Backend ට request
    .then(r => r.json())                // Response JSON parse
    .then(data => {
      if (data.success) {
        setEvents(data.events);  // State update → page show
      }
    })
    .finally(() => setLoading(false));  // Loading off

}, []);  // ← [] = "only run ONCE when page loads"
```

> 🔁 `useEffect` ් `[]` dependency array:
> - `[]` = page load වෙනකොට **once** run
> - `[search]` = `search` change වෙනකොට **run**
> - empty (no array) = every re-render ට run **(dangerous!)**

---

## 🧩 Components — Reusable Parts

### NavBar.tsx

ඔල්ලම pages ඉහළ show වෙන navigation bar.

**Props (Input):** Parent (layout.tsx) ගෙන් receive කරනවා:
```typescript
interface NavBarProps {
  isAuthenticated: boolean;  // Login ද?
  isAdmin: boolean;          // Admin ද?
}
```

**Conditional Rendering:**
```typescript
// Login ද? කියලා check කරලා different buttons show
{isAuthenticated ? (
  // Logged in → Logout button
  <form action={logoutAction}>
    <button>Logout</button>
  </form>
) : (
  // Not logged in → Login + Signup buttons
  <>
    <Link href="/login">Login</Link>
    <Link href="/signup">Sign Up</Link>
  </>
)}
```

**Mobile Menu (Hamburger):**
```typescript
const [open, setOpen] = useState(false);  // Menu open ද?

// Mobile screen → Hamburger icon click කරනකොට menu open
<button onClick={() => setOpen(o => !o)}>
  {open ? <X /> : <Menu />}  // X icon or Menu icon
</button>

// open=true → Mobile menu show
{open && <div className="mobile-menu-overlay">...</div>}
```

**Active Link Highlight:**
```typescript
const pathname = usePathname();  // Current URL path

const isActive = (href: string) =>
  href === "/" ? pathname === "/" : pathname.startsWith(href);

// "/events" ට ඉන්නකොට Events link highlighted
<Link className={`nav-link ${isActive(href) ? "active" : ""}`}>
```

---

## 🗂️ "use client" vs Server Components

Next.js ඇතුළේ pages **2 types** ඇත:

| Type | Declaration | Run වෙන්නේ | Use කරන්නේ |
|------|-------------|-----------|------------|
| **Server Component** | (nothing) | Server ඇතුළේ | Cookies read, DB query |
| **Client Component** | `"use client"` | Browser ඇතුළේ | useState, useEffect, onClick |

```typescript
// layout.tsx — Server Component (top ඇතුළේ "use client" නෑ)
// Cookies read, NavBar render — server side

// app/events/page.tsx — Client Component
"use client";  // ← top ඇතුළේ ඇති
// useState, useEffect, fetch — browser side
```

> 💡 Events page "use client" — ඇයි?
> `useState`, `useEffect`, `onClick` කියන hooks **browser ඇතුළේ only** run වෙනවා.
> Server side ඇතුළේ run කරන්නේ **බෑ**.

---

## 🎨 CSS & Styling

**`app/globals.css`** ඇතුළේ ඔල්ලම styles.

### CSS Variables (Design Tokens)

```css
:root {
  --primary: #000c66;   /* Navy blue — main color */
  --accent:  #7c3aed;   /* Purple — accent */
  --success: #22c55e;   /* Green */
  --danger:  #ef4444;   /* Red */
  --muted:   #64748b;   /* Grey text */
}
```

### Utility Classes (Reusable)

```css
.btn          { padding, border-radius, font-weight }
.btn-primary  { background: var(--primary); color: white }
.card         { background: white; border-radius: 1rem; box-shadow }
.container    { max-width: 1200px; margin: auto; padding }
.form-input   { background: #f8fafc; border: 1px solid #cbd5e1 }
.form-label   { font-weight: 700; color: #1e293b }
```

**Usage in JSX:**
```tsx
<div className="card">          ← CSS class apply
  <input className="form-input" />
  <button className="btn btn-primary">Submit</button>
</div>
```

---

## 🔗 Link vs Navigate — Pages Switch කරන්නවා

```typescript
// Static links — HTML anchor tag replace
import Link from "next/link";
<Link href="/events">Go to Events</Link>

// Dynamic navigation — JavaScript ගෙන් navigate
import { useRouter } from "next/navigation";
const router = useRouter();
router.push("/events");  // Button click කරලා navigate
```

---

## 🖼️ Images — Cloudinary Upload

Product photos, event banners upload කරන්නේ **Cloudinary** (cloud image service):

```typescript
// Marketplace item add කරනකොට image upload
const formData = new FormData();
formData.append("file", imageFile);
formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

const res = await fetch(
  `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
  { method: "POST", body: formData }
);
const data = await res.json();
const imageUrl = data.secure_url;  // → "https://res.cloudinary.com/..."
// ඔය URL database ඇතුළේ save
```

---

## 🗺️ Full Page Render Flow

```
User → /events visit
        ↓
Middleware check (proxy.ts) → logged in? ✅
        ↓
Server renders layout.tsx
  - Cookies read (isAuthenticated, isAdmin)
  - NavBar render with props
        ↓
events/page.tsx render start
  - "use client" → browser side
  - Initial state: events=[], loading=true
        ↓
Browser ඇතුළේ useEffect run
  - fetch('/api/backend/get_events.php')
        ↓
Vercel rewrite → VPS PHP → MySQL
  - SELECT * FROM events WHERE status='approved'
        ↓
JSON response → setEvents(data.events) → loading=false
        ↓
State update → page re-render
  - Events cards show ✅
  - Search box, category filter ready
        ↓
User search box type → setSearch() → filtered list update → re-render ✅
```

---

## 📌 Part 4 Summary — ඔයා ඉගෙනගත්ත දේ

- ✅ **layout.tsx** = Master shell — NavBar + Footer ඔල්ලම pages ට
- ✅ **TypeScript Interface** = Data shape define (Event, User, etc.)
- ✅ **useState** = Page ඇතුළේ live data (change → auto re-render)
- ✅ **useEffect** = Page load ට / dependency change ට auto-run
- ✅ **"use client"** = Browser-side component (hooks use කරන්නට ඕනෙ)
- ✅ **Server Component** = Server-side (cookies, no hooks)
- ✅ **Components** = NavBar, Counter — reusable, props receive
- ✅ **CSS** = globals.css + CSS variables + utility classes
- ✅ **Cloudinary** = Cloud image upload → URL save in DB

---

## ➡️ ඊළඟ Part (Part 5) ගැන Preview

**Part 5: Event Calendar & Ticket Booking — Module Deep Dive**

- Event create → approve → show flow
- Calendar view vs List view
- Ticket purchase with Stripe payment
- Order ID generate කරන method
- Success page — payment verify

---

*📝 UWU-NEXUS Project Guide | Part 4 of 10*
