<?php
require 'db.php';
header('Content-Type: application/json');

function getOrdinalSuffix($num) {
    if (!in_array(($num % 100), [11,12,13])) {
        switch ($num % 10) {
            case 1: return $num.'st';
            case 2: return $num.'nd';
            case 3: return $num.'rd';
        }
    }
    return $num.'th';
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['fullName']) || !isset($data['email']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing fields"]);
    exit();
}

$fullName = trim($data['fullName']);
$email = strtolower(trim($data['email']));
$password = $data['password'];

$enrollment_number = 'staff';
$batch = 'staff';
$degree = 'staff';
$role = 'staff';

if (str_ends_with($email, '@std.uwu.ac.lk')) {
    // Student email: e.g. iit23068@std.uwu.ac.lk
    $prefix = explode('@', $email)[0];

    if (strlen($prefix) >= 8) {
        $deg_str = strtoupper(substr($prefix, 0, 3));
        $year_str = substr($prefix, 3, 2);
        $serial_str = substr($prefix, 5);

        $enrollment_number = "UWU/{$deg_str}/{$year_str}/{$serial_str}";
        $degree = $deg_str;

        // Batch number: year 19 = 14th batch, so batch_num = year - 5
        $year_int = intval($year_str);
        $batch_num = $year_int - 5;
        $batch = getOrdinalSuffix($batch_num) . ' batch';

        $role = 'student';
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid student email format"]);
        exit();
    }
} elseif (str_ends_with($email, '@uwu.ac.lk')) {
    // Staff email
    $enrollment_number = 'staff';
    $batch = 'staff';
    $degree = 'staff';
    $role = 'staff';
} else {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid email domain. Must end with @uwu.ac.lk or @std.uwu.ac.lk"]);
    exit();
}

try {
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(["success" => false, "message" => "Email already registered"]);
        exit();
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO users (full_name, email, password_hash, enrollment_number, batch, degree, role) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$fullName, $email, $hash, $enrollment_number, $batch, $degree, $role]);

    $new_id = $pdo->lastInsertId();
    echo json_encode(["success" => true, "message" => "User registered successfully", "user" => ["id" => $new_id, "role" => $role]]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
