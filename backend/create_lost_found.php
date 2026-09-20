<?php
require 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$required_fields = ['title', 'description', 'location', 'time_date', 'type', 'user_id', 'contact_number'];
foreach ($required_fields as $field) {
    if (!isset($data[$field]) || empty(trim($data[$field]))) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Missing required field: $field"]);
        exit();
    }
}

$title = trim($data['title']);
$description = trim($data['description']);
$location = trim($data['location']);
$time_date = trim($data['time_date']);
$type = trim($data['type']);
if (!in_array($type, ['Lost', 'Found'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid type. Must be Lost or Found."]);
    exit();
}

$user_id = intval($data['user_id']);
$contact_number = trim($data['contact_number']);
$contact_email = isset($data['contact_email']) ? trim($data['contact_email']) : '';
$images = isset($data['images']) && is_array($data['images']) ? $data['images'] : [];

if (!preg_match('/^[0-9]{10}$/', $contact_number)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Phone number must be exactly 10 digits."]);
    exit();
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("INSERT INTO lost_found_items (title, description, location, time_date, type, status, user_id, contact_number, contact_email) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)");
    $stmt->execute([$title, $description, $location, $time_date, $type, $user_id, $contact_number, $contact_email]);
    $item_id = $pdo->lastInsertId();

    if (!empty($images)) {
        $img_stmt = $pdo->prepare("INSERT INTO lost_found_images (item_id, image_url) VALUES (?, ?)");
        foreach ($images as $img_url) {
            if (!empty(trim($img_url))) {
                $img_stmt->execute([$item_id, trim($img_url)]);
            }
        }
    }

    $pdo->commit();
    echo json_encode(["success" => true, "message" => "Report created successfully!"]);

} catch (\PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
