# 🎓 UWU-NEXUS සම්පූර්ණ මාර්ගෝපදේශය
## Part 2: Login & Signup — User System කොහොමද වැඩ කරන්නේ?

---

## 🔑 මේ Part එකේ ඉගෙනගන්නේ:

- Account create කරන (Signup) flow
- Login කරන flow
- Password secure ව save කරන method
- Email verify කරන method
- Cookie system (login state remember කරන හැටි)
- Protected pages (login නැතිව access කරන්න බෑ)

---

## 📋 STEP 1: Signup (Account හදන්න)

### User Interface — `app/signup/page.tsx`

User signup page fill කරනවා:
- Full Name
- University Email (`iit23068@std.uwu.ac.lk`)
- Password
- Confirm Password

**"Sign Up" button click කරනකොට** Frontend (Next.js) code run වෙනවා:

```
✅ Confirm Password == Password?   → continue
✅ Email @uwu.ac.lk ද?            → continue
❌ Gmail/Yahoo?                    → Error! "University email use කරන්න"
```

After validation, **Backend PHP file ට** request යනවා:

```
Frontend (Next.js)  →  POST /api/backend/signup.php
                           {
                             fullName: "Nilesh Perera",
                             email: "iit23068@std.uwu.ac.lk",
                             password: "mypassword123"
                           }
```

---

### Backend — `backend/signup.php`

PHP file එකට data ආවාම **steps 5ක්** run වෙනවා:

#### Step 1: Email decode කරලා student details හොයාගන්නවා

Email: `iit23068@std.uwu.ac.lk` කියන්නේ:

```
iit  → Degree: IIT (Industrial Information Technology)
23   → Year: 2023
068  → Serial number: 068

එහෙනම්:
- Enrollment Number = UWU/IIT/23/068
- Batch             = 18th batch  (23 - 5 = 18)
- Role              = student
```

> 💡 **ස්මාර්ට් trick:** Email address ඇතුළෙම student ගේ degree, year, batch හැම දෙයක්ම
> encode කරලා තියෙනවා. PHP code ඒ decode කරගන්නවා automatically!

`@uwu.ac.lk` email ආවොත් (lecturer):
```
- Role = staff
- Enrollment = "staff"
```

#### Step 2: Email already registered ද check කරනවා

```sql
SELECT id FROM users WHERE email = 'iit23068@std.uwu.ac.lk'
```

ඒ email already ගිහිල්ලා නම් → **Error: "Email already registered"**

#### Step 3: Password Hashing (🔒 Security!)

ගොඩ websites Password plain text ව save කරනවා — ඒක **DANGEROUS**!

UWU-NEXUS ඒ වගේ කරන්නේ නෑ. Password **hash** කරලා save කරනවා:

```
Original Password:  "mypassword123"
                         ↓  PHP password_hash() function
Saved in Database:  "$2y$10$xyz...gibberish...abc"  (unreadable!)
```

```php
// backend/signup.php line 77
$hash = password_hash($password, PASSWORD_DEFAULT);
```

> 🔒 **ඇයි Hash කරන්නේ?**
> Database hack වුණොත්වත් passwords leak වෙන්නේ නෑ!
> Hash කරපු password **reverse කරන්නේ බෑ** — ඒක one-way transformation.

#### Step 4: Verification Token හදන්නවා

```php
// backend/signup.php line 78
$verification_token = bin2hex(random_bytes(32));
// Example: "a3f9b2c1d4e5..."  (random 64 character string)
```

Database ඇතුළේ user save කරනවා `is_verified = FALSE` සමඟ.

#### Step 5: Verification Email යවනවා

Email link:
```
https://uwunexus.tech/verify-email?token=a3f9b2c1d4e5...
```

> 📧 User ඔය link click කරනකොට account verify වෙනවා.
> Verify නොකර login වෙන්න **බෑ**.

---

## ✅ STEP 2: Email Verify කරන්නවා

User email ඇවිත් link click කරනවා:

```
https://uwunexus.tech/verify-email?token=a3f9b2c1d4e5...
```

`backend/verify_email.php` run වෙනවා:

```sql
UPDATE users SET is_verified = TRUE, verification_token = NULL
WHERE verification_token = 'a3f9b2c1d4e5...'
```

✅ Account activated!

---

## 🚪 STEP 3: Login කරන්නවා

### User Interface — `app/login/page.tsx`

User email + password දානවා. **"Login" button click කරනකොට:**

```
Frontend  →  POST /api/backend/login.php
               {
                 email: "iit23068@std.uwu.ac.lk",
                 password: "mypassword123"
               }
```

### Backend — `backend/login.php`

```php
// Step 1: Database ගෙන් user ගන්නවා
SELECT id, password_hash, role, is_verified FROM users WHERE email = ?

// Step 2: Password verify කරනවා (hash compare)
password_verify("mypassword123", "$2y$10$xyz...") → TRUE ✅

// Step 3: is_verified check කරනවා
if (!$user['is_verified']) → Error: "Please verify your email first"

// Step 4: Success! User data return කරනවා
{
  "success": true,
  "user": {
    "id": 7,
    "role": "student",
    "fullName": "Nilesh Perera"
  }
}
```

> 💡 `password_verify()` කියන PHP function, original password සමඟ
> database hash compare කරනවා. Hash reverse නොකර compare කරන්නේ!

---

## 🍪 STEP 4: Cookie System (Login State Save කරන්නවා)

