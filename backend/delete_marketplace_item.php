<?php
require 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['item_id']) || !isset($data['user_id'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing item_id or user_id"]);
    exit();
}

$item_id = $data['item_id'];
$user_id = $data['user_id'];
$user_role = isset($data['user_role']) ? $data['user_role'] : 'student';

try {
    $pdo->beginTransaction();

    // Check ownership or admin status
    $stmt = $pdo->prepare("SELECT seller_id FROM marketplace_items WHERE id = ?");
    $stmt->execute([$item_id]);
    $item = $stmt->fetch();

    if (!$item) {
        $pdo->rollBack();
        echo json_encode(["success" => false, "message" => "Item not found"]);
        exit();
    }

    if ($item['seller_id'] != $user_id && $user_role !== 'admin') {
        $pdo->rollBack();
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Unauthorized to delete this item"]);
        exit();
    }

    // Delete associated images
    $stmt_img = $pdo->prepare("DELETE FROM marketplace_images WHERE item_id = ?");
    $stmt_img->execute([$item_id]);

    // Delete the item
    $stmt_del = $pdo->prepare("DELETE FROM marketplace_items WHERE id = ?");
    $stmt_del->execute([$item_id]);

    $pdo->commit();

    echo json_encode(["success" => true, "message" => "Item deleted successfully"]);

} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
