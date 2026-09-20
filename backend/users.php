<?php
require 'db.php';
header('Content-Type: application/json');

// Only allow GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

// Verify requester is superadmin or clubadmin via header
$requester_id = isset($_GET['requester_id']) ? intval($_GET['requester_id']) : 0;
if ($requester_id <= 0) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit();
}

try {
    $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->execute([$requester_id]);
    $requester = $stmt->fetch();

    if (!$requester || !in_array($requester['role'], ['superadmin', 'clubadmin'])) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Forbidden"]);
        exit();
    }

    $users = $pdo->query("SELECT id, full_name, email, enrollment_number, batch, degree, role, is_verified, created_at FROM users ORDER BY created_at DESC")->fetchAll();
    echo json_encode(["success" => true, "users" => $users]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error"]);
}
?>
