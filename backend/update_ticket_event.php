<?php
require 'db.php';
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';

$data = json_decode(file_get_contents("php://input"));
if (!isset($data->requester_id) || !isset($data->id) || !isset($data->title) || !isset($data->event_date)) {
    echo json_encode(["success" => false, "message" => "Missing required fields"]);
    exit;
}

$requester_id = (int)$data->requester_id;
$event_id = (int)$data->id;

// Check if requester is authorized (superadmin or clubadmin)
$stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
$stmt->execute([$requester_id]);
$requester = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$requester || !in_array($requester['role'], ['superadmin', 'clubadmin'])) {
    echo json_encode(["success" => false, "message" => "Unauthorized access."]);
    exit;
}

// Prepare update query
$query = "UPDATE ticketed_events SET title=?, description=?, event_date=?, event_time=?, venue=?, price=?, total_tickets=?";
$params = [
    $data->title,
    $data->description ?? '',
    $data->event_date,
    $data->event_time,
    $data->venue,
    (float)$data->price,
    (int)$data->total_tickets
];

if (!empty($data->image_url)) {
    $query .= ", image_url=?";
    $params[] = $data->image_url;
}

$query .= " WHERE id=?";
$params[] = $event_id;

try {
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    echo json_encode(["success" => true, "message" => "Ticketed Event updated successfully"]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error updating ticketed event: " . $e->getMessage()]);
}
?>
