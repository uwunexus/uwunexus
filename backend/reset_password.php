<?php
require 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['token']) || empty(trim($data['token'])) || !isset($data['password']) || empty(trim($data['password']))) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing required fields"]);
    exit();
}

$token = trim($data['token']);
$password = $data['password'];

try {
    // Find the user with this token and ensure it's not expired
    $stmt = $pdo->prepare("SELECT id FROM users WHERE reset_token = ? AND reset_token_expires_at > NOW()");
    $stmt->execute([$token]);
    $user = $stmt->fetch();

    if ($user) {
        $hash = password_hash($password, PASSWORD_DEFAULT);
        
        $updateStmt = $pdo->prepare("UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires_at = NULL WHERE id = ?");
        $updateStmt->execute([$hash, $user['id']]);

        echo json_encode(["success" => true, "message" => "Password successfully reset! You can now log in."]);
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid or expired password reset token."]);
    }
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
