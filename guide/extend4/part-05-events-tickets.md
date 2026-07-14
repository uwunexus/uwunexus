# 🎓 UWU-NEXUS සම්පූර්ණ මාර්ගෝපදේශය
## Part 5: Event Calendar & Ticket Booking — Module Deep Dive

---

## 📅 MODULE 1: Event Calendar

### Event Calendar කියන්නේ මොකක්ද?

University events (Academic, Cultural, Sports, etc.) **view කරන** module.
ඕනෑ ම student ට events ගැන දැනගන්න.

```
View Modes 2ක්:
├── 📋 List View    → Events chronological order ට list ව
└── 📅 Calendar View → Month calendar ඇතුළේ dots ව show
```

---

### 🔄 Event Life Cycle (Event ගෙ Journey)

```
Admin → Event create
             ↓
      status = 'pending'  (Students ට නොපෙනේ)
             ↓
   Super Admin approve
             ↓
      status = 'approved' (Students ට පෙනේ ✅)
             ↓
   OR Super Admin reject
             ↓
      status = 'rejected' (Students ට නොපෙනේ ❌)
```

> 💡 **ඇයි approval system ඇත?**
> ඕනෑ ම clubadmin ට fake events add කරන්නේ බෑ.
> SuperAdmin ට authority — ඔය approve/reject කරනවා.

---

### 👨‍💼 Event Create — කවුරු හරි කරන්න පුළුවන්?

```php
// backend/create_event.php

// Role check:
if (role == 'superadmin') → status = 'approved'  (auto approve!)
if (role == 'clubadmin')  → status = 'pending'   (approval ඕනෙ)
if (role == 'student')    → 403 Forbidden! ❌
```

**SuperAdmin** add කරනකොට event **instant** show.
**ClubAdmin** add කරනකොට SuperAdmin approve දෙනකම් wait.

---

### 📤 Event Create Flow (Admin Panel)

```
Admin → "Create Event" button click
            ↓
Modal open — form fill:
  Title, Description, Date, Time,
  Location, Organized By, Category, Image
            ↓
Image select → Cloudinary upload → image_url ගන්නවා
            ↓
POST /api/backend/create_event.php
  {title, date, time, location, category, image_url, requester_id}
            ↓
PHP:
  - Role check (admin only)
  - Status decide (superadmin=approved, clubadmin=pending)
  - INSERT INTO events
            ↓
{"success": true, "status": "approved"}
            ↓
Admin panel event list refresh ✅
```

---

### 📥 Events Load Flow (Student View)

```
Student → /events page open
               ↓
useEffect → fetch('/api/backend/get_events.php')
               ↓
PHP:
  SELECT * FROM events
  WHERE status = 'approved'
  ORDER BY event_date ASC
               ↓
[{id:1, title:"Tech Symposium",...}, ...]
               ↓
setEvents(data.events) → Page show ✅
```

---

### 🔍 Search & Filter

```typescript
// app/events/page.tsx

const filtered = events.filter(e => {
  // Category filter
  const matchCat = category === "All" || e.category === category;

  // Search filter (title, location, organized_by ගෙන් search)
  const q = search.toLowerCase();
  const matchSearch = !q
    || e.title.toLowerCase().includes(q)
    || e.location.toLowerCase().includes(q)
    || e.organized_by.toLowerCase().includes(q);

  return matchCat && matchSearch;
});
```

State changes → re-render → filtered list auto-update!

---

### 📅 Calendar View

```
State:
  calendarDate = Date(2026, 6, 1)  ← Current displayed month
  selectedDay  = 15                ← Selected day

Calendar build:
  daysInMonth  = 31  (July has 31 days)
  firstWeekDay = 3   (Wednesday — July 1 falls on)

Events by day:
  eventsByDay = {
    5:  [Tech Symposium],
    15: [Sports Day, Cultural Show],
    28: [Career Fair]
  }

User → day 15 click → selectedDay = 15
→ Show events on day 15
```

