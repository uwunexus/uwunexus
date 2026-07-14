# Part 28: ප්‍රායෝගික වැඩ - Frontend එක සහ Backend එක සම්බන්ධ කිරීම

අපි දැන් අලුත් Page එකක් (Frontend) හැදුවා. ඒ වගේම දත්ත ගේන්න අලුත් API එකකුත් (Backend) හැදුවා. හැබැයි මේ දෙන්නා තාම යාලුවෝ වෙලා නැහැ (Connect කරලා නැහැ). 

මේ පාඩමෙන් අපි බලන්නේ අපි අර Part 26 දී ලියපු අලුත් Frontend පිටුවේ කෝඩ් එක (Hardcoded දත්ත තියෙන එක) වෙනස් කරලා, ඇත්තටම Backend එකෙන් දත්ත ගෙන්නගන්න විදිහට හදාගන්නේ කොහොමද කියලයි.

---

## 1. මතක තබාගැනීම සහ ඉබේ ලෝඩ් වීම

Frontend එකට Database එකේ දේවල් ගේනවා කිව්ව ගමන් ඔයාගේ ඔලුවට එන්න ඕනේ දේවල් දෙකක් තියෙනවා:
1. **`useState`** - අරන් එන දත්ත ටික මතක තියාගන්න.
2. **`useEffect`** - පිටුව තිරයට ආපු ගමන්ම (ඉබේම) කෝල් එක ගන්න.

අපි දැන් අර කලින් ලියපු `app/blood-donors/page.tsx` ෆයිල් එක මේ දේවල් දෙකත් දාලා අලුත් කරමු (Update කරමු).

```tsx
"use client"; // Next.js වල Hooks පාවිච්චි කරන නිසා මේක අනිවාර්යයි!
import { useState, useEffect } from "react";

export default function BloodDonorsPage() {
    
    // 1. දත්ත මතක තියාගන්න පෙට්ටිය (මුලින්ම හිස්)
    const [donors, setDonors] = useState([]);
    // 2. ලෝඩ් වෙනවද කියලා බලාගන්න තව පෙට්ටියක්
    const [loading, setLoading] = useState(true);

    // 3. පිටුව ආපු ගමන් දත්ත ගේන්න
    useEffect(() => {
        // අර අපි අලුතින් හදපු PHP API එකට කතා කරනවා!
        fetch("http://localhost/backend/get_blood_donors.php")
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setDonors(data.donors); // දත්ත ටික පෙට්ටියට දානවා
                }
                setLoading(false); // දැන් ලෝඩ් වෙලා ඉවරයි
            });
    }, []);

    // ... ඉතුරු කෝඩ් ටික පහතින් ...
```

## 2. දත්ත ටික තිරයේ ඇඳීම (The Map Function)

දැන් අර `$donors` පෙට්ටිය ඇතුළේ ලේ දෙන අයගේ විස්තර ගොඩක් තියෙනවා (Array එකක් විදිහට). අපි මේ විස්තර එකින් එක අරන් අඳින්න ඕනේ. ඒකට අපි කලින් ඉගෙන ගත්ත **`map()`** ක්‍රමය පාවිච්චි කරනවා.

අපේ අර ෆයිල් එකේ යට කොටස මේ විදිහට වෙනස් කරමු:

```tsx
    // ... කලින් කෝඩ් එකේ ඉතුරු ටික ...

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-red-600 mb-4">
                රුධිර දායකයින්ගේ ලැයිස්තුව
            </h1>
            
            {loading ? (
                <p>කරුණාකර රැඳී සිටින්න, දත්ත පැමිණෙමින් පවතී...</p>
            ) : (
                <div className="grid grid-cols-3 gap-4 mt-6">
                    {/* පෙට්ටියේ තියෙන එකින් එක අරගෙන කාඩ් හදනවා */}
                    {donors.map((donor) => (
                        <div key={donor.id} className="bg-white p-4 rounded shadow">
                            <h2 className="text-xl font-bold">{donor.name}</h2>
                            <p className="text-red-500 font-bold text-lg mt-2">
                                ගණය: {donor.blood_group}
                            </p>
                            <p className="text-gray-600 mt-1">
                                දුරකථනය: {donor.phone}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
```

## 3. අවසාන ප්‍රතිඵලය!

දැන් ඔයා බ්‍රව්සර් එකේ Page එක රීෆ්‍රෙෂ් කළොත්, ඔයාට පේනවා ඇති අර අපි PHPMyAdmin එකෙන් Database එකට දාපු ඇත්තම දත්ත ටික (නිලේෂ්, කමල්) ලස්සන කාඩ් (Cards) විදිහට තිරයේ පෙන්වනවා!

> **සාරාංශය:**
> Frontend එකයි Backend එකයි සම්බන්ධ කරන්නේ (Connect කරන්නේ) මෙන්න මේ පියවර 4න්:
> 1. Frontend එකේ `useState` සහ `useEffect` දාගන්නවා.
> 2. `fetch("http://localhost/backend/...php")` හරහා අපේ අලුත් API එකට කතා කරනවා.
> 3. එතනින් එන JSON දත්ත ටික අරන් `useState` පෙට්ටියට දාගන්නවා.
> 4. JSX (HTML) කෝඩ් එක ඇතුළේ `map()` පාවිච්චි කරලා ඒ දත්ත ටිකෙන් ලස්සන UI එකක් අඳිනවා.

සුබ පැතුම්! ඔයා දැන් තනියම Full-Stack Feature එකක් (Frontend ඉඳන් Database එකටම) හදන්න දන්නවා.

අපේ මාර්ගෝපදේශයේ අන්තිම Module එක වෙන **Module 8** වෙත යමු. එතනදී අපි කතා කරන්නේ කෝඩ් කරද්දී එන දෝෂ (Bugs) හොයාගන්නේ සහ නිවැරදි කරන්නේ කොහොමද කියලයි.
