# Part 16: Feature 01 - කෙනෙක් ලියාපදිංචි වීම (Sign Up)

අපි දැන් යන්නේ UWU-NEXUS එකේ තියෙන ඇත්තම කෝඩ් කියවන්න. මුලින්ම කෙනෙක් වෙබ්සයිට් එකට ඇවිත් අලුතින් ගිණුමක් හදාගන්න (Sign Up වෙන) හැටි බලමු. 

මේ වැඩේට ප්‍රධාන ෆයිල් දෙකක් සම්බන්ධ වෙනවා:
1. **Frontend එකේ:** `app/signup/page.tsx` (පරිශීලකයාට පෙනෙන ෆෝම් එක)
2. **Backend එකේ:** `backend/signup.php` (විස්තර අරන් Database එකට දාන මොළය)

---

## 1. Frontend එක (`app/signup/page.tsx`)

මේ පිටුවෙදි කරන්නේ ළමයාගෙන් එයාගේ නම, ඊමේල් එක සහ පාස්වර්ඩ් එක ඉල්ලන එකයි. ඒ දේවල් ටයිප් කරද්දී ඒවා මතක තියාගන්න අපි කලින් ඉගෙන ගත්ත **`useState`** පාවිච්චි කරනවා.

**මෙන්න කෝඩ් එකේ වැදගත්ම කොටස:**

```tsx
// 1. මතක තියාගන්න පෙට්ටි (States) හදාගන්නවා
const [firstName, setFirstName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

// 2. කවුරුහරි "Sign Up" බොත්තම එබුවම මේ Function එක වැඩ කරනවා
const handleSignup = async (e) => {
    e.preventDefault(); // ෆෝම් එක රීලෝඩ් වෙන එක නවත්තනවා
    
    // 3. මතක තියාගත්ත විස්තර ටික පැකට් එකකට (JSON) දානවා
    const dataToSend = {
        first_name: firstName,
        email: email,
        password: password
    };

    // 4. ඒ පැකට් එක Backend එකේ 'signup.php' එකට යවනවා!
    const response = await fetch("http://localhost/backend/signup.php", {
        method: "POST", // POST කියන්නේ 'දත්ත යවනවා' කියන එකයි
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend) // පැකට් එක යැවීම
    });

    const result = await response.json();
    if (result.success) {
        alert("ලියාපදිංචිය සාර්ථකයි!");
    } else {
        alert("වැරැද්දක් සිදුවිය: " + result.message);
    }
};
```

## 2. Backend එක (`backend/signup.php`)

Frontend එකෙන් අර පැකට් එක එව්වම, ඒක භාරගන්නේ මෙයා. මෙයාගේ වැඩේ තමයි ඒ විස්තර ටික අරන් Database එකේ (`users` table එකේ) සේව් කරන එක. (මෙතනදී අපි කලින් ඉගෙන ගත්ත `INSERT INTO` කමාන්ඩ් එක පාවිච්චි වෙනවා).

**මෙන්න කෝඩ් එකේ වැදගත්ම කොටස:**

```php
<?php
// 1. Database පාලම සම්බන්ධ කරගන්නවා
require 'db.php';

// 2. Frontend එකෙන් ආපු JSON පැකට් එක කඩලා බලනවා
$data = json_decode(file_get_contents("php://input"));

$first_name = $data->first_name;
$email = $data->email;
$password = $data->password;

// 3. ආරක්ෂාව (Security) - පාස්වර්ඩ් එක ඒ විදිහටම සේව් කරන්නේ නැහැ!
// ඒක අනිත් අයට කියවන්න බැරි වෙන්න වෙනස් කරනවා (Hash කරනවා)
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

try {
    // 4. Database එකට දත්ත ඇතුළත් කිරීම (INSERT)
    // ? ලකුණු දාලා තියෙන්නේ ආරක්ෂාවට (SQL Injection වළක්වන්න)
    $stmt = $pdo->prepare("INSERT INTO users (first_name, email, password) VALUES (?, ?, ?)");
    
    // 5. අර ? ලකුණු වලට අපේ දත්ත ටික දාලා කෝඩ් එක ක්‍රියාත්මක කරනවා (Execute)
    $stmt->execute([$first_name, $email, $hashed_password]);
    
    // 6. වැඩේ සාර්ථකයි කියලා Frontend එකට පණිවිඩයක් යවනවා
    echo json_encode(["success" => true, "message" => "User registered successfully"]);

} catch (\PDOException $e) {
    // 7. ඊමේල් එක කලින්ම කවුරුහරි අරන් නම් Error එකක් යවනවා
    echo json_encode(["success" => false, "message" => "Email already exists!"]);
}
?>
```

> **සාරාංශය:**
> * Frontend එකේ `useState` වලින් විස්තර ටික එකතු කරලා `fetch` හරහා Backend එකට යවනවා.
> * Backend එකේදී `password_hash()` හරහා පාස්වර්ඩ් එක ආරක්ෂිත කරලා, `INSERT INTO` පාවිච්චි කරලා Database එකේ සේව් කරනවා.
> * වැඩේ සාර්ථකයි නම් Frontend එකට අදාළව පණිවිඩයක් ආපහු යවනවා (JSON හරහා).

දැන් ඔයා හරියටම දන්නවා අපේ වෙබ්සයිට් එකේ Sign Up එක වැඩ කරන්නේ කොහොමද කියලා. ඔයාට ඕනේ නම් තව Column එකක් (උදාහරණයක් විදිහට දුරකථන අංකය) එකතු කරන්න, දැන් ඔයා දන්නවා ෆයිල් දෙකේම ඒක වෙනස් කරන්නේ කොහොමද කියලා!

ඊළඟ පාඩමෙන් අපි බලමු මෙහෙම ගිණුමක් හදාගත්ත කෙනෙක් **කොහොමද ලොග් වෙන්නේ (Login) කියලා.**
