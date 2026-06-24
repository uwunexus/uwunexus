<?php
require 'db.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['email']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing fields"]);
    exit();
}

$email = strtolower(trim($data['email']));
$password = $data['password'];

try {
    $stmt = $pdo->prepare("SELECT id, full_name, password_hash, role, enrollment_number, batch, degree, is_verified FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        if (!$user['is_verified']) {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Please verify your email address before logging in."]);
            exit();
        }

        echo json_encode([
            "success" => true,
            "message" => "Login successful",
            "user" => [
                "id" => $user['id'],
                "fullName" => $user['full_name'],
                "email" => $email,
                "role" => $user['role'],
                "enrollmentNumber" => $user['enrollment_number'],
                "batch" => $user['batch'],
                "degree" => $user['degree']
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Invalid email or password try again"]);
    }
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error"]);
}
?>
