<?php
require 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$required = ['ticket_event_id', 'amount', 'currency', 'customer_name', 'customer_email', 'customer_phone'];
foreach ($required as $field) {
    if (!isset($data[$field])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Missing required field: $field"]);
        exit();
    }
}

$ticket_event_id = intval($data['ticket_event_id']);
$user_id = isset($data['user_id']) ? intval($data['user_id']) : null;
$amount = floatval($data['amount']);
$currency = trim($data['currency']);
$customer_name = trim($data['customer_name']);
$customer_email = trim($data['customer_email']);
$customer_phone = trim($data['customer_phone']);

try {
    // Generate unique order ID
    $order_id = "TKT-STRIPE-" . time() . "-" . rand(1000, 9999);

    // Create a pending purchase record
    // We reuse the ticket_purchases table created earlier
    $stmt = $pdo->prepare("INSERT INTO ticket_purchases (ticket_event_id, user_id, order_id, amount, currency, customer_name, customer_email, customer_phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')");
    $stmt->execute([$ticket_event_id, $user_id, $order_id, $amount, $currency, $customer_name, $customer_email, $customer_phone]);

    echo json_encode([
        "success" => true, 
        "order_id" => $order_id
    ]);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
