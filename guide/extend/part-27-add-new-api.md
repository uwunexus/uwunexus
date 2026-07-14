# Part 27: ප්‍රායෝගික වැඩ - අලුත් API එකක් හදමු (Backend)

කලින් පාඩමෙන් අපි Frontend එකේ අලුත් "රුධිර දායකයින්ගේ ලැයිස්තුව" පිටුවක් හැදුවා. හැබැයි ඒකේ තියෙන්නේ අපි අතින් ටයිප් කරපු බොරු දත්ත (Hardcoded data). ඇත්තටම දත්ත එන්න ඕනේ Database එකෙන්. 

ඒකට මුලින්ම Database එකේ අලුත් Table එකකුත්, ඒ දත්ත ටික එළියට අරන් දෙන අලුත් PHP ෆයිල් එකකුත් අපි හදන්න ඕනේ. (ඒ PHP ෆයිල් එකට තමයි අපි API එකක් කියලා කියන්නේ).

---

## 1. Database එකේ අලුත් Table එකක් හදමු

මුලින්ම අපේ `uwunexus` Database එක ඇතුළේ ලේ දෙන අයගේ විස්තර දාන්න අලුත් Table එකක් හදන්න ඕනේ. ඔයාට පුළුවන් PHPMyAdmin එකට ගිහින් හරි, MySQL කමාන්ඩ් එකක් ගහලා හරි මේක හදන්න:

```sql
CREATE TABLE blood_donors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    blood_group VARCHAR(10) NOT NULL,
    phone VARCHAR(20) NOT NULL
);

-- පරීක්ෂා කරලා බලන්න දත්ත දෙක තුනකුත් ඇතුළත් කරමු (INSERT)
INSERT INTO blood_donors (name, blood_group, phone) VALUES 
('Nilesh Jayanandana', 'O+', '077-1234567'),
('Kamal Perera', 'A-', '071-9876543');
```

දැන් අපේ සේප්පුව (Database) ඇතුළේ දත්ත ටික තියෙනවා.

## 2. අලුත් PHP ෆයිල් එකක් හදමු (`backend/get_blood_donors.php`)

දැන් අපි යන්නේ මේ දත්ත ටික අරන් Frontend එකට දෙන ලියුම්කාරයා (API එක) හදන්නයි. 
ඔයාගේ `backend/` ෆෝල්ඩරයට ගිහින් **`get_blood_donors.php`** කියලා අලුත් ෆයිල් එකක් හදන්න.

ඒක ඇතුළේ මෙන්න මේ කෝඩ් එක ලියන්න:

```php
<?php
// 1. පාලම (Database Connection) ඇතුළත් කරගන්නවා
require 'db.php';

try {
    // 2. අර අපි හැදුව අලුත් Table එකෙන් දත්ත ඉල්ලනවා (SELECT)
    // "රුධිර ගණය (blood_group) අනුව පිළිවෙළට (ORDER BY) අරන් එන්න"
    $stmt = $pdo->query("SELECT * FROM blood_donors ORDER BY blood_group ASC");
    
    // 3. ආපු දත්ත ඔක්කොම $donors කියන පෙට්ටියට දාගන්නවා
    $donors = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 4. ඒ දත්ත ටික Frontend එකට තේරෙන JSON භාෂාවට හරවලා යවනවා
    echo json_encode(["success" => true, "donors" => $donors]);

} catch (\PDOException $e) {
    // වැරදීමක් වුණොත් Error එකක් යවනවා
    echo json_encode(["success" => false, "message" => "Database error"]);
}
?>
```

## 3. මේක වැඩද කියලා බලන්නේ කොහොමද?

මේක පරීක්ෂා කරලා බලන්න අපිට තවම Frontend එක ඕනේ නැහැ. ඔයාට කෙලින්ම බ්‍රව්සර් එක ඕපන් කරලා මෙන්න මේ ලින්ක් එකට යන්න පුළුවන්:
**`http://localhost/backend/get_blood_donors.php`** 
*(ඔයාගේ Port එක 8000 නම් ඒක වෙනස් කරගන්න)*

ඒකට ගියාම ඔයාට බ්‍රව්සර් එකේ මෙන්න මේ වගේ අමුතු විදිහට අකුරු ටිකක් පෙනෙයි:

```json
{
  "success": true,
  "donors": [
    { "id": 2, "name": "Kamal Perera", "blood_group": "A-", "phone": "071-9876543" },
    { "id": 1, "name": "Nilesh Jayanandana", "blood_group": "O+", "phone": "077-1234567" }
  ]
}
```
මේ තියෙන්නේ **JSON**! 
දැන් අපේ Backend API එක 100% ක් වැඩ. එයා දත්ත ටික ලස්සනට පැකට් කරලා ලෑස්ති කරන් ඉන්නවා.

> **සාරාංශය:**
> * අලුත් Feature එකකට අදාළ දත්ත තියාගන්න මුලින්ම **අලුත් Table එකක්** හදන්න ඕනේ.
> * ඊටපස්සේ Backend එකේ අලුතින් **`.php` ෆයිල් එකක් (API Endpoint එකක්)** හදන්න ඕනේ.
> * ඒක ඇතුළේ `db.php` දාලා, `SELECT` කමාන්ඩ් එකෙන් දත්ත අරන්, `json_encode()` කරලා එළියට යවනවා.

දැන් Frontend එකේ Page එකත් හරි, Backend එකේ API එකත් හරි. ඊළඟ පාඩමෙන් අපි බලමු **මේ අලුත් Frontend එකයි, අලුත් Backend එකයි එකිනෙකට සම්බන්ධ කරලා (Connect කරලා) ඇත්ත දත්ත තිරයේ පෙන්වන්නේ කොහොමද** කියලා.
