# Part 19: Feature 04 - අලුත් ඉවෙන්ට් එකක් හැදීම (Create Event සහ Image Upload)

අපි Signup වෙද්දී Database එකට අලුත් විස්තර දැම්මා වගේම තමයි අලුත් ඉවෙන්ට් එකක් හදද්දීත් කරන්නේ. හැබැයි මෙතනදී එක විශේෂ දෙයක් තියෙනවා: **පින්තූරයක් (Image) Upload කරන එක.**

සාමාන්‍ය වචන යවනවට වඩා පින්තූරයක් යවන එක ටිකක් වෙනස්. අපි බලමු ඒක වෙන්නේ කොහොමද කියලා. මේකට සම්බන්ධ වෙන ප්‍රධාන ෆයිල් දෙක:
1. **Frontend එකේ:** `app/events/create/page.tsx`
2. **Backend එකේ:** `backend/create_event.php`

---

## 1. Frontend එක (`app/events/create/page.tsx`)

අපි Signup වෙද්දී වචන යවන්න පාවිච්චි කළේ `JSON.stringify(...)` කියන ක්‍රමයයි. හැබැයි පින්තූර JSON විදිහට යවන්න බැහැ! ඒකට අපි අලුත් පෙට්ටියක් පාවිච්චි කරනවා **`FormData`** කියලා. මේක හරියට පාර්සලයක් වගේ, ඒකෙ වචන වගේම ලොකු පින්තූරත් යවන්න පුළුවන්.

**මෙන්න කෝඩ් එකේ වැදගත්ම කොටස:**

```tsx
const [title, setTitle] = useState("");
const [image, setImage] = useState(null); // පින්තූරය තියාගන්න පෙට්ටිය

const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. අලුත් පාර්සලයක් (FormData) හදාගන්නවා
    const formData = new FormData();
    
    // 2. පාර්සලයට වචන ටික දානවා
    formData.append("title", title);
    
    // 3. පින්තූරයකුත් තෝරලා තියෙනවා නම්, ඒකත් පාර්සලයට දානවා
    if (image) {
        formData.append("image", image);
    }
    
    // 4. කවුද මේ ඉවෙන්ට් එක දාන්නේ කියලා (අර localStorage එකේ තියෙන id එක) අරන් දානවා
    const user = JSON.parse(localStorage.getItem("user"));
    formData.append("created_by", user.id);

    // 5. පාර්සලය Backend එකට යවනවා (මෙතනදී Content-Type එක JSON නෙවෙයි!)
    const response = await fetch("http://localhost/backend/create_event.php", {
        method: "POST",
        body: formData // JSON වෙනුවට කෙලින්ම පාර්සලය යවනවා
    });

    const result = await response.json();
    if (result.success) {
        alert("ඉවෙන්ට් එක සාර්ථකව හැදුවා!");
    }
};
```

## 2. Backend එක (`backend/create_event.php`)

Frontend එකෙන් අර පාර්සලය (FormData) එව්වම, PHP වල ඒක කොටස් දෙකකට කඩනවා:
* වචන ටික එන්නේ **`$_POST`** කියන පෙට්ටියට.
* පින්තූර එන්නේ **`$_FILES`** කියන පෙට්ටියට.

**මෙන්න කෝඩ් එකේ වැදගත්ම කොටස:**

```php
<?php
require 'db.php';

// 1. වචන ටික $_POST එකෙන් ගන්නවා
$title = $_POST['title'];
$created_by = $_POST['created_by'];
$image_url = null;

// 2. පින්තූරයක් එවලා තියෙනවද කියලා බලනවා
if (isset($_FILES['image']) && $_FILES['image']['error'] == 0) {
    
    // 3. පින්තූරයේ නම අරන් ඒක සේව් කරන්න ඕනේ තැන (Path එක) හදාගන්නවා
    // (උදා: uploads/events/myphoto.jpg)
    $upload_dir = 'uploads/events/';
    $image_name = time() . '_' . $_FILES['image']['name']; 
    // පින්තූරවල නම් පැටලෙන එක නවත්තන්න අපි නමට ඉස්සරහින් time() එක දානවා
    $target_file = $upload_dir . $image_name;

    // 4. පරිගණකයේ තාවකාලිකව තියෙන පින්තූරය, අපේ ෆෝල්ඩරයට (uploads/events) මාරු කරනවා
    if (move_uploaded_file($_FILES['image']['tmp_name'], $target_file)) {
        // පින්තූරයේ ලින්ක් එක (Image URL) එක හදාගන්නවා
        $image_url = 'http://localhost/backend/' . $target_file;
    }
}

try {
    // 5. අන්තිමට, වචන ටිකයි පින්තූරයේ ලින්ක් එකයි (Image URL) Database එකේ සේව් කරනවා (INSERT)
    $stmt = $pdo->prepare("
        INSERT INTO events (title, created_by, image_url) 
        VALUES (?, ?, ?)
    ");
    
    $stmt->execute([$title, $created_by, $image_url]);
    
    echo json_encode(["success" => true, "message" => "Event created"]);

} catch (\PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database error"]);
}
?>
```

> **සාරාංශය:**
> * පින්තූර යවන්න ඕනේ නම් Frontend එකේදී **`FormData`** පාවිච්චි කරනවා මිසක් JSON පාවිච්චි කරන්නේ නැහැ.
> * PHP වලට ඒක ආවම වචන ටික **`$_POST`** එකෙනුත්, පින්තූරය **`$_FILES`** එකෙනුත් ගන්නවා.
> * ඊටපස්සේ **`move_uploaded_file()`** පාවිච්චි කරලා ඒ පින්තූරය අපේ Backend එකේ `uploads/` ෆෝල්ඩරේ ඇතුළේ සේව් කරගන්නවා.
> * අන්තිමට Database එකේ සේව් කරන්නේ පින්තූරය නෙවෙයි, අර සේව් කරපු පින්තූරයේ **ලින්ක් එකයි (URL)**.

දැන් ඔයා දන්නවා පද්ධතියකට පින්තූරයක් Upload කරන්නේ කොහොමද කියලා. Marketplace එකේ බඩු විකුණන්න දාද්දි පින්තූර අප්ලෝඩ් කරන්නෙත් හරියටම මේ විදිහටමයි!

ඊළඟ පාඩමෙන් අපි බලමු ටිකක් වෙනස් Feature එකක් වෙන **ඉවෙන්ට්ස් වලට ටිකට් බුක් කරන්නේ (Tickets) කොහොමද** කියලා!
