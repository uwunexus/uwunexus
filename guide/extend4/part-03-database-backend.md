# 🎓 UWU-NEXUS සම්පූර්ණ මාර්ගෝපදේශය
## Part 3: Database & PHP Backend — Data කොහොමද Save/Load කරන්නේ?

---

## 🗄️ Database කියන්නේ මොකක්ද?

**Database** කියන්නේ data (information) **organized ව store කරන digital filing cabinet** එකක්.

> 📦 හිතන්න library එකක shelves. හැම shelf එකක් **table** එකක්. හැම book එකක් **row** එකක්.
> Book ඇතුළේ chapters → **columns**.

UWU-NEXUS use කරන්නේ **MySQL** database එකක්. ඒ VPS server ඇතුළේ run වෙනවා.

---

## 📊 Database Tables (15ක්)

```
uwunexus database
│
├── 👤 users                  ← ලියාපදිංචි users ගේ info
├── 📅 events                 ← Event Calendar events
├── 🎫 ticketed_events        ← ගෙවිලා ගන්නා tickets events
├── 🎟️  ticket_purchases       ← ගත් tickets ගේ records
├── 🛒 marketplace_items      ← Marketplace products
├── 🏷️  marketplace_categories ← Product categories
├── 🖼️  marketplace_images     ← Product images
├── 🔍 lost_found_items       ← Lost & Found reports
├── 📷 lost_found_images      ← Lost & Found item images
├── ℹ️  info_hub_items         ← Info Hub content
├── 🎓 degrees                ← Degree programs (IIT, MRT, etc.)
├── 📚 modules                ← Subject modules
├── 📋 curriculum_groups      ← Curriculum year/semester groups
├── 🗂️  curriculum_modules     ← Subjects per group
└── 📈 user_grades            ← Student grades
```

---

## 🔍 වැදගත් Tables Detail

### 1. `users` Table — ලියාපදිංචි Users

| Column | Type | කරන දේ |
|--------|------|---------|
| `id` | int (AUTO) | Unique number (1, 2, 3...) |
| `full_name` | varchar | "Nilesh Perera" |
| `email` | varchar | "iit23068@std.uwu.ac.lk" |
| `password_hash` | varchar | Hashed password |
| `enrollment_number` | varchar | "UWU/IIT/23/068" |
| `batch` | varchar | "18th batch" |
| `degree` | varchar | "IIT" |
| `specialization` | varchar | GPA calculator specialization |
| `role` | enum | student / staff / clubadmin / superadmin |
| `is_verified` | tinyint | 0=not verified, 1=verified |
| `verification_token` | varchar | Email verify token |
| `created_at` | timestamp | Account create කරපු time |

---

### 2. `events` Table — Event Calendar

| Column | Type | කරන දේ |
|--------|------|---------|
| `id` | int | Unique event ID |
| `title` | varchar | "Tech Symposium 2026" |
| `description` | text | Event description |
| `event_date` | date | "2026-08-15" |
| `event_time` | time | "09:00:00" |
| `location` | varchar | "Main Auditorium" |
| `organized_by` | varchar | "CS Society" |
| `category` | enum | Academic / Cultural / Sports / etc. |
| `image_url` | varchar | Cloudinary image link |
| `status` | enum | **pending** → **approved** → **rejected** |
| `created_by` | int | User ID (creator) |

> ⚠️ **Status System:** Admin approve කරන්නෙ නෑ ගියොත් event show **වෙන්නේ නෑ**.
> හැම event එකක්ම default pending. Admin approve කළාම public ට visible.

---

### 3. `ticketed_events` Table — Paid Ticket Events

| Column | Type | කරන දේ |
|--------|------|---------|
| `id` | int | Unique ID |
| `title` | varchar | Event name |
| `price` | decimal | LKR 1000.00 |
| `total_tickets` | int | 200 (Total sold කරන්න පුළුවන්) |
| `available_tickets` | int | 150 (තාම available) |
| `status` | enum | active / closed |

---

### 4. `ticket_purchases` Table — ගත් Tickets

| Column | Type | කරන දේ |
|--------|------|---------|
| `order_id` | varchar | "TKT-STRIPE-1783879757-9883" |
| `user_id` | int | ගත්ත user ගේ ID |
| `ticket_event_id` | int | Event ID |
| `amount` | decimal | ගෙවපු total |
| `status` | enum | **pending** → **success** / failed |
| `payhere_payment_id` | varchar | Stripe payment ID |

---

### 5. `marketplace_items` Table

