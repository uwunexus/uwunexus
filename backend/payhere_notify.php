<?php
require 'db.php';

// PayHere sends data as form-urlencoded POST
$merchant_id = $_POST['merchant_id'] ?? '';
$order_id = $_POST['order_id'] ?? '';
$payhere_amount = $_POST['payhere_amount'] ?? '';
$payhere_currency = $_POST['payhere_currency'] ?? '';
$status_code = $_POST['status_code'] ?? '';
$md5sig = $_POST['md5sig'] ?? '';
$custom_1 = $_POST['custom_1'] ?? '';
$custom_2 = $_POST['custom_2'] ?? '';
$payment_id = $_POST['payment_id'] ?? '';

// Read secrets from .env.local
$env = parse_ini_file(__DIR__ . '/../.env.local');
$merchant_secret = $env['payheresecret'] ?? '';

// Verify signature
// md5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + md5(merchant_secret))
$local_md5sig = strtoupper(md5(
    $merchant_id . 
    $order_id . 
    $payhere_amount . 
    $payhere_currency . 
    $status_code . 
    strtoupper(md5($merchant_secret))
));

if ($local_md5sig !== $md5sig) {
    http_response_code(403);
    echo "Signature mismatch";
    exit();
}

try {
    $status = 'pending';
    if ($status_code == '2') {
        $status = 'success';
    } elseif ($status_code == '0') {
        $status = 'pending';
    } elseif ($status_code == '-1') {
        $status = 'canceled';
    } elseif ($status_code == '-2') {
        $status = 'failed';
    } elseif ($status_code == '-3') {
        $status = 'failed';
    }

    $pdo->beginTransaction();

    // Update purchase record
    $stmt = $pdo->prepare("UPDATE ticket_purchases SET status = ?, payhere_payment_id = ? WHERE order_id = ?");
    $stmt->execute([$status, $payment_id, $order_id]);

    // If success, reduce available_tickets
    if ($status === 'success') {
        // Find the event ID for this order
        $stmt = $pdo->prepare("SELECT ticket_event_id FROM ticket_purchases WHERE order_id = ?");
        $stmt->execute([$order_id]);
        $row = $stmt->fetch();

        if ($row) {
            $stmt = $pdo->prepare("UPDATE ticketed_events SET available_tickets = available_tickets - 1 WHERE id = ? AND available_tickets > 0");
            $stmt->execute([$row['ticket_event_id']]);
        }
    }

    $pdo->commit();
    echo "OK";

} catch (\PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo "Database error";
}
?>
