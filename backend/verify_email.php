<?php
require 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['token']) || empty(trim($data['token']))) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing verification token"]);
    exit();
}

$token = trim($data['token']);

try {
    $stmt = $pdo->prepare("SELECT id FROM users WHERE verification_token = ? AND is_verified = FALSE");
    $stmt->execute([$token]);
    $user = $stmt->fetch();

    if ($user) {
        $updateStmt = $pdo->prepare("UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = ?");
        $updateStmt->execute([$user['id']]);

        echo json_encode(["success" => true, "message" => "Email successfully verified! You can now log in."]);
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid or expired verification token."]);
    }
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
