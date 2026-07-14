# Part 17: Feature 02 - ගිණුමට ඇතුළු වීම (Login)

කලින් පාඩමෙන් අපි බැලුවා කෙනෙක් රෙජිස්ටර් වුණාම එයාගේ විස්තර Database එකට යන්නේ කොහොමද කියලා. දැන් අපි බලමු එහෙම රෙජිස්ටර් වුණු කෙනෙක් කොහොමද එයාගේ ගිණුමට ඇතුළු වෙන්නේ (Login වෙන්නේ) කියලා.

මේකටත් සම්බන්ධ වෙන්නේ ප්‍රධාන ෆයිල් දෙකක් විතරයි:
1. **Frontend එකේ:** `app/login/page.tsx`
2. **Backend එකේ:** `backend/login.php`

---

## 1. Frontend එක (`app/login/page.tsx`)

මේකෙදිත් Signup එකේදී වගේම ළමයා ටයිප් කරන ඊමේල් එකයි පාස්වර්ඩ් එකයි `useState` හරහා මතක තියාගෙන Backend එකට යවනවා. හැබැයි මේකෙදි එක විශේෂ දෙයක් වෙනවා.

**මෙන්න කෝඩ් එකේ වැදගත්ම කොටස:**

```tsx
// 1. මතක තියාගන්න පෙට්ටි (States)
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

const handleLogin = async (e) => {
    e.preventDefault();
    
    // 2. පැකට් එක හදලා යවනවා
    const response = await fetch("http://localhost/backend/login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const result = await response.json();
    
    // 3. ලොග් වීම සාර්ථක නම්...
    if (result.success) {
        // මේක ගොඩක් වැදගත්! පරිශීලකයාගේ විස්තර බ්‍රව්සර් එකේ සේව් කරගන්නවා
        localStorage.setItem("user", JSON.stringify(result.user));
        
        // ඊටපස්සේ Dashboard එකට (ප්‍රධාන පිටුවට) යවනවා
        window.location.href = "/dashboard";
    } else {
        alert("ඊමේල් එක හෝ පාස්වර්ඩ් එක වැරදියි!");
    }
};
```

**`localStorage` කියන්නේ මොකක්ද?**
ඔයා Facebook එකට ලොග් වුණාම, පහුවදා ආයෙ යද්දිත් ඔයා ලොග් වෙලාම නේද ඉන්නේ? හැමදාම පාස්වර්ඩ් ගහන්න ඕනේ නැහැ. ඒකට හේතුව බ්‍රව්සර් එක ඇතුළේ තියෙන පොඩි මතකයක් වෙන `localStorage` එකේ ඒ විස්තර සේව් කරලා තියෙන එකයි. 
අපිත් අපේ කෝඩ් එකේ `localStorage.setItem(...)` කියලා පාවිච්චි කරන්නේ අන්න ඒ වැඩේමයි.

## 2. Backend එක (`backend/login.php`)

Frontend එකෙන් ඊමේල් එකයි පාස්වර්ඩ් එකයි අරන් ආවම, මේ ෆයිල් එකෙන් කරන්නේ Database එකේ ඒ ඊමේල් එක තියෙනවද බලලා, පාස්වර්ඩ් එක ගැලපෙනවද කියලා චෙක් කරන එකයි.

**මෙන්න කෝඩ් එකේ වැදගත්ම කොටස:**

```php
<?php
require 'db.php';

$data = json_decode(file_get_contents("php://input"));
$email = $data->email;
$password = $data->password;

try {
    // 1. මේ ඊමේල් එක තියෙන කෙනාව Database එකෙන් හොයන්න (SELECT)
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    // 2. එහෙම කෙනෙක් ඉන්නවද කියලා බලනවා
    if ($user) {
        
        // 3. එයා ගහපු පාස්වර්ඩ් එකයි, Database එකේ තියෙන කේත කරපු (Hashed) 
        // පාස්වර්ඩ් එකයි ගැලපෙනවද කියලා බලනවා.
        if (password_verify($password, $user['password'])) {
            
            // 4. පාස්වර්ඩ් එකත් හරි නම්, එයාගේ විස්තර ටික ආපහු Frontend එකට යවනවා
            echo json_encode([
                "success" => true, 
                "user" => [
                    "id" => $user['id'],
                    "first_name" => $user['first_name'],
                    "role" => $user['uwu_role'] // ඇඩ්මින් කෙනෙක්ද කියලා බලන්න
                ]
            ]);
            
        } else {
            // පාස්වර්ඩ් එක වැරදියි
            echo json_encode(["success" => false, "message" => "Invalid password"]);
        }
    } else {
        // එහෙම ඊමේල් එකක් නැහැ
        echo json_encode(["success" => false, "message" => "User not found"]);
    }

} catch (\PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database error"]);
}
?>
```

> **සාරාංශය:**
> * Frontend එකේදී විස්තර ටික අරන් යවලා, ලොග් වීම හරි ගියොත් **`localStorage`** එකේ සේව් කරගෙන ළමයාව ඇතුළට යවනවා.
> * Backend එකේදී `SELECT` පාවිච්චි කරලා ළමයාව හොයනවා.
> * ඊටපස්සේ **`password_verify()`** කියන විශේෂ Function එක පාවිච්චි කරලා පාස්වර්ඩ් එක හරිද කියලා චෙක් කරනවා. 

දැන් ඔයා අපේ Project එකේ ගිණුම් හදන (Authentication) කොටස සම්පූර්ණයෙන්ම දන්නවා. 

ඊළඟ පාඩමෙන් අපි බලමු ලොග් වුණු කෙනෙක්ට, **Database එකේ තියෙන ඉවෙන්ට්ස් ටික ගෙනත් තිරයේ පෙන්නන්නේ කොහොමද (Read Events)** කියලා. ඒකෙදි අපි කලින් ඉගෙන ගත්ත දේවල් ගොඩක් පාවිච්චි වෙනවා!
