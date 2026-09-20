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
    $query = "
        SELECT 
            p.id, p.order_id, p.amount, p.currency, p.status, 
            p.customer_name, p.customer_email, p.customer_phone, p.created_at,
            e.title as event_title, e.image_url, e.event_date, e.event_time, e.venue as location, e.price
        FROM ticket_purchases p
        JOIN ticketed_events e ON p.ticket_event_id = e.id
        WHERE p.order_id = ?
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([$order_id]);
    $purchase = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($purchase) {
        // Calculate quantity
        $quantity = 1;
        if ($purchase['price'] > 0) {
            $quantity = max(1, intval(round($purchase['amount'] / $purchase['price'])));
        }
        $purchase['quantity'] = $quantity;
        
        echo json_encode(["success" => true, "purchase" => $purchase]);
    } else {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Ticket not found"]);
    }

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
