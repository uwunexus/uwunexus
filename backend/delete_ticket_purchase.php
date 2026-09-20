<?php
require 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['id']) || !isset($data['user_id'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing id or user_id"]);
    exit();
}

$id = intval($data['id']);
$user_id = intval($data['user_id']);

try {
    $pdo->beginTransaction();

    // Verify admin role
    $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();

    if (!$user || ($user['role'] !== 'superadmin' && $user['role'] !== 'clubadmin')) {
        $pdo->rollBack();
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Unauthorized"]);
        exit();
    }

    // Fetch the purchase
    $stmt = $pdo->prepare("
        SELECT p.status, p.ticket_event_id, p.amount, e.price 
        FROM ticket_purchases p 
        JOIN ticketed_events e ON p.ticket_event_id = e.id 
        WHERE p.id = ?
        FOR UPDATE
    ");
    $stmt->execute([$id]);
    $purchase = $stmt->fetch();

    if (!$purchase) {
        $pdo->rollBack();
        echo json_encode(["success" => false, "message" => "Purchase not found"]);
        exit();
    }

    // If it was a successful purchase, refund the tickets back to the event
    if ($purchase['status'] === 'success') {
        $quantity = 1;
        if ($purchase['price'] > 0) {
            $quantity = max(1, intval(round($purchase['amount'] / $purchase['price'])));
        }
        $stmt = $pdo->prepare("UPDATE ticketed_events SET available_tickets = available_tickets + ? WHERE id = ?");
        $stmt->execute([$quantity, $purchase['ticket_event_id']]);
    }

    // Delete the purchase
    $stmt = $pdo->prepare("DELETE FROM ticket_purchases WHERE id = ?");
    $stmt->execute([$id]);

    $pdo->commit();
    echo json_encode(["success" => true, "message" => "Purchase deleted successfully"]);

} catch (\PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
