# Part 20: Feature 05 - ටිකට් බුක් කිරීම (Tickets Booking)

අපේ Project එකේ ඉවෙන්ට් එකක් දැක්කම ළමයින්ට පුළුවන් ඒකට සහභාගී වෙන්න (Book Ticket / Join) කියලා බොත්තමක් ඔබන්න. මේකෙදි අලුත් ඉවෙන්ට් එකක් හැදෙනවා වත්, අලුත් ළමයෙක් හැදෙනවා වත් නෙවෙයි. මේකෙදි වෙන්නේ **තියෙන ඉවෙන්ට් එකයි, තියෙන ළමයයි අතර අලුත් "සම්බන්ධයක් (Relationship) හැදෙන එකයි."**

මේ සම්බන්ධය සේව් කරගන්න අපේ Database එකේ වෙනම Table එකක් තියෙනවා **`event_attendees`** (නැත්නම් `tickets`) කියලා.

---

## 1. Database එකේ හැඩය (The Junction Table)

මේ `event_attendees` Table එකේ හැඩය හරිම සරලයි. ඒකෙ තියෙන්නේ ප්‍රධාන වශයෙන් අංක (Foreign Keys) දෙකක් විතරයි.

* **`id`:** මේ බුකිං එකේ අංකය.
* **`event_id`:** බුක් කරපු ඉවෙන්ට් එකේ අංකය (උදා: Acoustica එකේ id එක - 5).
* **`user_id`:** බුක් කරපු ළමයාගේ අංකය (උදා: නිලේෂ්ගේ id එක - 2).

මේ විදිහට අංක විතරක් පාවිච්චි කරලා ලොකු Tables දෙකක් (`events` සහ `users`) සම්බන්ධ කරන පොඩි Table එකකට Database භාෂාවෙන් කියන්නේ **Junction Table** එකක් කියලා.

## 2. Frontend එක (`app/events/[id]/page.tsx`)

ළමයා "Join Event" කියන බොත්තම එබුවම, අපි අර අංක දෙක (ඉවෙන්ට් එකේ අංකයයි, ළමයාගේ අංකයයි) Backend එකට යවනවා.

```tsx
const handleJoinEvent = async () => {
    // 1. ළමයාගේ විස්තර localStorage එකෙන් ගන්නවා
    const user = JSON.parse(localStorage.getItem("user"));
    
    // 2. අංක දෙක පැකට් එකකට දානවා (eventId එක URL එකෙන් එනවා)
    const dataToSend = {
        event_id: eventId,
        user_id: user.id
    };

    // 3. Backend එකට යවනවා
    const response = await fetch("http://localhost/backend/join_event.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend)
    });

    const result = await response.json();
    if (result.success) {
        alert("ඔබ සාර්ථකව උත්සවයට එකතු විය!");
    }
};
```

## 3. Backend එක (`backend/join_event.php`)

මෙතනදී කෙලින්ම Database එකට දත්ත ඇතුළත් කරන්නේ නැහැ. **පළවෙනි පියවර විදිහට මේ ළමයා කලින් මේ ඉවෙන්ට් එකට ටිකට් එකක් අරන්ද කියලා චෙක් කරන්න ඕනේ.** නැත්නම් එකම ළමයා එකම ඉවෙන්ට් එකට 10 පාරක් බුක් කරයි.

```php
<?php
require 'db.php';
$data = json_decode(file_get_contents("php://input"));

$event_id = $data->event_id;
$user_id = $data->user_id;

try {
    // 1. කලින් බුක් කරලා තියෙනවද කියලා බලනවා (SELECT)
    $check_stmt = $pdo->prepare("SELECT id FROM event_attendees WHERE event_id = ? AND user_id = ?");
    $check_stmt->execute([$event_id, $user_id]);
    
    if ($check_stmt->fetch()) {
        // 2. ඔව්! කලින් බුක් කරලා තියෙනවා. එහෙනම් Error එකක් යවනවා.
        echo json_encode(["success" => false, "message" => "ඔබ දැනටමත් මේ උත්සවයට එකතු වී ඇත."]);
        exit(); // මෙතනින් කෝඩ් එක නවත්තනවා (පහළට යන්නේ නෑ)
    }

    // 3. කලින් බුක් කරලා නැත්නම්, අලුතින් පේළියක් එකතු කරනවා (INSERT)
    $stmt = $pdo->prepare("INSERT INTO event_attendees (event_id, user_id) VALUES (?, ?)");
    $stmt->execute([$event_id, $user_id]);
    
    echo json_encode(["success" => true, "message" => "Successfully joined the event"]);

} catch (\PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database error"]);
}
?>
```

> **සාරාංශය:**
> * ටිකට් බුක් කරද්දී අලුතින් විස්තර ලියවෙන්නේ නැහැ. වෙන්නේ තියෙන ඉවෙන්ට් එකයි තියෙන ළමයයි **අංක (IDs) හරහා Junction Table එකකින් එකට ගැටගැහෙන එකයි**.
> * Backend එකේදී මුලින්ම **`SELECT`** එකක් ගහලා ළමයා කලින් බුක් කරලද කියලා චෙක් කරනවා. (Double Booking නැවැත්වීම).
> * ඊටපස්සේ තමයි **`INSERT`** එකක් ගහලා අලුත් බුකිං එක සේව් කරන්නේ.

දැන් ඔයා දන්නවා එකිනෙකට වෙනස් Tables දෙකක් මැදින් සම්බන්ධයක් හදන්නේ (Relationship එකක් ගොඩනගන්නේ) කොහොමද කියලා.

ඊළඟ පාඩමෙන් අපි බලමු අපේ Project එකේ තියෙන ලොකුම Feature එකක් වෙන **Marketplace එක (භාණ්ඩ විකිණීම සහ මිලදී ගැනීම)** කොහොමද වැඩ කරන්නේ කියලා. ඒක අනිත් ඒවට වඩා ටිකක් වෙනස්!
