# 🎓 UWU-NEXUS සම්පූර්ණ මාර්ගෝපදේශය
## Part 1: Project එක කුමක්ද? Big Picture (ලොකු රූපය)

---

> **කියවන්නාට සටහන:** මේ guide එක 10 parts වලට කඩලා තියෙනවා. ඔයාගේ project
> A සිට Z දක්වා කියලා දෙනවා — 10 වසරේ ළමයෙකුටවත් තේරෙන විදිහට. 🙂

---

## 🏫 UWU-NEXUS කියන්නේ මොකක්ද?

**UWU-NEXUS** කියන්නේ **Uva Wellassa University** ශිෂ්‍යයන් සඳහා හදපු **website එකක්** (web application).

හිතන්න... university එකේ:
- 📅 ඉදිරි events ගැන දැනගන්න website එකක් නෑ
- 🎫 ටිකට් ගන්න queue වෙලා ඉන්න ඕනෙ
- 🛒 දේවල් ගන්න / දෙන්න proper platform එකක් නෑ
- 📚 GPA calculate කරන්න manual calculation කරන්න ඕනෙ

**UWU-NEXUS** හදලා තියෙන්නේ මේ හැම problem එකටම **එකම website එකෙන්** solution දෙන්න! 🚀

---

## 🗺️ Website එකේ ඇති Modules 6ක් (කොටස් 6ක්)

```
UWU-NEXUS
├── 1. 📅 University Event Calendar   → University events view කරන්න
├── 2. 🎫 Event Ticket Booking        → Events වලට online ටිකට් ගන්න
├── 3. 🛒 Sarasawi Alewisala          → Student marketplace (buy/sell)
├── 4. 🔍 Lost & Found               → Uni ඇතුළේ හොයාගත නොහැකිව ගිය / හෙව් items
├── 5. 🎓 GPA Calculator             → ඔයාගේ GPA automatically calculate කරගන්න
└── 6. ℹ️  Information Hub            → Lecturers, emergency numbers, procedures
```

---

## 👥 User Types (Website එකට Login වෙන වර්ග)

Website එකට **3 types** ගේ users ඉන්නවා. හැම කෙනෙකුටම **different permissions** (බලතල) තියෙනවා.

| User Type | කවුද? | කරන්න පුළුවන් දේ |
|-----------|--------|------------------|
| **Student** | `iit23068@std.uwu.ac.lk` email ඇති ළමයා | Events view, tickets buy, marketplace use |
| **Staff** | `john@uwu.ac.lk` email ඇති lecturer | Student වගේම + extra access |
| **Super Admin** | Website manage කරන admin | **ඔක්කොම** manage කරන්න පුළුවන් |

> ⚠️ **වැදගත්:** Login වෙන්න **university email** (`@uwu.ac.lk` හෝ `@std.uwu.ac.lk`)
> **අනිවාර්යයෙන්ම** ඕනෙ. Gmail, Yahoo වලින් login වෙන්න **බෑ**.
> This keeps the platform safe — only real UWU students can use it.

---

## 🏗️ Project එකේ "Building Blocks" — Technology Stack

Website එකක් හදන්න **ගොඩ දාන ගල් වගේ** technologies (tools) use කරනවා. UWU-NEXUS වල use කරලා තියෙන tools:

```
🌐 Browser (ඔයා දකින දේ)
        ↕️
⚡ Next.js (Frontend)   ← Website pages හදන tool
        ↕️
🐘 PHP (Backend)        ← Database සමඟ කතා කරන tool
        ↕️
🗄️  MySQL (Database)    ← Data save කරන tool
```

### සරලව කිව්වොත්:

| Part | Name | Role (කාර්යය) | හිතන්නේ... |
|------|------|--------------|------------|
| **Frontend** | Next.js | User දකින website | Restaurant menu card |
| **Backend** | PHP | Logic කරන server | Restaurant kitchen |
| **Database** | MySQL | Data store කරන database | Restaurant order book |

