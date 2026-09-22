<?php
/**
 * [REST API - POST Endpoint]
 * Endpoint: /backend/delete_lost_found.php
 * Method: POST
 * Description: Deletes a Lost & Found report by item ID (Admin / authorized action).
 * Payload (JSON): { id, user_id }
 * Frontend Usage: app/admin/page.tsx (deleteLostFoundItem)
 */
require 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['id'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing id"]);
    exit();
}

$id = intval($data['id']);

try {
    // Admins don't need ownership verification, they just delete it.
    // In a real app we'd verify admin session here.
    $stmt = $pdo->prepare("DELETE FROM lost_found_items WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(["success" => true, "message" => "Report deleted successfully!"]);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
