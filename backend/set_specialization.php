<?php
require 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['user_id']) || !isset($data['specialization'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing fields"]);
    exit();
}

$user_id = intval($data['user_id']);
$spec    = strtoupper(trim($data['specialization']));

// Valid specializations per base degree
$valid = [
    'MRT' => ['MPT', 'WST'],
    'SCT' => ['FEB', 'MST', 'MEC'],
];

try {
    $stmt = $pdo->prepare("SELECT degree FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "User not found"]);
        exit();
    }

    $base = strtoupper($user['degree']); // MRT or SCT

    if (!isset($valid[$base]) || !in_array($spec, $valid[$base])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid specialization '$spec' for degree '$base'"]);
        exit();
    }

    $pdo->prepare("UPDATE users SET specialization = ? WHERE id = ?")->execute([$spec, $user_id]);

    echo json_encode([
        "success"        => true,
        "message"        => "Specialization set to $spec",
        "resolved_degree" => "$base-$spec"
    ]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