---

## 🎫 MODULE 2: Event Ticket Booking

### Ticket Booking කියන්නේ මොකක්ද?

**Paid events** සඳහා online ටිකට් ගන්න module.
**Stripe** (international payment gateway) use කරනවා.

---

### 🏷️ Ticketed Event vs Normal Event

| Feature | Normal Event | Ticketed Event |
|---------|-------------|----------------|
| Table | `events` | `ticketed_events` |
| Price | Free | LKR amount |
| Tickets | Unlimited | Limited count |
| Payment | No | Stripe card payment |
| Booking | No | Yes |

---

### 🎟️ Ticket Purchase — Full Flow (Step by Step)

```
STEP 1: Student Event Card click → Checkout Modal open

STEP 2: Form fill
  First Name, Last Name, Email, Phone
  Quantity select (+ / - buttons)

STEP 3: "Proceed to Payment" click
  → STEP 3a: PHP Backend — Order Create
  → STEP 3b: Stripe — Payment Session Create
  → STEP 3c: Redirect to Stripe checkout page

STEP 4: Student → Stripe page ඇතුළේ card details දානවා

STEP 5: Payment Success → Redirect to success page

STEP 6: Success page — Payment verify + DB update
```

---

### STEP 3a: PHP Order Create — `create_stripe_order.php`

```php
// Unique Order ID generate කරනවා
$order_id = "TKT-STRIPE-" . time() . "-" . rand(1000, 9999);
// Example: "TKT-STRIPE-1783879757-9883"
//                        ↑ unix timestamp   ↑ random 4 digits

// Database ඇතුළේ 'pending' order save
INSERT INTO ticket_purchases (
  ticket_event_id, user_id, order_id,
  amount, customer_name, customer_email, status
) VALUES (2, 7, 'TKT-STRIPE-...', 1000, 'Nilesh', 'iit23068@...', 'pending')
```

> 💡 **ඇයි pending?**
> Stripe payment complete වෙනකම් order **pending** ව ඉන්නවා.
> Payment fail/cancel → pending ව remain. Success → 'success' update.

---

### STEP 3b: Stripe Session Create — `app/api/create-checkout-session/route.ts`

```typescript
// Next.js API route — Stripe library use කරනවා

const host = req.headers.get("host");         // "uwunexus.tech"
const baseUrl = `https://${host}`;            // Return URL base

const session = await stripe.checkout.sessions.create({
  payment_method_types: ["card"],
  mode: "payment",
  line_items: [{
    price_data: {
      currency: "lkr",
      product_data: { name: "ප්‍රහර්ශනා 2026" },
      unit_amount: 100000,  // LKR 1000 → cents (×100)
    },
    quantity: 1,
  }],
  // Success / Cancel redirect URLs
  success_url: `${baseUrl}/tickets/success?session_id={CHECKOUT_SESSION_ID}&order_id=TKT-STRIPE-...`,
  cancel_url:  `${baseUrl}/tickets?canceled=true`,
});

return { sessionId: session.id, url: session.url };
// url = "https://checkout.stripe.com/pay/cs_test_..."
```

---

### STEP 3c: Stripe Page Redirect

```typescript
// Frontend → Stripe checkout page redirect
window.location.href = stripeData.url;
// → User → Stripe checkout page (Stripe ගේ secure page)
```

```
Browser URL change:
uwunexus.tech/tickets
      ↓
checkout.stripe.com/pay/cs_test_a1q...
(Student card details දානවා මෙතන)
```

---

### STEP 5: Payment Success → `app/tickets/success/page.tsx`

Payment successful නම් Stripe redirect:
```
https://uwunexus.tech/tickets/success
  ?session_id=cs_test_a1qT5Y...
  &order_id=TKT-STRIPE-1783879757-9883
