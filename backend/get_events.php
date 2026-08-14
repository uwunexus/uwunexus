<?php
require 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

$requester_id = isset($_GET['requester_id']) ? intval($_GET['requester_id']) : 0;
$status_filter = isset($_GET['status']) ? $_GET['status'] : 'approved';

try {
    // Admin or clubadmin can see all statuses
    if ($requester_id > 0) {
        $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
        $stmt->execute([$requester_id]);
        $req = $stmt->fetch();
        $isAdmin = $req && in_array($req['role'], ['superadmin', 'clubadmin']);
    } else {
        $isAdmin = false;
    }

    if ($isAdmin && $status_filter === 'all') {
        $sql = "SELECT e.*, u.full_name as creator_name, u.role as creator_role 
                FROM events e 
                LEFT JOIN users u ON e.created_by = u.id 
                ORDER BY e.created_at DESC";
        $stmt = $pdo->query($sql);
    } elseif ($isAdmin) {
        $stmt = $pdo->prepare("SELECT e.*, u.full_name as creator_name, u.role as creator_role 
                FROM events e 
                LEFT JOIN users u ON e.created_by = u.id 
                WHERE e.status = ? ORDER BY e.event_date ASC");
        $stmt->execute([$status_filter]);
    } else {
        // Public: only approved events
        $stmt = $pdo->prepare("SELECT e.*, u.full_name as creator_name 
                FROM events e 
                LEFT JOIN users u ON e.created_by = u.id 
                WHERE e.status = 'approved' ORDER BY e.event_date ASC");
        $stmt->execute();
    }

    $events = $stmt->fetchAll();
    echo json_encode(["success" => true, "events" => $events]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
