# Part 25: Feature 10 - ඇඩ්මින් පැනලය (Admin Panel)

වෙබ්සයිට් එකක සමහර දේවල් සාමාන්‍ය ළමයින්ට පේන්න හොඳ නැහැ. උදාහරණයක් විදිහට, ළමයෙක් අලුත් ඉවෙන්ට් එකක් දැම්ම ගමන් ඒක හැමෝටම පෙන්නුවොත්, සමහරවිට ඒක වැරදි විස්තර තියෙන ඉවෙන්ට් එකක් වෙන්න පුළුවන්. ඒ නිසා ඒක මුලින්ම යන්නේ **Admin (පරිපාලක)** කෙනෙක් ගාවට.

ඇඩ්මින් කෙනෙක් ඒ ඉවෙන්ට් එක බලලා **Approve (අනුමත)** කළොත් විතරයි ඒක අනිත් අයට පේන්නේ. අපි බලමු මේක අපේ Project එකේ කොහොමද වැඩ කරන්නේ කියලා.

---

## 1. ළමයා සාමාන්‍ය කෙනෙක්ද? ඇඩ්මින්ද? (Role Checking)

ළමයෙක් ලොග් වෙද්දී (Part 17 දී) අර `localStorage` එකේ අපි සේව් කළා නේද එයාගේ `role` එක? (උදා: `user` ද, නැත්නම් `admin` ද කියලා). අන්න ඒකෙන් තමයි අපි තීරණය කරන්නේ මෙයාට Admin Panel එක පෙන්වනවද නැද්ද කියලා.

```tsx
// Frontend එකේ කොහේ හරි
const user = JSON.parse(localStorage.getItem("user"));

// මෙයා ඇඩ්මින් කෙනෙක් නම් විතරක් මේ බොත්තම පෙන්වන්න
{user.role === 'admin' && (
    <button>Admin Panel එකට යන්න</button>
)}
```

## 2. Frontend එක (`app/admin/events/page.tsx`)

Admin Panel එකේ ඉවෙන්ට් එකක් යටින් බොත්තම් දෙකක් තියෙනවා (Approve සහ Reject කියලා). ඇඩ්මින් කෙනෙක් Approve බොත්තම එබුවම වෙන්නේ මේකයි:

```tsx
// 1. ඉවෙන්ට් එකේ අංකයයි, කරන්න ඕනේ දේයි (approve/reject) Backend එකට යවනවා
const handleApprove = async (eventId) => {
    
    const response = await fetch("http://localhost/backend/admin_update_event.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // පැකට් එක: අංක 5 ඉවෙන්ට් එක approve කරන්න!
        body: JSON.stringify({ id: eventId, action: "approve" }) 
    });

    const result = await response.json();
    if (result.success) {
        alert("ඉවෙන්ට් එක අනුමත කළා!");
    }
};
```

## 3. Backend එක (`backend/admin_update_event.php`)

Frontend එකෙන් අර පැකට් එක ආවම, මේකෙදි අලුතින් පේළියක් ලියන්නේ නෑ (Insert නෙවෙයි). මේකෙදි කරන්නේ තියෙන පේළියක් **වෙනස් කරන එකයි (`UPDATE`)**. 

අපි කලින් (Part 11 දී) කතා කළා `events` Table එකේ `status` කියලා Column එකක් තියෙනවා කියලා. ඒකේ මුලින්ම තියෙන්නේ `pending` (බලාපොරොත්තුවෙන් සිටී) කියලයි. අපි කරන්නේ ඒක `approved` (අනුමතයි) කියලා වෙනස් කරන එකයි.

**මෙන්න කෝඩ් එකේ වැදගත්ම කොටස:**

```php
<?php
require 'db.php';
$data = json_decode(file_get_contents("php://input"));

$event_id = $data->id;
$action = $data->action; // මේක 'approve' හෝ 'reject' වෙන්න පුළුවන්

// 1. ආපු වචනේ අනුව අපි Database එකට දාන්න ඕනේ වචනේ තීරණය කරනවා
$new_status = "";
if ($action === "approve") {
    $new_status = "approved";
} else if ($action === "reject") {
    $new_status = "rejected";
}

try {
    // 2. Database එකේ දත්ත වෙනස් කිරීම (UPDATE)
    // "අදාළ අංකය තියෙන ඉවෙන්ට් එකේ status එක වෙනස් කරන්න"
    $stmt = $pdo->prepare("UPDATE events SET status = ? WHERE id = ?");
    
    // 3. අර ? ලකුණු දෙකට දත්ත දාලා Execute කරනවා
    $stmt->execute([$new_status, $event_id]);
    
    echo json_encode(["success" => true]);

} catch (\PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database error"]);
}
?>
```

> **සාරාංශය:**
> * ඇඩ්මින් කෙනෙක්ද කියලා අඳුරගන්නේ අපි `users` table එකේ දාලා තියෙන **`uwu_role`** එක පාවිච්චි කරලයි.
> * Admin Panel එකේදී අලුත් දේවල් හැදෙනවට වඩා ගොඩක් වෙලාවට වෙන්නේ, දැනට තියෙන දේවල් වල තත්ත්වය (Status) වෙනස් වෙන එකයි.
> * ඒක කරන්නේ SQL වල තියෙන **`UPDATE`** කියන කමාන්ඩ් එක පාවිච්චි කරලයි.

මෙතැනින් අපේ Project එකේ තියෙන ප්‍රධාන Features ඔක්කොම වගේ ආවරණය වෙනවා. (Module 6 සම්පූර්ණයි). 

ඊළඟ Module එකෙන් (Module 7) අපි බලන්නේ **මේ Project එකට අලුතින්ම යමක් එකතු කරන්නේ (Extend කරන්නේ) කොහොමද** කියලයි. (උදාහරණයක් විදිහට අලුත් Page එකක් හදන විදිහ).

විසිහයවෙනි පාඩම ආරම්භ කරන්න සූදානම් නම් **"Next"** කියලා මට කියන්න!
