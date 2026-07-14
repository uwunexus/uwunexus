# Part 18: Feature 03 - උත්සව (Events) බැලීම

ළමයෙක් ගිණුමට ලොග් වෙලා ඉවෙන්ට්ස් තියෙන Page එකට (`/events`) ගියාම, කැම්පස් එකේ තියෙන්න යන අලුත්ම ඉවෙන්ට්ස් ටික එයාට පේනවා. මේක වෙන්නේ කොහොමද කියලා අපි දැන් බලමු. 

මේක තමයි Database එකෙන් දත්ත "කියවන" (Read) ප්‍රධානම අවස්ථාව. මේකටත් ප්‍රධාන ෆයිල් දෙකක් සම්බන්ධ වෙනවා:
1. **Backend එකේ:** `backend/get_events.php` (Database එකෙන් ඉවෙන්ට් ටික ගේන එකා)
2. **Frontend එකේ:** `app/events/page.tsx` (ඒ ගෙනාපු ටික ලස්සනට පෙන්වන එකා)

---

## 1. Backend එක (`backend/get_events.php`)

Frontend එකෙන් ඇවිත් "මට ඉවෙන්ට්ස් ටික ඔක්කොම දෙන්න" කියලා ඇහුවම, මේ PHP ෆයිල් එක තමයි Database එකට ගිහින් ඒ ටික අරන් එන්නේ.

**මෙන්න කෝඩ් එකේ වැදගත්ම කොටස:**

```php
<?php
require 'db.php';

try {
    // 1. Database එකෙන් දත්ත ඉල්ලනවා (SELECT)
    // ORDER BY event_date DESC කියන්නේ "අලුත්ම ඒවා (දිනය අලුත් ඒවා) උඩින්ම තියන්න" කියන එකයි
    $stmt = $pdo->query("SELECT * FROM events ORDER BY event_date DESC");
    
    // 2. අරන් ආපු දත්ත ටික ඔක්කොම $events කියන Array එකකට (ලොකු පෙට්ටියකට) දාගන්නවා
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. ඒ දත්ත ටික Frontend එකට තේරෙන JSON භාෂාවට හරවලා යවනවා
    echo json_encode(["success" => true, "events" => $events]);

} catch (\PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database error"]);
}
?>
```

මෙතනදී අමුතුවෙන් Frontend එකෙන් දත්ත (උදා: ඊමේල්, පාස්වර්ඩ්) එනකන් බලාගෙන ඉන්නේ නැහැ. කවුරු කතා කළත් මේකෙන් කරන්නේ Database එකේ තියෙන ඔක්කොම ඉවෙන්ට්ස් ටික අරන් දෙන එකයි.

## 2. Frontend එක (`app/events/page.tsx`)

මේක තමයි ඔයාගේ ඇහැට පේන පිටුව. මේ Page එක ලෝඩ් වුණ ගමන්ම, තත්පරයක්වත් පරක්කු නොවී අර `get_events.php` එකට කෝල් එකක් අරන් අර ඉවෙන්ට්ස් ටික ගෙන්න ගන්න ඕනේ. ඒකට අපි පාවිච්චි කරන්නේ කලින් ඉගෙන ගත්ත **`useEffect`** කියන Hook එකයි.

**මෙන්න කෝඩ් එකේ වැදගත්ම කොටස:**

```tsx
import { useState, useEffect } from "react";

export default function EventsPage() {
    
    // 1. ඉවෙන්ට්ස් ටික මතක තියාගන්න පෙට්ටියක් (මුලින්ම මේක හිස් - [])
    const [events, setEvents] = useState([]);

    // 2. Page එක තිරයට ආපු ගමන් මේක ඉබේම වැඩ කරනවා
    useEffect(() => {
        fetch("http://localhost/backend/get_events.php")
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Backend එකෙන් ආපු ඉවෙන්ට් ටික පෙට්ටියට දානවා
                    setEvents(data.events); 
                }
            });
    }, []); // මේ හිස් කොටු වරහන් නිසා මේක වැඩ කරන්නේ එකම එක පාරයි

    // 3. පෙට්ටියේ තියෙන දත්ත ටික තිරයේ පෙන්වනවා
    return (
        <div>
            <h1>Upcoming Events</h1>
            
            {/* 4. map() පාවිච්චි කරලා ලොකු පෙට්ටියේ තියෙන එකින් එක අරන් අඳිනවා */}
            <div className="grid grid-cols-3 gap-4">
                {events.map((event) => (
                    <div key={event.id} className="bg-white p-4 rounded-lg shadow">
                        <img src={event.image_url} alt={event.title} />
                        <h2>{event.title}</h2>
                        <p>{event.event_date}</p>
                        <p>{event.location}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
```

**`map()` කියන්නේ මොකක්ද?**
`events` කියන ලොකු පෙට්ටියේ ඉවෙන්ට් 10ක් තිබුණොත්, අපිට `div` 10ක් වෙන වෙනම ලියන්න ඕනේ නැහැ. `map()` එකෙන් කරන්නේ අර ලොකු පෙට්ටිය ඇතුළට අත දාලා, එකින් එක ඉවෙන්ට් එක එළියට අරන්, අපි ලියලා තියෙන ඩිසයින් එකට (`div` එකට) දත්ත දාලා තිරයේ අඳින එකයි (Loop එකක් වගේ).

> **සාරාංශය:**
> * Backend එකේදී `SELECT * FROM events` පාවිච්චි කරලා ඉවෙන්ට් ඔක්කොම අරන් යවනවා.
> * Frontend එකේදී `useEffect` පාවිච්චි කරලා පිටුව ලෝඩ් වෙද්දීම ඒ දත්ත ගෙන්නගන්නවා.
> * ගෙන්නගත්ත දත්ත `useState` පෙට්ටියේ දාගෙන, `map()` පාවිච්චි කරලා තිරයේ ලස්සනට අඳිනවා.

මේ විදිහට තමයි Marketplace එකේ බඩු පෙන්වන්නෙත්, ලකුණු (GPA) පෙන්වන්නෙත්. මේක (Fetch + useState + map) තමයි React වල වැඩියෙන්ම පාවිච්චි වෙන රටාව!

ඊළඟ පාඩමෙන් අපි බලමු **අලුතින් ඉවෙන්ට් එකක් හදන්නේ (Create Event) කොහොමද** කියලා. (එතනදී පින්තූරයක් (Image) Upload කරන හැටිත් අපි ඉගෙන ගන්නවා!).
