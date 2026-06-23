<?php
require 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

$headers = getallheaders();
$auth_header = isset($headers['Authorization']) ? $headers['Authorization'] : (isset($headers['authorization']) ? $headers['authorization'] : '');

// Read the secret from .env.local to authenticate internal requests
$env = parse_ini_file(__DIR__ . '/../.env.local');
$stripe_secret = trim($env['stripsecretekey'] ?? '');

if (empty($stripe_secret) || strpos($auth_header, $stripe_secret) === false) {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['order_id']) || !isset($data['status'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing order_id or status"]);
    exit();
}

$order_id = trim($data['order_id']);
$status = trim($data['status']); // 'success', 'failed', 'canceled'
$payment_id = isset($data['payment_id']) ? trim($data['payment_id']) : null;

try {
    $pdo->beginTransaction();

    // Check current status
    $stmt = $pdo->prepare("SELECT status, ticket_event_id FROM ticket_purchases WHERE order_id = ? FOR UPDATE");
    $stmt->execute([$order_id]);
    $row = $stmt->fetch();

    if (!$row) {
        $pdo->rollBack();
        echo json_encode(["success" => false, "message" => "Order not found"]);
        exit();
    }

    // Only update if it's currently pending (prevent double processing)
    if ($row['status'] === 'pending') {
        $stmt = $pdo->prepare("UPDATE ticket_purchases SET status = ?, payhere_payment_id = ? WHERE order_id = ?");
        $stmt->execute([$status, $payment_id, $order_id]);

        // If success, reduce available_tickets
        if ($status === 'success') {
            $stmt = $pdo->prepare("UPDATE ticketed_events SET available_tickets = available_tickets - 1 WHERE id = ? AND available_tickets > 0");
            $stmt->execute([$row['ticket_event_id']]);
        }
    }

    $pdo->commit();
    echo json_encode(["success" => true, "message" => "Order updated"]);

} catch (\PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