| Column | Type | කරන දේ |
|--------|------|---------|
| `title` | varchar | "Engineering Drawing Set" |
| `price` | decimal | LKR 500.00 |
| `condition_state` | varchar | "Like New" |
| `category_id` | int | Category reference |
| `seller_id` | int | User ID (seller) |
| `status` | enum | pending / active / sold / hidden / rejected |
| `contact_number` | varchar | "0771234567" |

---

## 🔌 Database Connection — `backend/db.php`

**ඔක්කොම PHP files ගේ පළවෙනි line** `require 'db.php';` — ඒ database connect කරන file.

```php
// backend/db.php

$host = '127.0.0.1';    // Database server (same VPS)
$db   = 'uwunexus';     // Database name
$user = 'nilesh';       // DB username (local)
$pass = '12345678';     // DB password (local)

// Production override — config-prod.php ගෙන් read කරනවා
if (file_exists('config-prod.php')) {
    include 'config-prod.php';
    // $user = 'nexus_user', $pass = 'nexus_pass123'
}

// PDO connection — PHP ගෙන් MySQL connect කරන standard method
$pdo = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
```

> 💡 **PDO** (PHP Data Objects) — PHP ගෙන් MySQL ට securely කතා කරන method.
> SQL Injection attacks ගෙන් protect කරනවා.

---

## 🐘 PHP Backend — File Structure

Backend ඇතුළේ **PHP files 48ක්** ඉන්නවා. Pattern clear:

```
get_*.php      ← Data READ කරන files
create_*.php   ← Data CREATE (INSERT) කරන files
update_*.php   ← Data UPDATE කරන files
delete_*.php   ← Data DELETE කරන files
```

### උදාහරණ:

| File | HTTP Method | SQL Operation | කරන දේ |
|------|-------------|---------------|---------|
| `get_events.php` | GET | SELECT | Events list ගන්නවා |
| `create_event.php` | POST | INSERT | Event add කරනවා |
| `update_event.php` | POST | UPDATE | Event edit කරනවා |
| `delete_event.php` | POST | DELETE | Event delete කරනවා |

---

## 🔄 API Call Flow — Frontend ගෙන් Backend ට

### 1. User Events page open කරනවා

```
Browser → https://uwunexus.tech/events
               ↓
          Next.js events page load
               ↓
          useEffect() — page load වෙනකොට auto-run
               ↓
          fetch('/api/backend/get_events.php')
               ↓
          Vercel rewrite → http://174.138.28.209:8000/get_events.php
               ↓
          PHP → SQL query → Database
               ↓
          JSON response → Next.js → Browser show
```

### 2. Fetch Call — Code ගෙන් දකිනකොට

**Frontend (Next.js) side:**
```typescript
// app/events/page.tsx ඇතුළේ
useEffect(() => {
  fetch('/api/backend/get_events.php')
    .then(res => res.json())           // JSON ව parse
    .then(data => setEvents(data.events));  // State update
}, []);
```

**Backend (PHP) side:**
```php
// backend/get_events.php
require 'db.php';
header('Content-Type: application/json');  // JSON response කියලා declare

$stmt = $pdo->prepare("SELECT * FROM events WHERE status = 'approved' ORDER BY event_date ASC");
$stmt->execute();
$events = $stmt->fetchAll();

echo json_encode(["success" => true, "events" => $events]);
// → {"success":true,"events":[{...},{...}]}
```

---

## 🛡️ SQL Injection Protection

> ⚠️ **SQL Injection** — hacker ලා malicious SQL code send කරලා database destroy / steal කරන attack.

**Bad (Dangerous) way:**
```php
// NEVER do this!
$email = $_POST['email'];  // Hacker: "' OR 1=1 --"
$sql = "SELECT * FROM users WHERE email = '$email'";
// → SELECT * FROM users WHERE email = '' OR 1=1 --'
// → Database ඔක්කොම expose!
```

**Good (Safe) way — PDO Prepared Statements:**
```php
// UWU-NEXUS uses this
$stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$email]);  // PHP automatically sanitize
// → Email ඇතුළේ special characters escape → Safe ✅
```

---

## 📡 HTTP Methods — GET vs POST

PHP files ට data send කරන **2 ways** ඇත:

| Method | Use | Data Location |
|--------|-----|---------------|
| **GET** | Data fetch (read) | URL ඇතුළේ: `?id=5&status=approved` |
| **POST** | Data send (create/update) | Request body ඇතුළේ (invisible) |

