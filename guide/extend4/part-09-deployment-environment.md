# 🎓 UWU-NEXUS සම්පූර්ණ මාර්ගෝපදේශය
## Part 9: Deployment & Environment — How it all goes LIVE

---

## 🌍 Website එක Live කරන්නේ කොහොමද? (Architecture)

UWU-NEXUS project එක **local computer** එකේ ඉඳන් ලෝකෙටම පෙන්නන්න **parts 3ක්** එකතු කරලා තියෙනවා:

1. **GitHub** — Code එක save කරන "Cloud Folder" එක
2. **Vercel** — Next.js frontend එක host කරන server එක
3. **VPS (Virtual Private Server)** — PHP backend එකයි MySQL database එකයි run වෙන server එක (IP: 174.138.28.209)

---

## 🔄 GitHub → Vercel Auto-Deployment

**GitHub** එකයි **Vercel** එකයි connect කරලයි තියෙන්නේ. ඒ කියන්නේ:

```
Developer (ඔයා) → Code edit කරනවා
       ↓
`git push origin main` (GitHub එකට යවනවා)
       ↓
Vercel එකට auto signal එකක් යනවා "New code arrived!"
       ↓
Vercel අලුත් code එක අරන් "next build" run කරලා website එක update කරනවා
       ↓
Live in 1 minute! 🎉
```

ඔයාට server එකට ගිහින් manual update කරන්න ඕනෙ නෑ, Vercel ඒක automatically බලාගන්නවා.

---

## 🐘 VPS Server (Backend + Database)

Vercel වලට PHP run කරන්න බෑ (ඒක Node.js/Next.js වලට විතරයි). ඒක නිසා අපි **VPS Server** එකක් අරන් තියෙනවා.

**Server IP:** `174.138.28.209`  
**Operating System:** Linux (Ubuntu/Debian)  
**Software Installed:**
- `PHP 8.4-FPM` — PHP code run කරන්න
- `MariaDB (MySQL)` — Database එක
- `NGINX` — Web server එක (Port 8000 වලින් requests අහගෙන ඉන්නවා)

### NGINX Configuration (Web Server)
NGINX තමයි internet එකෙන් එන requests අරගෙන PHP වලට දෙන්නේ.

```nginx
# /etc/nginx/sites-available/uwunexus-backend
server {
    listen 8000;              # 8000 port එකෙන් අහගෙන ඉන්නවා
    server_name _;

    root /var/www/uwunexus-backend;  # PHP files තියෙන folder එක
    index index.php;

    # URL එකේ එන දේවල් PHP වලට යවනවා
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # PHP files run කරන්න PHP-FPM එකට යවනවා
    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.4-fpm.sock;
        ...
    }
}
```

---

## 🔐 Environment Variables (Secrets)

Passwords, API keys වගේ දේවල් code එක ඇතුළේ (GitHub එකේ) save කරන්නේ **නෑ**. ඒවට කියන්නේ **Environment Variables**.

### 1. Frontend Secrets (Vercel)
Vercel settings වල මේ variables add කරලා තියෙනවා:
- `NEXT_PUBLIC_API_URL` = `https://uwunexus.tech/api/backend`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` = `...` (Image upload)
- `stripsecretekey` = `sk_test_...` (Stripe payments)

*Local computer එකේ මේවා `.env.local` file එකේ තියෙනවා.*

### 2. Backend Secrets (VPS)
VPS එක ඇතුළේ `config-prod.php` කියලා file එකක් තියෙනවා.

```php
// /var/www/uwunexus-backend/config-prod.php
<?php
// Production overrides — loaded by db.php
$user = 'nexus_user';
$pass = 'nexus_pass123';
$frontend_url = 'https://uwunexus.tech';
$stripe_secret = 'sk_test_51Tl...';

$request_origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed_origins = ['https://uwunexus.tech', 'https://www.uwunexus.tech'];
$allowed_origin = in_array($request_origin, $allowed_origins) ? $request_origin : 'https://uwunexus.tech';
?>
```
මේ file එක GitHub එකේ නෑ! මේක VPS එකේ විතරයි තියෙන්නේ. ඒක නිසා passwords safe.

---

## 🌐 The API Proxy Magic (next.config.ts)

Frontend එක තියෙන්නේ `uwunexus.tech` වල. Backend එක තියෙන්නේ `174.138.28.209:8000` වල.
Directly browser එකෙන් IP address එකට call කළොත් **CORS error** (Cross-Origin Resource Sharing) එනවා. (Security policy එකක්).

ඒක නවත්තන්න Next.js **Rewrite Proxy** එකක් use කරනවා:

```typescript
// next.config.ts
rewrites() {
  return [
    {
      source: "/api/backend/:path*",
      destination: "http://174.138.28.209:8000/:path*",
    },
  ];
}
```
**වෙන දේ:**
1. Browser එක call කරන්නේ `https://uwunexus.tech/api/backend/login.php`
2. Vercel server එක ඒ request එක අරගෙන `http://174.138.28.209:8000/login.php` ට යවනවා.
3. VPS එකෙන් එන answer එක Vercel එක browser එකට දෙනවා.

**වාසි:**
- CORS errors නෑ!
- User ට VPS එකේ IP address එක පේන්නේ නෑ (More secure).

---

## 💳 Stripe Webhook

Stripe payments කරාම, "සල්ලි ආවා" කියලා Stripe එකෙන් අපේ server එකට කියන්න ඕනේ. ඒකට කියන්නේ **Webhook**.

1. Payment successful උනාම Stripe එකෙන් `POST https://uwunexus.tech/api/webhook/stripe` වලට request එකක් එවනවා.
2. Next.js (`app/api/webhook/stripe/route.ts`) ඒක අරගෙන payment එක ඇත්තද කියලා verify කරනවා.
3. ඊට පස්සේ Next.js එකෙන් PHP backend එකට (`update_stripe_order.php`) කතා කරලා database එකේ status එක `success` කරනවා.

---

## 📌 Part 9 Summary — ඔයා ඉගෙනගත්ත දේ

- ✅ **Vercel** = Frontend (Next.js) host කරන තැන
- ✅ **VPS** = Backend (PHP + MySQL) host කරන තැන + NGINX server
- ✅ **Continuous Deployment** = GitHub එකට push කරපු ගමන් auto Vercel update වෙනවා
- ✅ **.env & config-prod.php** = Passwords secure ව තියාගන්න විදිහ
- ✅ **Next.js Rewrites** = IP address එක hide කරලා CORS errors නැති කරන proxy magic එක
- ✅ **Stripe Webhook** = Payment success උනාම auto DB update වෙන flow එක

---

## ➡️ ඊළඟ Part (Part 10) ගැන Preview

**Part 10: Future Improvements & Maintenance (අවසාන කොටස)**

- Project එකේ තව හදන්න පුළුවන් මොනවද?
- Bugs ආවොත් කොහොමද fix කරන්නේ (Debugging)
- Database backup ගන්නේ කොහොමද
- Summary of the whole journey!

---

*📝 UWU-NEXUS Project Guide | Part 9 of 10*
