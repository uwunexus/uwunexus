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

// Read secrets from .env.local
$env = parse_ini_file(__DIR__ . '/../.env.local');
$merchant_id = $env['payheremerchent'] ?? '';
$merchant_secret = $env['payheresecret'] ?? '';

if (empty($merchant_id) || empty($merchant_secret)) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "PayHere configuration missing"]);
    exit();
}

try {
    // Generate unique order ID
    $order_id = "TKT-" . time() . "-" . rand(1000, 9999);

    // Create a pending purchase record
    $stmt = $pdo->prepare("INSERT INTO ticket_purchases (ticket_event_id, user_id, order_id, amount, currency, customer_name, customer_email, customer_phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')");
    $stmt->execute([$ticket_event_id, $user_id, $order_id, $amount, $currency, $customer_name, $customer_email, $customer_phone]);

    // Format amount to 2 decimal places for PayHere hash
    $formatted_amount = number_format($amount, 2, '.', '');

    // Hash formula: md5(merchant_id + order_id + amountFormatted + currency + md5(merchant_secret))
    $hash = strtoupper(md5(
        $merchant_id . 
        $order_id . 
        $formatted_amount . 
        $currency . 
        strtoupper(md5($merchant_secret))
    ));

    echo json_encode([
        "success" => true, 
        "merchant_id" => $merchant_id,
        "order_id" => $order_id,
        "hash" => $hash,
        "amount" => $formatted_amount
    ]);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
