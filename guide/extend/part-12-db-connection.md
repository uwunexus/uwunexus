# Part 12: Backend එක සහ Database එක යා කරන පාලම (`db.php`)

අපේ Project එකේ Backend (PHP) ෆෝල්ඩරය ඇතුළට ගියොත්, ඔයාට හම්බවෙන ගොඩක්ම වැදගත් ෆයිල් එක තමයි **`backend/db.php`**. 

අපි කලින් කතා කරපු PHP (මොළය) සහ MySQL (ගබඩාව) එකිනෙකට සම්බන්ධ වෙන්නේ මේ ෆයිල් එකෙන්. අනිත් හැම PHP ෆයිල් එකක්ම (උදා: `login.php`, `signup.php`) මුලින්ම කරන්නේ මේ `db.php` එක තමන්ගේ කෝඩ් එකට ඇතුළත් කරගන්න (include කරගන්න) එකයි. 

අපි මේ ෆයිල් එක පේළියෙන් පේළිය කියවලා බලමු මේකෙ ඇතුළේ මොකද වෙන්නේ කියලා.

---

## 1. CORS - ආරක්ෂක දොරටුව

```php
<?php
// Handle CORS globally for all API requests
$allowed_origin  = 'http://localhost:3000';

header('Access-Control-Allow-Origin: ' . $allowed_origin);
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
```

වෙබ්සයිට් වල ලොකු ආරක්ෂක නීතියක් තියෙනවා **CORS (Cross-Origin Resource Sharing)** කියලා. ඒ නීතියෙන් කියන්නේ "එක තැනක (Port එකක) දුවන වෙබ්සයිට් එකකට, තව තැනක දුවන Backend එකකින් දත්ත ඉල්ලන්න බැහැ" කියලා. 

අපේ Frontend (Next.js) එක දුවන්නේ `localhost:3000` වල. අපේ Backend (PHP) එක දුවන්නේ වෙන තැනක (උදා: `localhost:8000`). මේ නීතිය නිසා අපේ Frontend එකට Backend එකෙන් දත්ත ගන්න බැරි වෙනවා.

මේ කෝඩ් පේළි ටිකෙන් කරන්නේ ඒ නීතියට විශේෂ අවසරයක් දෙන එකයි. **"http://localhost:3000 වලින් එන ඕනෑම ඉල්ලීමක් (Request) භාරගන්න, එයා අපේ කෙනෙක්"** කියලා Backend එකට කියන්නේ මේ කෝඩ් එකෙනුයි.

## 2. Database එකේ යතුරු ටික (Credentials)

```php
$host = '127.0.0.1'; // Database එක තියෙන තැන
$db   = 'uwunexus';  // Database එකේ නම
$user = 'root';      // Database එකේ Username එක
$pass = '';          // Database එකේ Password එක
```

Database එක ඇතුළට යන්න අපිට යතුරු (Credentials) ඕනේ. මේ පෙට්ටි (Variables) හතරේ තියෙන්නේ අන්න ඒ විස්තර ටිකයි. ඔයාගේ පරිගණකයේ Password එකක් තියෙනවා නම්, මේ `$pass` එක වෙනස් කරන්න ඕනේ. 

## 3. පාලම හැදීම (PDO Connection)

```php
$charset = 'utf8mb4';

// පාලමේ විස්තර අඩංගු ලියවිල්ල (Data Source Name)
$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];
```

* **`$dsn`:** මේකෙන් කියන්නේ අපි පාවිච්චි කරන්නේ `mysql`, ඒක තියෙන්නේ අර `$host` එකේ, Database එක අර `$db` එකයි කියලා සම්පූර්ණ විස්තරය එක පේළියකට හදාගන්න එකයි.
* **`$options`:** මේකෙන් Database එකට කියනවා "මොනවා හරි වැරදුණොත් මට Error එකක් එවන්න" (`ERRMODE_EXCEPTION`) සහ "දත්ත එවද්දී මට තේරෙන විදිහට, පිළිවෙළකට අරන් එන්න" (`FETCH_ASSOC`) කියලා.

## 4. සම්බන්ධ වීම (Try / Catch)

මෙන්න මෙතන තමයි කලින් පාඩමේදී අපි කතා කරපු **OOP (Object-Oriented Programming)** පාවිච්චි වෙන්නේ.

```php
try {
    // මේකෙන් තමයි පාලම හදන්නේ!
    $pdo = new PDO($dsn, $user, $pass, $options);
    
} catch (\PDOException $e) {
    // වැරදුණොත් මේක වැඩ කරනවා
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit();
}
?>
```

* **`try { ... }`:** මේකෙන් කියන්නේ "මේ ඇතුළේ තියෙන කෝඩ් එක කරලා බලන්න උත්සාහ කරන්න" කියලා.
* **`new PDO(...)`:** මේකෙන් තමයි අපි කලින් ලෑස්ති කරගත්ත යතුරු ටිකයි (`$user`, `$pass`), විස්තර ටිකයි (`$dsn`, `$options`) දීලා **ඇත්තටම Database එකට Connect වෙන්නේ**. ඒ Connect වුණාට පස්සේ හැදෙන Object එක අපි **`$pdo`** කියන පෙට්ටියට දාගන්නවා.
* **`catch (...) { ... }`:** සමහරවිට ඔයාගේ MySQL Database එක On කරලා නැති වෙන්න පුළුවන්, නැත්නම් Password එක වැරදි වෙන්න පුළුවන්. එතකොට අර `try` එක ෆේල් වෙනවා (කඩන් වැටෙනවා). එහෙම වුණොත් මුළු සයිට් එකම සුදු පාට වෙලා හිරවෙන්නේ නැතුව, ලස්සනට **"Database connection failed"** කියලා මැසේජ් එකක් යවන්න කියලා තමයි මේ `catch` එකෙන් කියන්නේ.

> **සාරාංශය:**
> * `db.php` කියන්නේ හැම PHP ෆයිල් එකකටම අත්‍යවශ්‍ය කෝඩ් කෑල්ලක්.
> * ඒකෙන් Frontend එකට එන්න දොර අරිනවා (CORS).
> * ඊටපස්සේ OOP (`new PDO`) පාවිච්චි කරලා Database එකට සම්බන්ධ වෙනවා.
> * සම්බන්ධ වුණාට පස්සේ, අපිට ඕනෙම තැනක ඉඳන් ඒ **`$pdo`** කියන Object එක පාවිච්චි කරලා දත්ත ගන්න පුළුවන්.

අපේ Module 4 මේකෙන් අවසන් වෙනවා. ඊළඟ පාඩමෙන් අපි යනවා අපේ පෙනෙන ලෝකෙට, ඒ කියන්නේ **Module 5: Next.js සහ Frontend නිර්මාණය** කියන කොටසට. 

Next.js වලින් ලස්සනට UI එකක් හදන්නේ කොහොමද කියලා බලන්න ඊළඟ පාඩමට යමු!
