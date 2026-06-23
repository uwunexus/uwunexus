<?php
require 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['id']) || !isset($data['status']) || !isset($data['user_id'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing required fields"]);
    exit();
}

$id = intval($data['id']);
$status = trim($data['status']);
$user_id = intval($data['user_id']);

if (!in_array($status, ['active', 'closed'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid status"]);
    exit();
}

try {
    // Verify superadmin role
    $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();

    if (!$user || $user['role'] !== 'superadmin') {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Unauthorized. Only superadmins can update ticket statuses."]);
        exit();
    }

    $stmt = $pdo->prepare("UPDATE ticketed_events SET status = ? WHERE id = ?");
    $stmt->execute([$status, $id]);

    echo json_encode(["success" => true, "message" => "Ticket status updated to $status"]);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
