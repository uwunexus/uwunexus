<?php
require 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$required_fields = ['title', 'description', 'price', 'condition_state', 'category_id', 'seller_id', 'contact_number'];
foreach ($required_fields as $field) {
    if (!isset($data[$field]) || empty(trim($data[$field]))) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Missing required field: $field"]);
        exit();
    }
}

$title = trim($data['title']);
$description = trim($data['description']);
$price = floatval($data['price']);
$condition_state = trim($data['condition_state']);
$category_id = intval($data['category_id']);
$seller_id = intval($data['seller_id']);
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

    // Insert item
    $stmt = $pdo->prepare("INSERT INTO marketplace_items (title, description, price, condition_state, category_id, seller_id, contact_number, contact_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$title, $description, $price, $condition_state, $category_id, $seller_id, $contact_number, $contact_email]);
    $item_id = $pdo->lastInsertId();

    // Insert images
    if (!empty($images)) {
        $img_stmt = $pdo->prepare("INSERT INTO marketplace_images (item_id, image_url) VALUES (?, ?)");
        foreach ($images as $img_url) {
            $img_stmt->execute([$item_id, trim($img_url)]);
        }
    }

    $pdo->commit();
    echo json_encode(["success" => true, "message" => "Item listed successfully!", "item_id" => $item_id]);

} catch (\PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
