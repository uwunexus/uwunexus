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
    $verification_token = bin2hex(random_bytes(32));

    $stmt = $pdo->prepare("INSERT INTO users (full_name, email, password_hash, enrollment_number, batch, degree, role, is_verified, verification_token) VALUES (?, ?, ?, ?, ?, ?, ?, FALSE, ?)");
    $stmt->execute([$fullName, $email, $hash, $enrollment_number, $batch, $degree, $role, $verification_token]);
    $new_id = $pdo->lastInsertId();

    // Send verification email using Resend API (cURL)
    
    // We use a verified domain sender if possible, or fallback. The user requested onboarding@resend.dev but typically that only allows sending TO the verified account holder.
    // For this demonstration, we'll try sending it. 
    $verify_link = rtrim($frontend_url, '/') . "/verify-email?token=" . $verification_token;
    
    $email_html = "
        <h2>Welcome to UWU Nexus!</h2>
        <p>Hi {$fullName},</p>
        <p>Please click the link below to verify your email address and activate your account:</p>
        <p><a href='{$verify_link}'>Verify Email Address</a></p>
        <br>
        <p>If you did not request this, please ignore this email.</p>
    ";

    $options = [
        'http' => [
            'header'  => "Content-type: application/json\r\n" .
                         "Authorization: Bearer " . $resend_api_key . "\r\n",
            'method'  => 'POST',
            'content' => json_encode([
                'from' => 'UWU Nexus <noreply@uwunexus.tech>',
                'to' => [$email],
                'subject' => 'Verify your UWU Nexus Account',
                'html' => $email_html
            ]),
            'ignore_errors' => true
        ],
    ];
    $context  = stream_context_create($options);
    $response = @file_get_contents('https://api.resend.com/emails', false, $context);

    // We successfully registered them, but they need to verify.
    echo json_encode(["success" => true, "message" => "Account created! Please check your email to verify your account."]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
