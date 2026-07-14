# Part 22: Feature 07 - Lost & Found (සහ Search කිරීම)

කැම්පස් එකේ ළමයින්ගේ අයිඩෙන්ටි, පෑන්, පොත් නැතිවුණාම ඒවා හොයාගන්න තමයි අපේ Project එකේ **Lost and Found** අංශය තියෙන්නේ. මෙතනදී අලුත් Item එකක් දාන එක (Create) හරියටම අපි අර ඉවෙන්ට්ස් දානවා වගේමයි (වචන ටිකයි පින්තූරයයි යවනවා). 

ඒ නිසා අපි මේ පාඩමෙන් අලුත් දෙයක් ඉගෙන ගමු. ඒ තමයි **අපිට ඕනේ කරන දෙයක් මේක ඇතුළෙන් හොයන්නේ (Search කරන්නේ) කොහොමද** කියන එක.

---

## 1. Frontend එක (`app/lost-and-found/page.tsx`)

අපේ Lost & Found පිටුවට ගියාම උඩින්ම තියෙනවා Search Bar එකක් (ටයිප් කරන්න පුළුවන් තැනක්). අපි බලමු ඒක වැඩ කරන්නේ කොහොමද කියලා.

```tsx
// 1. ටයිප් කරන වචනය මතක තියාගන්න පෙට්ටියක්
const [searchQuery, setSearchQuery] = useState("");
const [items, setItems] = useState([]);

// 2. අකුරක් ගහන ගහන සැරේට මේක වැඩ කරලා පෙට්ටියට අකුර දානවා
const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
};

// 3. Search බොත්තම එබුවම Backend එකට කතා කරනවා
const searchItems = async () => {
    // විශේෂයි: අපි වචනය යවන්නේ URL එකේ අගට අමුණලයි (?search=වචනය)
    const response = await fetch(`http://localhost/backend/get_lost_found.php?search=${searchQuery}`);
    const data = await response.json();
    
    // ආපු දත්ත ටික තිරයේ පෙන්වන්න පෙට්ටියට දාගන්නවා
    setItems(data.items);
};
```

ඔයා මෙතනදී දැක්කා නේද අලුත් දෙයක්? කලින් අපි දත්ත යැව්වේ `method: "POST"` දාලා `body` එක ඇතුළේ (JSON විදිහට). හැබැයි මෙතනදී අපි යවන්නේ **URL එකේ අගටම `?search=...` කියලා දාලයි**. 
මෙහෙම URL එකේ අගට දාලා දත්ත යවන ක්‍රමයට කියන්නේ **`GET Request`** එකක් කියලා. (සාමාන්‍යයෙන් යමක් හොයන්න පාවිච්චි කරන්නේ මේ ක්‍රමයයි).

## 2. Backend එක (`backend/get_lost_found.php`)

Frontend එකෙන් `?search=pen` කියලා එව්වොත්, ඒක අල්ලගන්න PHP වල වෙනම පෙට්ටියක් තියෙනවා. කලින් අපි පාවිච්චි කළේ `$_POST` පෙට්ටිය. හැබැයි URL එකෙන් එන දේවල් එන්නේ **`$_GET`** කියන පෙට්ටියට.

මෙන්න මේ Search කරන කෝඩ් එකේ වැදගත්ම කොටස:

```php
<?php
require 'db.php';

// 1. URL එකෙන් එන වචනය $_GET එකෙන් අල්ලගන්නවා
// (වචනයක් එවලා නැත්නම් හිස්ව තියාගන්නවා)
$search = isset($_GET['search']) ? $_GET['search'] : '';

try {
    if ($search !== '') {
        
        // 2. වචනයක් එවලා තියෙනවා නම් (Search කරනවා නම්)
        // LIKE %...% කියන්නේ "මේ වචනය කොහේ හරි ගෑවිලා තියෙන දේවල් ගේන්න" කියන එකයි
        
        $stmt = $pdo->prepare("SELECT * FROM lost_found_items WHERE title LIKE ?");
        
        // අර වචනේ දෙපැත්තට % ලකුණු දෙකක් එකතු කරනවා
        $searchTerm = '%' . $search . '%'; 
        
        $stmt->execute([$searchTerm]);
        
    } else {
        // 3. වචනයක් එවලා නැත්නම් ඔක්කොම ටික අරන් එනවා
        $stmt = $pdo->query("SELECT * FROM lost_found_items ORDER BY created_at DESC");
    }

    $items = $stmt->fetchAll();
    echo json_encode(["success" => true, "items" => $items]);

} catch (\PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database error"]);
}
?>
```

**මොකක්ද මේ `LIKE` සහ `%` (ප්‍රතිශත ලකුණ)?**
* ඔයා Database එකෙන් `WHERE title = 'pen'` කියලා ඉල්ලුවොත්, ඒකෙන් හොයන්නේ හරියටම "pen" කියලා විතරක් තියෙන ඒවා. 
* හැබැයි කාගේ හරි නැතිවුණු පෑනේ නම "Blue Color Pen" කියලා තිබුණොත්, අර කමාන්ඩ් එකට ඒක අහුවෙන්නේ නෑ.
* අන්න ඒ නිසා අපි පාවිච්චි කරනවා `WHERE title LIKE '%pen%'` කියලා. මේකෙ තේරුම තමයි **"මුලින් මොනවා තිබුණත්, අගින් මොනවා තිබුණත් මට කමක් නෑ, මැද කොහේ හරි pen කියන කෑල්ල ගෑවිලා තියෙනවා නම් ඒ ඔක්කොම ගේන්න"** කියන එක.

> **සාරාංශය:**
> * යමක් හොයන්න (Search කරන්න) දත්ත යවද්දී ගොඩක් වෙලාවට ඒක යවන්නේ URL එකේ අගට අමුණලා (**`GET Request`** විදිහටයි).
> * PHP වලින් ඒක අල්ලගන්නේ **`$_GET`** එකෙන්.
> * Database එකේ හරියටම සමාන නැති, හැබැයි "ගෑවිලා තියෙන" වචන හොයන්න පාවිච්චි කරන්නේ SQL වල තියෙන **`LIKE '%...%'`** කමාන්ඩ් එකයි.

දැන් ඔයා දන්නවා ඕනෙම වෙබ්සයිට් එකක තියෙන Search Bar එකක් පිටුපස දුවන තාක්ෂණය කොහොමද වැඩ කරන්නේ කියලා!

ඊළඟ පාඩමෙන් අපි බලමු අපේ Project එකේ තියෙන ගොඩක් ළමයි ආස කරන Feature එකක් වෙන **GPA Calculator (ලකුණු ගණනය කිරීමේ) කොටස** කොහොමද වැඩ කරන්නේ කියලා.
