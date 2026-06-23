<?php
require 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$required_fields = ['title', 'description', 'event_date', 'event_time', 'venue', 'price', 'total_tickets', 'image_url', 'created_by'];
foreach ($required_fields as $field) {
    if (!isset($data[$field]) || empty(trim($data[$field]))) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Missing required field: $field"]);
        exit();
    }
}

$title = trim($data['title']);
$description = trim($data['description']);
$event_date = trim($data['event_date']);
$event_time = trim($data['event_time']);
$venue = trim($data['venue']);
$price = floatval($data['price']);
$total_tickets = intval($data['total_tickets']);
$image_url = trim($data['image_url']);
$created_by = intval($data['created_by']);

// Fetch user to verify admin role
try {
    $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->execute([$created_by]);
    $user = $stmt->fetch();

    if (!$user || ($user['role'] !== 'superadmin' && $user['role'] !== 'clubadmin')) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Unauthorized. Only admins can create ticketed events."]);
        exit();
    }

    $stmt = $pdo->prepare("INSERT INTO ticketed_events (title, description, event_date, event_time, venue, price, total_tickets, available_tickets, image_url, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$title, $description, $event_date, $event_time, $venue, $price, $total_tickets, $total_tickets, $image_url, $created_by]);

    echo json_encode(["success" => true, "message" => "Ticketed event created successfully!"]);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
