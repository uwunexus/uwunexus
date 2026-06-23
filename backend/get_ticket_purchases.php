<?php
require 'db.php';
header('Content-Type: application/json');

if (!isset($_GET['user_id'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing user_id"]);
    exit();
}

$user_id = intval($_GET['user_id']);

try {
    // Verify admin role
    $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();

    if (!$user || ($user['role'] !== 'superadmin' && $user['role'] !== 'clubadmin')) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Unauthorized"]);
        exit();
    }

    // Fetch purchases joined with event title
    // Order by newest first
    $query = "
        SELECT 
            p.id, p.order_id, p.amount, p.currency, p.status, 
            p.customer_name, p.customer_email, p.customer_phone, p.created_at,
            e.title as event_title
        FROM ticket_purchases p
        JOIN ticketed_events e ON p.ticket_event_id = e.id
        ORDER BY p.created_at DESC
    ";

    $stmt = $pdo->query($query);
    $purchases = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "purchases" => $purchases]);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
