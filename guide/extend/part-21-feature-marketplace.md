# Part 21: Feature 06 - භාණ්ඩ විකිණීම (Marketplace)

UWU-NEXUS එකේ තියෙන ලොකුම සහ වැදගත්ම Feature එකක් තමයි Marketplace එක. ළමයින්ට තමන්ගේ පරණ පොත්, ලැප්ටොප් වගේ දේවල් මෙතන විකුණන්න දාන්න පුළුවන්. 

කලින් පාඩමකදී (Part 19) අපි ඉගෙන ගත්තා ඉවෙන්ට් එකකට පින්තූරයක් Upload කරන්නේ කොහොමද කියලා. හැබැයි Marketplace එක ඊට වඩා ටිකක් වෙනස්. මොකද බඩුවක් විකුණන්න දාද්දි **අපිට පින්තූර කිහිපයක්ම** (Multiple Images) දාන්න ඕනේ වෙනවා.

---

## 1. Database එකේ හැඩය (One-to-Many Relationship)

එක භාණ්ඩයකට පින්තූර කිහිපයක් තියෙන්න පුළුවන් නිසා, අපි පින්තූර සේව් කරන්න වෙනමම Table එකක් පාවිච්චි කරනවා.

* **`marketplace_items` Table එක:** මේකේ තියෙන්නේ භාණ්ඩයේ නම, මිල, සහ විකුණන කෙනාගේ අංකය. පින්තූර ගැන කිසිම දෙයක් මේකේ නැහැ.
* **`marketplace_images` Table එක:** මේකේ තියෙන්නේ පින්තූරයේ ලින්ක් එකයි (URL), අදාළ භාණ්ඩයේ අංකයයි (`item_id`) විතරයි.

**උදාහරණයක්:** නිලේෂ් ලැප්ටොප් එකක් දානවා පින්තූර 3ක් එක්ක.
1. මුලින්ම `items` Table එකේ පේළියක් හැදෙනවා (උදා: ඒ ලැප්ටොප් එකේ `id` එක 10).
2. ඊටපස්සේ `images` Table එකේ අලුත් පේළි 3ක් හැදෙනවා. ඒ පේළි 3ම ඇඟිල්ල දික් කරගෙන ඉන්නේ අර ලැප්ටොප් එකේ `id` එකටයි (`item_id = 10`). මේකට කියන්නේ **One-to-Many Relationship (එකකට කිහිපයක්)** කියලයි.

## 2. Frontend එක (`app/marketplace/create/page.tsx`)

අපි ඉවෙන්ට්ස් වලදී පාවිච්චි කළා වගේම තමයි මේකෙදිත් **`FormData`** (පාර්සලය) පාවිච්චි කරන්නේ. හැබැයි මේකෙදි පින්තූර ටික එකින් එක පාර්සලයට දාන්න ලූප් (Loop) එකක් පාවිච්චි කරනවා.

```tsx
const [images, setImages] = useState([]); // පින්තූර ගොඩක් මතක තියාගන්න Array එකක්

const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    
    formData.append("title", title);
    formData.append("price", price);
    
    // පින්තූර ටික Loop කරලා එකින් එක පාර්සලයට දානවා (images[] විදිහට)
    for (let i = 0; i < images.length; i++) {
        formData.append("images[]", images[i]);
    }

    // Backend එකට පාර්සලය යවනවා
    await fetch("http://localhost/backend/create_marketplace_item.php", {
        method: "POST",
        body: formData
    });
};
```

## 3. Backend එක (`backend/create_marketplace_item.php`)

මේක තමයි ටිකක් සංකීර්ණම තැන. Frontend එකෙන් එවන පාර්සලය භාරගත්තම, PHP එකෙන් කරන්න ඕනේ වැඩ 3ක් තියෙනවා.

1. මුලින්ම අදාළ භාණ්ඩය `items` Table එකට දාන්න ඕනේ (`INSERT`).
2. දැම්මට පස්සේ ඒකට හම්බවුණු අංකය (ID) හොයාගන්න ඕනේ (පින්තූර ටික ඒකට ගැටගහන්න).
3. ඊටපස්සේ පින්තූර ටික ෆෝල්ඩරේ සේව් කරලා, ඒවායේ ලින්ක් ටික `images` Table එකට දාන්න ඕනේ (`INSERT`).

```php
<?php
require 'db.php';

$title = $_POST['title'];
$price = $_POST['price'];
$seller_id = $_POST['seller_id'];

try {
    // 1. මුලින්ම භාණ්ඩය සේව් කරනවා
    $stmt = $pdo->prepare("INSERT INTO marketplace_items (title, price, seller_id) VALUES (?, ?, ?)");
    $stmt->execute([$title, $price, $seller_id]);
    
    // 2. සේව් වුණු ගමන්ම ඒකට ලැබුණු ID එක (උදා: 10) අල්ලගන්නවා
    $item_id = $pdo->lastInsertId();

    // 3. පින්තූර එවලා තියෙනවා නම් ඒ ටික සේව් කරන්න ලූප් එකක් දානවා
    if (isset($_FILES['images'])) {
        foreach ($_FILES['images']['tmp_name'] as $key => $tmp_name) {
            
            $file_name = time() . '_' . $_FILES['images']['name'][$key];
            $target_file = 'uploads/marketplace/' . $file_name;
            
            // පින්තූරය ෆෝල්ඩරේ ඇතුළට දානවා
            if (move_uploaded_file($tmp_name, $target_file)) {
                
                $image_url = 'http://localhost/backend/' . $target_file;
                
                // පින්තූරයේ ලින්ක් එකයි, අර අල්ලගත්ත item_id එකයි සේව් කරනවා
                $img_stmt = $pdo->prepare("INSERT INTO marketplace_images (item_id, image_url) VALUES (?, ?)");
                $img_stmt->execute([$item_id, $image_url]);
            }
        }
    }

    echo json_encode(["success" => true]);

} catch (\PDOException $e) {
    echo json_encode(["success" => false, "message" => "Error processing request"]);
}
?>
```

> **සාරාංශය:**
> * පින්තූර කිහිපයක් තියෙන නිසා භාණ්ඩයේ විස්තර එක Table එකකටත්, පින්තූර වෙනම Table එකකටත් දානවා (One-to-Many).
> * Backend එකේදී මුලින්ම භාණ්ඩය සේව් කරලා, ඒකෙ හැදුණු අංකය **`lastInsertId()`** කියන කමාන්ඩ් එකෙන් අරගන්නවා.
> * ඊටපස්සේ ඒ අංකය පාවිච්චි කරලා අනිත් Table එකට පින්තූර ටික ලූප් එකක් හරහා දානවා.

මේ සංකල්පය තේරුණා නම්, E-commerce සයිට් එකක (උදා: Daraz වගේ) බඩු ඇතුළත් කරන ක්‍රමය ඔයාට සම්පූර්ණයෙන්ම පැහැදිලියි!

ඊළඟ පාඩමෙන් අපි බලමු **Lost & Found (නැතිවූ දේවල්)** කියන Feature එක වැඩ කරන්නේ කොහොමද කියලා. (මේකෙදි Search කරන්නේ කොහොමද කියලත් ඉගෙන ගමු).
