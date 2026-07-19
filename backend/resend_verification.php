<?php
require 'db.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['email'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing email"]);
    exit();
}

$email = strtolower(trim($data['email']));

try {
    $stmt = $pdo->prepare("SELECT id, full_name, verification_token, is_verified FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "User not found"]);
        exit();
    }

    if ($user['is_verified']) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Email is already verified. You can log in."]);
        exit();
    }

    $fullName = $user['full_name'];
    $verification_token = $user['verification_token'];

    $verify_link = rtrim($frontend_url, '/') . "/verify-email?token=" . $verification_token;
    
    $email_html = "
        <h2>UWU Nexus - Resend Verification</h2>
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

    echo json_encode(["success" => true, "message" => "Verification email resent successfully. Please check your inbox."]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
