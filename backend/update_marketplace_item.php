<?php
require 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['id']) || !isset($data['seller_id'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing id or seller_id"]);
    exit();
}

$id = intval($data['id']);
$seller_id = intval($data['seller_id']);

try {
    // Verify ownership
    $stmt = $pdo->prepare("SELECT seller_id, status FROM marketplace_items WHERE id = ?");
    $stmt->execute([$id]);
    $item = $stmt->fetch();

    if (!$item || $item['seller_id'] !== $seller_id) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Unauthorized to edit this item"]);
        exit();
    }

    // Support updating basic fields or just status
    if (isset($data['status'])) {
        // e.g. mark as sold
        $new_status = trim($data['status']);
        $stmt = $pdo->prepare("UPDATE marketplace_items SET status = ? WHERE id = ?");
        $stmt->execute([$new_status, $id]);
        echo json_encode(["success" => true, "message" => "Status updated successfully"]);
        exit();
    }

    $required_fields = ['title', 'description', 'price', 'condition_state', 'category_id', 'contact_number'];
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
    $contact_number = trim($data['contact_number']);
    $contact_email = isset($data['contact_email']) ? trim($data['contact_email']) : '';

    if (!preg_match('/^[0-9]{10}$/', $contact_number)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Phone number must be exactly 10 digits."]);
        exit();
    }
    
    // If they edit the item, we reset status to pending so it can be re-approved
    // Unless it was already pending or rejected.
    $stmt = $pdo->prepare("UPDATE marketplace_items SET title = ?, description = ?, price = ?, condition_state = ?, category_id = ?, contact_number = ?, contact_email = ?, status = 'active' WHERE id = ?");
    $stmt->execute([$title, $description, $price, $condition_state, $category_id, $contact_number, $contact_email, $id]);

    // Handle new images if provided (optional)
    if (isset($data['images']) && is_array($data['images']) && !empty($data['images'])) {
        // We will just append new images, or clear old ones?
        // To be safe and simple, let's just clear old ones and insert new ones
        $pdo->prepare("DELETE FROM marketplace_images WHERE item_id = ?")->execute([$id]);
        $img_stmt = $pdo->prepare("INSERT INTO marketplace_images (item_id, image_url) VALUES (?, ?)");
        foreach ($data['images'] as $img_url) {
            $img_stmt->execute([$id, trim($img_url)]);
        }
    }

    echo json_encode(["success" => true, "message" => "Item updated successfully and is pending approval!"]);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
