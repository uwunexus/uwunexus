<?php
require 'db.php';
header('Content-Type: application/json');

if (!isset($_GET['order_id'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing order_id"]);
    exit();
}

$order_id = trim($_GET['order_id']);

try {
    $stmt = $pdo->prepare("SELECT status FROM ticket_purchases WHERE order_id = ?");
    $stmt->execute([$order_id]);
    $row = $stmt->fetch();

    if ($row) {
        echo json_encode(["success" => true, "status" => $row['status']]);
    } else {
        echo json_encode(["success" => false, "message" => "Order not found"]);
    }
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error"]);
}
?>