---

## 📁 Files කොහෙද ඉන්නේ?

ඔයාගේ computer ඇතුළේ project folder එකේ structure:

```
uwunexus/
│
├── 📂 app/                    ← Next.js website files (frontend)
│   ├── page.tsx               ← Home page
│   ├── login/                 ← Login page
│   ├── events/                ← Events page
│   ├── tickets/               ← Tickets page
│   ├── marketplace/           ← Marketplace page
│   ├── lost-and-found/        ← Lost & Found page
│   ├── gpa-calculator/        ← GPA Calculator page
│   ├── info-hub/              ← Info Hub page
│   ├── admin/                 ← Admin panel
│   └── components/            ← Reusable parts (eg: NavBar)
│
├── 📂 backend/                ← PHP files (backend)
│   ├── db.php                 ← Database connection
│   ├── login.php              ← Login logic
│   ├── signup.php             ← Signup logic
│   ├── get_events.php         ← Events data ගන්නවා
│   └── ... (others)
│
├── 📂 public/                 ← Images, GIFs
│
├── next.config.ts             ← Next.js settings
├── .env.local                 ← Secret passwords (API keys)
└── package.json               ← Project dependencies list
```

---

## 🌍 Website එක කොහෙ "Live" වෙලා ඉන්නේ?

```
ඔයාගේ Computer  →  GitHub  →  Vercel (website host)  →  Users
(Code write)        (Code save)                           (Visit)
                                       ↕️
                               VPS Server (174.138.28.209)
                               (PHP Backend + MySQL Database)
```

| Part | Host කරන්නේ | URL |
|------|------------|-----|
| **Website (Frontend)** | Vercel | `https://uwunexus.tech` |
| **Backend + Database** | VPS Server | `http://174.138.28.209:8000` |
| **Code Storage** | GitHub | `https://github.com/uwunexus/uwunexus` |

---

## 🔄 User Login වෙලා Event එකක් View කරන Flow

Step by step:

```
1.  User browser එකේ uwunexus.tech type කරනවා
        ↓
2.  Vercel, Next.js website browser එකට දෙනවා
        ↓
3.  User login page fill කරනවා (email + password)
        ↓
4.  Next.js, PHP backend (VPS) ට "ඒ user valid ද?" කියලා අහනවා
        ↓
5.  PHP, MySQL database check කරලා "Yes / No" කියනවා
        ↓
6.  "Yes" නම් → User logged in! 🎉 Home page show වෙනවා
        ↓
7.  User "Events" button click කරනවා
        ↓
8.  Next.js, PHP ට "events list දෙන්න" කියලා ඉල්ලනවා
        ↓
9.  PHP, database ගෙන් events ගෙනත් Next.js ට දෙනවා
        ↓
10. Next.js ඒ data browser ට show කරනවා ✅
```

---

## 📌 Part 1 Summary — ඔයා ඉගෙනගත්ත දේ

- ✅ UWU-NEXUS කියන්නේ UWU students සඳහා හදපු **web platform** එකක්
- ✅ **6 modules** ඇත — Events, Tickets, Marketplace, Lost & Found, GPA, Info Hub
- ✅ **3 user types** ඇත — Student, Staff, Super Admin
- ✅ **Next.js** (website) + **PHP** (backend) + **MySQL** (database) use කරනවා
- ✅ Website **Vercel** වල, Backend + Database **VPS** (server) එකේ, Code **GitHub** වල

---

## ➡️ ඊළඟ Part (Part 2) ගැන Preview

**Part 2: Login & Signup — User System කොහොමද වැඩ කරන්නේ?**

- Email validation (ඇයි university email ඕනේ?)
- Password hashing (password secure ව save කරන method)
- Cookie system (login state remember කරන විදිහ)
- Middleware (protected pages — login නැතිව access කරන්න බෑ)

---

*📝 UWU-NEXUS Project Guide | Part 1 of 10*