```php
// GET example
GET /get_events.php?status=approved&requester_id=7

// POST example
POST /create_event.php
Body: {"title":"Tech Symposium","date":"2026-08-15",...}
```

---

## 🔁 CRUD Operations — Real Examples

### CREATE — Event Add කරන්නවා

```
Admin → form fill → Submit
     ↓
POST /create_event.php
{title, description, date, time, location, ...}
     ↓
INSERT INTO events (title, description, event_date, ..., status)
VALUES ('Tech Symposium', '...', '2026-08-15', ..., 'pending')
     ↓
{"success": true, "message": "Event created"}
```

### READ — Events Load කරන්නවා

```
Page load
     ↓
GET /get_events.php?status=approved
     ↓
SELECT * FROM events WHERE status = 'approved'
     ↓
[{id:1, title:"Symposium",...}, {id:2,...}]
```

### UPDATE — Event Approve කරන්නවා

```
Admin → Approve button click
     ↓
POST /update_event_status.php
{id: 5, status: "approved"}
     ↓
UPDATE events SET status = 'approved' WHERE id = 5
     ↓
{"success": true}
```

### DELETE — Event Delete කරන්නවා

```
Admin → Delete button click
     ↓
POST /delete_event.php
{id: 5}
     ↓
DELETE FROM events WHERE id = 5
     ↓
{"success": true}
```

---

## 🌐 Vercel Rewrite — `/api/backend` Magic

Vercel ඇතුළේ **next.config.ts** rewrite rule:

```typescript
// next.config.ts
rewrites() {
  return [{
    source: '/api/backend/:path*',
    destination: 'http://174.138.28.209:8000/:path*'
  }]
}
```

**ඒ කියන්නේ:**

```
Browser → /api/backend/get_events.php
               ↓ (Vercel server-side rewrite)
VPS → http://174.138.28.209:8000/get_events.php
```

> 💡 Browser CORS block නොවී request **Vercel server ගෙන්** VPS ට යනවා.
> User ට VPS IP address **නොපෙනේ** — security ✅

---

## 📁 Backend Files Full List

| Category | Files |
|----------|-------|
| **Auth** | `login.php`, `signup.php`, `verify_email.php`, `forgot_password.php`, `reset_password.php` |
| **Events** | `get_events.php`, `create_event.php`, `update_event.php`, `update_event_status.php`, `delete_event.php` |
| **Tickets** | `get_ticketed_events.php`, `create_ticket_event.php`, `update_ticket_event.php`, `delete_ticket_event.php`, `get_ticket_purchases.php`, `update_ticket_status.php`, `update_stripe_order.php` |
| **Marketplace** | `get_marketplace_items.php`, `create_marketplace_item.php`, `update_marketplace_item.php`, `admin_delete_marketplace_item.php`, `get_marketplace_categories.php` |
| **Lost & Found** | `get_lost_found.php`, `create_lost_found.php`, `update_lost_found.php`, `delete_lost_found.php` |
| **GPA** | `get_gpa.php`, `save_grades.php`, `set_specialization.php` |
| **Info Hub** | `get_info_hub.php`, `create_info_hub.php`, `update_info_hub.php`, `delete_info_hub.php` |
| **Admin** | `users.php`, `update_role.php`, `delete_user.php` |
| **Payment** | `generate_payhere_hash.php`, `payhere_notify.php`, `create_stripe_order.php`, `check_payment_status.php` |
| **Setup** | `db.php`, `config-prod.php`, `schema.sql`, `migrate_auth.php` |

---

## 📌 Part 3 Summary — ඔයා ඉගෙනගත්ත දේ

- ✅ **Database = Filing cabinet** — tables, rows, columns
- ✅ **15 tables** — users, events, tickets, marketplace, lost_found, GPA, info_hub
- ✅ **db.php** — ඔක්කොම PHP files ගේ database connection source
- ✅ **PDO Prepared Statements** — SQL Injection ගෙන් protect
- ✅ **GET vs POST** — data read vs data send
- ✅ **CRUD** — Create, Read, Update, Delete operations
- ✅ **Vercel rewrite** — `/api/backend/*` → VPS proxy (browser ට IP නොපෙනේ)

---

## ➡️ ඊළඟ Part (Part 4) ගැන Preview

**Part 4: Next.js Frontend — Pages, Components, State**

- TypeScript කියන්නේ මොකද?
- Pages vs Components
- `useState` / `useEffect` hooks
- Navbar, Cards, Modals
- Cloudinary (image upload)

---

*📝 UWU-NEXUS Project Guide | Part 3 of 10*