Login success වුණාම Next.js **3 cookies** browser ඇතුළේ set කරනවා.

### Cookie කියන්නේ මොකක්ද?

> 🍪 **Cookie** කියන්නේ browser ඇතුළේ save කරන **small data piece** එකක්.
> Website ටික ටික open කරනකොට browser ඒ data recall කරනවා.
> Login state remember කරන්නේ cookies use කරලා.

**File: `app/actions/auth.ts`**

```typescript
// Login successful නම් මේ 3 cookies set වෙනවා:

uwu_auth    = "true"           // "logged in" state
uwu_role    = "student"        // user type (student/staff/superadmin)
uwu_user_id = "7"              // database user ID

// Expire time: 7 days (7 දිනකට valid)
maxAge: 60 * 60 * 24 * 7
```

Login වුණාම Home page redirect වෙනවා (`router.push("/")`).

### Logout කරනකොට:

```typescript
// app/actions/auth.ts
cookieStore.delete("uwu_auth");
cookieStore.delete("uwu_role");
cookieStore.delete("uwu_user_id");
// Cookies delete → User logged out
```

---

## 🛡️ STEP 5: Middleware — Protected Pages

Login නැතිව `/events`, `/tickets`, etc. visit කරන්න **හදුවන්නේ නෑ**. ඒකට use කරන්නේ **Middleware**.

**File: `proxy.ts`**

```typescript
// Every request ඒ page ට යන්න කලින් — middleware run වෙනවා

if (page starts with '/events' OR '/tickets' OR etc.) {
  
  if (uwu_auth cookie == "true") {
    // ✅ Logged in — page show කරනවා
    return allow;
  } else {
    // ❌ Not logged in — signup page ට redirect
    return redirect('/signup');
  }
}

if (page starts with '/admin') {
  if (role == 'superadmin' OR 'clubadmin') {
    // ✅ Admin — admin panel show
  } else {
    // ❌ Normal user — Home ට redirect
    return redirect('/');
  }
}
```

### Protected Pages List:

| Page | Protected? | Required Role |
|------|-----------|---------------|
| `/events` | ✅ Yes | Login (any) |
| `/tickets` | ✅ Yes | Login (any) |
| `/marketplace` | ✅ Yes | Login (any) |
| `/lost-and-found` | ✅ Yes | Login (any) |
| `/gpa-calculator` | ✅ Yes | Login (any) |
| `/info-hub` | ✅ Yes | Login (any) |
| `/admin` | ✅ Yes | superadmin / clubadmin only |
| `/login` | ❌ No | Public |
| `/signup` | ❌ No | Public |
| `/` (Home) | ❌ No | Public |

---

## 🗺️ Full Signup → Login → Access Flow (සම්පූර්ණ Flow)

```
1. User → Signup page fill කරනවා
        ↓
2. Frontend → backend/signup.php ට POST කරනවා
        ↓
3. PHP:
   - Email decode (degree, batch, role)
   - Password hash
   - Verification token හදනවා
   - Database ට INSERT කරනවා (is_verified=FALSE)
   - Email යවනවා verification link සමඟ
        ↓
4. User → Email link click කරනවා
        ↓
5. PHP → is_verified = TRUE update කරනවා
        ↓
6. User → Login page fill කරනවා
        ↓
7. Frontend → backend/login.php ට POST කරනවා
        ↓
8. PHP:
   - Database ගෙන් user ගන්නවා
   - password_verify() check
   - is_verified check
   - User data return කරනවා
        ↓
9. Frontend → cookies set කරනවා
   (uwu_auth, uwu_role, uwu_user_id)
        ↓
10. User → Home page! Logged in ✅
        ↓
11. User → /events visit කරනවා
        ↓
12. Middleware → uwu_auth cookie check කරනවා → Allow ✅
        ↓
13. Events page show වෙනවා 🎉
```

---

## 📁 Relevant Files Summary

| File | Location | කරන දේ |
|------|----------|---------|
| `signup/page.tsx` | `app/signup/` | Signup UI — form show, validation |
| `login/page.tsx` | `app/login/` | Login UI — form show, fetch call |
| `signup.php` | `backend/` | Account create, email send |
| `login.php` | `backend/` | Credentials verify, user return |
| `verify_email.php` | `backend/` | Email token verify |
| `auth.ts` | `app/actions/` | Cookies set/delete |
| `proxy.ts` | root | Middleware — page protection |

---

## 📌 Part 2 Summary — ඔයා ඉගෙනගත්ත දේ

- ✅ **Signup**: Email decode → Password hash → Token create → DB save → Email send
- ✅ **Email Verify**: Token check → `is_verified = TRUE`
- ✅ **Login**: DB lookup → `password_verify()` → Cookie set
- ✅ **Password Hashing**: Plain text save කරන්නේ නෑ — one-way hash
- ✅ **Cookies**: `uwu_auth`, `uwu_role`, `uwu_user_id` — 7 days valid
- ✅ **Middleware**: Protected pages — login නැතිව access කරන්නේ **බෑ**

---

## ➡️ ඊළඟ Part (Part 3) ගැන Preview

**Part 3: Database & PHP Backend — Data කොහොමද Save/Load කරන්නේ?**

- MySQL database structure (tables)
- `db.php` — connection හදන හැටි
- PHP files ට requests යන හැටි (API calls)
- Database queries (SELECT, INSERT, UPDATE, DELETE)

---

*📝 UWU-NEXUS Project Guide | Part 2 of 10*