```

Success page ඇතුළේ (Server Component):
```typescript
// 1. Stripe ගෙන් payment verify
const stripe = new Stripe(process.env.stripsecretekey);
const session = await stripe.checkout.sessions.retrieve(session_id);

if (session.payment_status === "paid") {
  // ✅ Paid!

  // 2. PHP backend ට update කරන්න කියනවා
  await fetch('/api/backend/update_stripe_order.php', {
    method: "POST",
    body: JSON.stringify({
      order_id: "TKT-STRIPE-...",
      status: "success",
      payment_id: session.payment_intent
    })
  });
}
```

---

### STEP 6: DB Update — `update_stripe_order.php`

```php
// 1. Order find කරනවා
SELECT status, ticket_event_id, amount, price FROM ticket_purchases
JOIN ticketed_events ON ...
WHERE order_id = 'TKT-STRIPE-...'

// 2. Status update (pending → success)
UPDATE ticket_purchases
SET status = 'success', payhere_payment_id = 'pi_...'
WHERE order_id = 'TKT-STRIPE-...'

// 3. Available tickets reduce
// Quantity = amount / price = 1000 / 1000 = 1
UPDATE ticketed_events
SET available_tickets = available_tickets - 1
WHERE id = 2
// 100 → 99 tickets remaining
```

---

### 💰 Stripe Price Calculation

```
LKR 1000.00 (database price)
    ↓
× 100  (Stripe wants cents/smallest unit)
    ↓
100000  (sent to Stripe)
    ↓
Stripe charge: Rs. 1000.00 ✅
```

> 💡 USD → cents (100 cents = $1.00)
> LKR → same logic (100 = Rs. 1.00)

---

### 🎟️ Ticket Count Logic

```
ticketed_events table:
  total_tickets     = 200   (Admin set කළ total)
  available_tickets = 99    (sold 1 after our test)

Show on UI:
  "99 / 200 tickets remaining"

When available_tickets = 0:
  "SOLD OUT" → Purchase button disabled ✅
```

---

### 🔐 Sold Out Check

```typescript
// Frontend — Ticket card
{event.available_tickets > 0 ? (
  <button onClick={() => setSelectedEvent(event)}>
    Buy Ticket
  </button>
) : (
  <button disabled style={{ opacity: 0.5 }}>
    Sold Out
  </button>
)}
```

---

### 📊 Complete Ticket Purchase State Diagram

```
available_tickets = 100

User A buys 1 ticket:
  create_stripe_order → pending record
  Stripe payment → success
  update_stripe_order → status='success', available_tickets=99

User B buys 1 ticket:
  create_stripe_order → pending record
  Stripe payment → CANCELED
  update_stripe_order NOT called → pending remains
  available_tickets stays 99 ✅ (cancelled purchase නිසා reduce නෑ)
```

---

## 📌 Part 5 Summary — ඔයා ඉගෙනගත්ත දේ

**Events:**
- ✅ Event life cycle: **pending → approved → show** (superadmin only approve)
- ✅ SuperAdmin event → auto approved. ClubAdmin → needs approval
- ✅ Search + Category filter — client-side state filtering
- ✅ Calendar view — eventsByDay map, day click → events show

**Tickets:**
- ✅ Order ID: `TKT-STRIPE-{timestamp}-{random}` — unique guaranteed
- ✅ **3 steps:** Create pending order → Stripe session → Redirect
- ✅ Success page → Stripe verify → PHP update → DB status + ticket count
- ✅ LKR × 100 = Stripe unit amount (cents logic)
- ✅ Sold out → button disabled, no purchase possible

---

## ➡️ ඊළඟ Part (Part 6) ගැන Preview

**Part 6: Marketplace & Lost and Found — Buy/Sell + Item Reports**

- Marketplace item create → approve → list flow
- Image upload (Cloudinary multi-image)
- Lost/Found item report + resolve
- Admin moderation

---

*📝 UWU-NEXUS Project Guide | Part 5 of 10*
