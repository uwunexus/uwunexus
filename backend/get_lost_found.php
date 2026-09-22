<?php
/**
 * [REST API - GET Endpoint]
 * Endpoint: /backend/get_lost_found.php
 * Method: GET
 * Description: Fetches all Lost & Found reports with joined user details and images.
 * Query Params (Optional): user_id, type ('Lost' | 'Found')
 * Frontend Usage: app/lost-and-found/page.tsx (fetchReports), app/admin/page.tsx
 */
require 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

$whereClauses = [];
$params = [];

if (isset($_GET['user_id'])) {
    $whereClauses[] = "l.user_id = ?";
    $params[] = intval($_GET['user_id']);
}

if (isset($_GET['type'])) {
    $whereClauses[] = "l.type = ?";
    $params[] = $_GET['type'];
}

$whereSql = '';
if (count($whereClauses) > 0) {
    $whereSql = "WHERE " . implode(" AND ", $whereClauses);
}

try {
    $query = "
        SELECT 
            l.id, l.title, l.description, l.location, l.time_date, l.type, l.status, l.contact_number, l.contact_email, l.created_at, l.user_id,
            u.full_name as reporter_name, u.email as reporter_email,
            GROUP_CONCAT(img.image_url) as images
        FROM lost_found_items l
        JOIN users u ON l.user_id = u.id
        LEFT JOIN lost_found_images img ON l.id = img.item_id
        $whereSql
        GROUP BY l.id
        ORDER BY l.created_at DESC
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($items as &$item) {
        $item['images'] = $item['images'] ? explode(',', $item['images']) : [];
    }

    echo json_encode(["success" => true, "items" => $items]);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
