<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';

$data = json_decode(file_get_contents("php://input"));
if (!isset($data->requester_id) || !isset($data->target_id)) {
    echo json_encode(["success" => false, "message" => "Missing required fields"]);
    exit;
}

$requester_id = (int)$data->requester_id;
$target_id = (int)$data->target_id;

// Check if requester is superadmin
$stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
$stmt->execute([$requester_id]);
$requester = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$requester || $requester['role'] !== 'superadmin') {
    echo json_encode(["success" => false, "message" => "Unauthorized access. Only superadmins can delete users."]);
    exit;
}

// Cannot delete self
if ($requester_id === $target_id) {
    echo json_encode(["success" => false, "message" => "You cannot delete your own account."]);
    exit;
}

try {
    $pdo->beginTransaction();

    // Delete user (cascade should handle related records if DB is set up, but let's assume direct delete for now)
    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$target_id]);

    $pdo->commit();
    echo json_encode(["success" => true, "message" => "User deleted successfully."]);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(["success" => false, "message" => "Error deleting user: " . $e->getMessage()]);
}
?>
