<?php
require 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['email'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing email field"]);
    exit();
}

$email = strtolower(trim($data['email']));

try {
    $stmt = $pdo->prepare("SELECT id, full_name FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user) {
        $reset_token = bin2hex(random_bytes(32));
        $updateStmt = $pdo->prepare("UPDATE users SET reset_token = ?, reset_token_expires_at = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = ?");
        $updateStmt->execute([$reset_token, $user['id']]);

        // Send reset email via Resend
        $reset_link = rtrim($frontend_url, '/') . "/reset-password?token=" . $reset_token;
        
        $email_html = "
            <h2>Password Reset Request</h2>
            <p>Hi {$user['full_name']},</p>
            <p>We received a request to reset your password. Click the link below to set a new password:</p>
            <p><a href='{$reset_link}'>Reset Password</a></p>
            <br>
            <p>This link is valid for 1 hour. If you did not request this, you can safely ignore this email.</p>
        ";

        $options = [
            'http' => [
                'header'  => "Content-type: application/json\r\n" .
                             "Authorization: Bearer " . $resend_api_key . "\r\n",
                'method'  => 'POST',
                'content' => json_encode([
                    'from' => 'UWU Nexus <noreply@uwunexus.tech>',
                    'to' => [$email],
                    'subject' => 'Password Reset Request',
                    'html' => $email_html
                ]),
                'ignore_errors' => true
            ],
        ];
        $context  = stream_context_create($options);
        $res = @file_get_contents('https://api.resend.com/emails', false, $context);
    }

    // We always return success to avoid leaking which emails are registered
    echo json_encode(["success" => true, "message" => "If an account exists with that email, a password reset link has been sent."]);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
