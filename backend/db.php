<?php
// Handle CORS globally for all API requests
$allowed_origin  = 'http://localhost:3000';
$frontend_url    = 'http://localhost:3000'; // Used for email links – override in config-prod.php
$host = '127.0.0.1';
$db   = 'uwunexus';
$user = 'root';
$pass = '';

if (file_exists(__DIR__ . '/config-prod.php')) {
    include __DIR__ . '/config-prod.php';
}

$backend_env_file = __DIR__ . '/.env';
if (file_exists($backend_env_file)) {
    $backend_env = parse_ini_file($backend_env_file);
    if ($backend_env && isset($backend_env['RESEND_API_KEY'])) {
        $resend_api_key = trim($backend_env['RESEND_API_KEY']);
    }
}

header('Access-Control-Allow-Origin: ' . $allowed_origin);
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Respond to Preflight requests immediately
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    // Local dev fallback: try alternative local dev credentials (root without password vs nilesh/12345678)
    try {
        $alt_user = ($user === 'root') ? 'nilesh' : 'root';
        $alt_pass = ($user === 'root') ? '12345678' : '';
        $pdo = new PDO($dsn, $alt_user, $alt_pass, $options);
    } catch (\PDOException $e2) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database connection failed"]);
        exit();
    }
}
?>
