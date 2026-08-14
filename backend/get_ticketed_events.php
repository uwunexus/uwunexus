<?php
require 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

$show_all = isset($_GET['all']) && $_GET['all'] === 'true';

try {
    if ($show_all) {
        // Admin view - get all ticketed events
        $stmt = $pdo->query("SELECT * FROM ticketed_events ORDER BY created_at DESC");
    } else {
        // Public view - get only active ticketed events
        $stmt = $pdo->query("SELECT * FROM ticketed_events WHERE status = 'active' ORDER BY event_date ASC, event_time ASC");
    }
    
    $events = $stmt->fetchAll();
    echo json_encode(["success" => true, "events" => $events]);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
