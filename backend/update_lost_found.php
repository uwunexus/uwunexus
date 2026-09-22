<?php
/**
 * [REST API - POST Endpoint]
 * Endpoint: /backend/update_lost_found.php
 * Method: POST
 * Description: Updates the status of a Lost & Found item (e.g., marks as 'resolved') with user ownership check.
 * Payload (JSON): { id, user_id, status: 'resolved' }
 * Frontend Usage: app/lost-and-found/page.tsx (handleMarkResolved)
 */
require 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['id']) || !isset($data['user_id']) || !isset($data['status'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing id, user_id, or status"]);
    exit();
}

$id = intval($data['id']);
$user_id = intval($data['user_id']);
$status = trim($data['status']);

try {
    // Verify ownership
    $stmt = $pdo->prepare("SELECT user_id FROM lost_found_items WHERE id = ?");
    $stmt->execute([$id]);
    $item = $stmt->fetch();


    // [FIX] IDOR Protection: Verify user ownership before allowing update
    if (!$item || $item['user_id'] !== $user_id) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Unauthorized to update this item"]);
        exit();
    }

    $stmt = $pdo->prepare("UPDATE lost_found_items SET status = ? WHERE id = ?");
    $stmt->execute([$status, $id]);

    echo json_encode(["success" => true, "message" => "Status updated successfully!"]);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
